import { Hono } from 'hono'

const router = new Hono()

const CENTER = [38.8398, -77.2504]
const RADIUS = 4000 // metres

const CACHE_KEY = 'parks:v1'
const TTL       = 60 * 60 * 24 // 24 hours

router.get('/', async (c) => {
  const kv = c.env.CACHE

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const types = 'park|playground|recreation_ground|sports_centre|pitch|golf_course|garden'
  const query = `
    [out:json][timeout:25];
    (
      node["leisure"~"^(${types})$"](around:${RADIUS},${CENTER[0]},${CENTER[1]});
      way["leisure"~"^(${types})$"](around:${RADIUS},${CENTER[0]},${CENTER[1]});
      relation["leisure"~"^(${types})$"](around:${RADIUS},${CENTER[0]},${CENTER[1]});
    );
    out center tags;
  `

  const res  = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query })
  const data = await res.json()

  const parks = data.elements
    .filter(e => e.tags?.name)
    .map(e => ({
      id:          e.id,
      name:        e.tags.name,
      type:        e.tags.leisure,
      lat:         e.lat ?? e.center?.lat,
      lng:         e.lon ?? e.center?.lon,
      website:     e.tags.website      ?? null,
      hours:       e.tags.opening_hours ?? null,
      sport:       e.tags.sport        ?? null,
      description: e.tags.description  ?? null,
      dog:         e.tags.dog          ?? null,
      fee:         e.tags.fee          ?? null,
      wheelchair:  e.tags.wheelchair   ?? null,
      lit:         e.tags.lit          ?? null,
      playground:  e.tags.playground   ?? null,
    }))
    .filter(p => p.lat && p.lng)

  const result = { parks }

  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })

  return c.json(result)
})

export default router
