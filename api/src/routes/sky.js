import { Hono } from 'hono'

const router = new Hono()

const LAT = 38.84142   // 8800 Sandy Ridge Court
const LON = -77.25081

function easternTz() {
  const m = new Date().getUTCMonth() + 1
  return m >= 3 && m <= 11 ? -4 : -5
}

function easternDate() {
  const tz = easternTz()
  return new Date(Date.now() + tz * 3600000).toISOString().slice(0, 10)
}

// Abort fetch after `ms` milliseconds so one slow API can't stall the page
async function fetchT(url, ms = 6000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { signal: ctrl.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function getAstro(date, tz) {
  const r = await fetchT(
    `https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${LAT},${LON}&tz=${tz}`
  )
  if (!r.ok) throw new Error(`USNO ${r.status}`)
  const json = await r.json()
  return json.properties?.data ?? json
}

async function getPlanets() {
  const r = await fetchT(`https://api.visibleplanets.dev/v3?latitude=${LAT}&longitude=${LON}`)
  if (!r.ok) throw new Error(`planets ${r.status}`)
  const d = await r.json()
  return d.data ?? []
}

async function getApod(apiKey) {
  const r = await fetchT(`https://api.nasa.gov/planetary/apod?api_key=${apiKey ?? 'DEMO_KEY'}`)
  if (!r.ok) throw new Error(`APOD ${r.status}`)
  const d = await r.json()
  return {
    title:       d.title,
    explanation: d.explanation,
    url:         d.url,
    hdurl:       d.hdurl,
    mediaType:   d.media_type,
    date:        d.date,
    copyright:   d.copyright ?? null,
  }
}

async function getFlights() {
  // airplanes.live — free, no key, works from Cloudflare Workers
  // Returns alt in feet, speed in knots already
  const r = await fetchT(`https://api.airplanes.live/v2/point/${LAT}/${LON}/16`, 8000)
  if (!r.ok) throw new Error(`airplanes.live ${r.status}`)
  const data = await r.json()
  return (data.ac ?? [])
    .filter(a => a.lat && a.lon && a.alt_baro !== 'ground' && typeof a.alt_baro === 'number')
    .map(a => ({
      icao:     a.hex,
      callsign: (a.flight ?? '').trim() || null,
      type:     a.desc ?? a.t ?? null,
      lat:      a.lat,
      lon:      a.lon,
      altFt:    a.alt_baro,   // feet
      velKts:   a.gs ?? null, // knots
      heading:  a.track ?? null,
    }))
}

router.get('/', async (c) => {
  const kv   = c.env.CACHE
  const tz   = easternTz()
  const date = easternDate()

  async function cached(key, ttl, fn) {
    if (kv) {
      const hit = await kv.get(key)
      if (hit) return JSON.parse(hit)
    }
    const d = await fn()
    if (kv) await kv.put(key, JSON.stringify(d), { expirationTtl: ttl })
    return d
  }

  const [astroR, planetsR, flightsR, apodR] = await Promise.allSettled([
    cached(`sky:astro4:${date}`, 3600,  () => getAstro(date, tz)),
    cached('sky:planets:v2',    3600,  getPlanets),
    cached('sky:flights:v4',    300,   getFlights),
    cached(`sky:apod:${date}`,  86400, () => getApod(c.env.NASA_KEY)),
  ])

  return c.json({
    astro:     astroR.status   === 'fulfilled' ? astroR.value   : null,
    planets:   planetsR.status === 'fulfilled' ? planetsR.value : [],
    flights:   flightsR.status === 'fulfilled' ? flightsR.value : [],
    apod:      apodR.status    === 'fulfilled' ? apodR.value    : null,
    fetchedAt: new Date().toISOString(),
  })
})

router.get('/flights', async (c) => {
  const kv  = c.env.CACHE
  const key = 'sky:flights:v4'
  if (kv) {
    const hit = await kv.get(key)
    if (hit) return c.json({ flights: JSON.parse(hit) })
  }
  const flights = await getFlights().catch(() => [])
  if (kv) await kv.put(key, JSON.stringify(flights), { expirationTtl: 300 })
  return c.json({ flights })
})

export default router
