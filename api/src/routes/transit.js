import { Hono } from 'hono'

const router = new Hono()

const LAT    = 38.841
const LON    = -77.252
const RADIUS = 700  // meters — covers walkable stops around Ridgelea Hills

const VIENNA      = 'K06'
const DUNN_LORING = 'K05'

const LINE_COLOR = {
  RD: '#BF0000', BL: '#0078AE', OR: '#ED8B00',
  SV: '#919D9D', GR: '#00B140', YL: '#FFD200',
}

async function wmata(path, key) {
  const res = await fetch(`https://api.wmata.com${path}`, {
    headers: { api_key: key },
  })
  if (!res.ok) return null
  const buf  = await res.arrayBuffer()
  const text = new TextDecoder('utf-8').decode(buf)
  return JSON.parse(text)
}

async function fetchRail(key) {
  const [trains, incidents] = await Promise.all([
    wmata(`/StationPrediction.svc/json/GetPrediction/${VIENNA},${DUNN_LORING}`, key),
    wmata('/Incidents.svc/json/Incidents', key),
  ])

  const all = trains?.Trains ?? []

  const formatStation = (code, name) => ({
    name,
    code,
    trains: all
      .filter(t => t.LocationCode === code && t.Min && t.Min !== '---' && t.Line !== 'No')
      .slice(0, 6)
      .map(t => ({
        line:  t.Line,
        color: LINE_COLOR[t.Line] ?? '#888',
        dest:  t.DestinationName,
        min:   t.Min,
        cars:  t.Car,
      })),
  })

  const alerts = (incidents?.Incidents ?? [])
    .filter(a => !a.StationCode || [VIENNA, DUNN_LORING].some(c => a.StationCode?.includes(c)))
    .map(a => a.Description)

  return {
    stations: [
      formatStation(VIENNA,      'Vienna / Fairfax-GMU'),
      formatStation(DUNN_LORING, 'Dunn Loring-Merrifield'),
    ],
    alerts,
  }
}

async function fetchBus(key) {
  const stops = await wmata(
    `/Bus.svc/json/jStops?Lat=${LAT}&Lon=${LON}&Radius=${RADIUS}`,
    key
  )
  if (!stops?.Stops?.length) return { stops: [], alerts: [] }

  // Limit to 6 closest stops, fetch predictions in parallel
  const nearby = stops.Stops.slice(0, 6)

  const [predictions, incidents] = await Promise.all([
    Promise.all(
      nearby.map(s =>
        wmata(`/NextBusService.svc/json/jPredictions?StopID=${s.StopID}`, key)
          .catch(() => null)
      )
    ),
    wmata('/Incidents.svc/json/BusIncidents', key),
  ])

  const activeStops = nearby
    .map((s, i) => ({
      id:       s.StopID,
      name:     s.Name,
      routes:   s.Routes,
      arrivals: (predictions[i]?.Predictions ?? []).slice(0, 4).map(p => ({
        route: p.RouteID,
        dest:  p.DirectionText,
        min:   p.Minutes,
      })),
    }))
    .filter(s => s.arrivals.length > 0)

  const nearbyRoutes = new Set(nearby.flatMap(s => s.Routes))
  const alerts = (incidents?.BusIncidents ?? [])
    .filter(a => a.RoutesAffected?.some(r => nearbyRoutes.has(r)))
    .map(a => a.Description)

  return { stops: activeStops, alerts }
}

router.get('/', async (c) => {
  const key = c.env.WMATA_KEY
  if (!key) return c.json({ error: 'WMATA_KEY not configured' }, 503)

  const kv        = c.env.CACHE
  const CACHE_KEY = 'transit:full'
  const TTL       = 60  // 1 minute — real-time data

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const [rail, bus] = await Promise.all([
    fetchRail(key).catch(() => ({ stations: [], alerts: [] })),
    fetchBus(key).catch(() => ({ stops: [], alerts: [] })),
  ])

  const result = { rail, bus, fetchedAt: new Date().toISOString() }

  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })

  return c.json(result)
})

export default router
