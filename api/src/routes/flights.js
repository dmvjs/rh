import { Hono } from 'hono'

const router = new Hono()

// Bounding box around Ridglea Hills / Falls Church / Annandale
// Covers DCA approach corridor and local airspace
const LAMIN = 38.78, LOMIN = -77.35, LAMAX = 38.92, LOMAX = -77.10

const OPENSKY_URL = 'https://opensky-network.org/api/states/all'

// Airline callsign prefix → name
const AIRLINES = {
  AAL: 'American', UAL: 'United', DAL: 'Delta', SWA: 'Southwest',
  JBU: 'JetBlue', ASA: 'Alaska', FFT: 'Frontier', NKS: 'Spirit',
  SCX: 'Sun Country', HAL: 'Hawaiian', WJA: 'WestJet', ACA: 'Air Canada',
  BAW: 'British Airways', DLH: 'Lufthansa', AFR: 'Air France',
  KLM: 'KLM', UAE: 'Emirates', QTR: 'Qatar', ETH: 'Ethiopian',
  GJS: 'GoJet/United Exp', RPA: 'Republic/United Exp', UCA: 'United Exp',
  SKW: 'SkyWest', OPT: 'Envoy/AA Exp', EJA: 'NetJets', FDX: 'FedEx',
  UPS: 'UPS', N: 'Private',
}

function airlineName(callsign) {
  if (!callsign?.trim()) return null
  const cs = callsign.trim()
  // 3-letter ICAO prefix
  const pfx3 = cs.slice(0, 3).toUpperCase()
  if (AIRLINES[pfx3]) return AIRLINES[pfx3]
  const pfx2 = cs.slice(0, 2).toUpperCase()
  if (AIRLINES[pfx2]) return AIRLINES[pfx2]
  // N-number = US private/GA
  if (/^N\d/.test(cs)) return 'General Aviation'
  return null
}

function metersToFeet(m) {
  return m != null ? Math.round(m * 3.28084) : null
}

function msToKnots(ms) {
  return ms != null ? Math.round(ms * 1.94384) : null
}

// Distance from neighborhood center in miles
const CENTER_LAT = 38.844, CENTER_LON = -77.250
function distMiles(lat, lon) {
  if (lat == null || lon == null) return null
  const R = 3958.8
  const dLat = (lat - CENTER_LAT) * Math.PI / 180
  const dLon = (lon - CENTER_LON) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(CENTER_LAT * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function cardinalHeading(deg) {
  if (deg == null) return null
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(deg / 45) % 8]
}

router.get('/', async (c) => {
  const kv = c.env.CACHE
  const CACHE_KEY = 'flights:v1'
  const TTL = 90 // 90 seconds — OpenSky throttles Cloudflare IPs, keep cache warm

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const params = new URLSearchParams({ lamin: LAMIN, lomin: LOMIN, lamax: LAMAX, lomax: LOMAX })
  const res = await fetch(`${OPENSKY_URL}?${params}`, {
    headers: { 'User-Agent': 'ridgeleahills/1.0 (admin@ridgeleahills.com)' },
  }).catch(() => null)

  if (!res?.ok) return c.json({ aircraft: [], fetchedAt: new Date().toISOString() })

  const data = await res.json()
  const states = (data.states ?? []).filter(s => !s[8]) // exclude ground vehicles

  const aircraft = states.map(s => {
    const altFt       = metersToFeet(s[7] ?? s[13])
    const vertRateFps = s[11] != null ? +(s[11] * 196.85).toFixed(0) : null // m/s → fpm
    const vertTrend   = vertRateFps == null ? null
      : vertRateFps > 200  ? 'climbing'
      : vertRateFps < -200 ? 'descending'
      : 'level'

    // Infer phase from altitude + vertical rate
    const phase = !altFt ? null
      : altFt < 1500  ? 'approach/departure'
      : altFt < 5000  ? (vertTrend === 'climbing' ? 'departing' : 'approaching')
      : altFt < 18000 ? 'low altitude'
      : 'cruise'

    return {
      icao:         s[0],
      callsign:     s[1]?.trim() || null,
      airline:      airlineName(s[1]),
      lat:          s[6],
      lon:          s[5],
      altFt,
      speedKts:     msToKnots(s[9]),
      heading:      s[10] != null ? Math.round(s[10]) : null,
      cardinal:     cardinalHeading(s[10]),
      vertFpm:      vertRateFps,
      vertTrend,
      phase,
      distMi:       distMiles(s[6], s[5]) != null ? +distMiles(s[6], s[5]).toFixed(1) : null,
      onGround:     s[8],
      squawk:       s[14] ?? null,
      country:      s[2],
    }
  })
  .filter(a => a.lat != null)
  .sort((a, b) => (a.distMi ?? 999) - (b.distMi ?? 999))

  const result = { aircraft, fetchedAt: new Date().toISOString() }
  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
  return c.json(result)
})

export default router
