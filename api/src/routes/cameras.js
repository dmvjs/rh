import { Hono } from 'hono'
import { authenticate } from '../middleware/auth.js'

const router = new Hono()

const CACHE_KEY = 'cameras:incidents:v1'
const TTL = 60 * 5  // 5 minutes — trade-off between freshness and API usage

// Bounding box covering I-495 and VA-236 corridors near Ridgelea Hills
// format: minLon,minLat,maxLon,maxLat (EPSG:4326)
const BBOX = '-77.32,38.78,-77.15,38.90'

const FIELDS = encodeURIComponent(
  '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},from,to,delay,roadNumbers}}}'
)

// TomTom iconCategory codes relevant to drivers
// 1=accident, 3=dangerous conditions, 6=jam, 7=lane closed,
// 8=road closed, 9=roadworks, 11=flooding, 14=breakdown
const KEEP = new Set([1, 3, 6, 7, 8, 9, 11, 14])

const CATEGORY_LABEL = {
  1: 'Accident', 3: 'Hazard', 6: 'Traffic Jam', 7: 'Lane Closed',
  8: 'Road Closed', 9: 'Roadworks', 11: 'Flooding', 14: 'Breakdown',
}

// magnitudeOfDelay: 0=unknown, 1=minor, 2=moderate, 3=major
const SEVERITY_LABEL = { 0: '', 1: 'Minor', 2: 'Moderate', 3: 'Major' }

function mapIncident(inc) {
  const p = inc.properties
  return {
    id:          p.id,
    category:    CATEGORY_LABEL[p.iconCategory] ?? 'Incident',
    severity:    p.magnitudeOfDelay ?? 0,
    sev_label:   SEVERITY_LABEL[p.magnitudeOfDelay ?? 0] ?? '',
    description: p.events?.[0]?.description ?? '',
    from:        p.from ?? '',
    to:          p.to ?? '',
    roads:       p.roadNumbers ?? [],
    delay_min:   p.delay ? Math.round(p.delay / 60) : 0,
  }
}

router.get('/incidents', authenticate, async (c) => {
  const key = c.env.TOMTOM_KEY
  const kv  = c.env.CACHE

  if (!key) return c.json({ incidents: [], fetchedAt: new Date().toISOString() })

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  try {
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails`
      + `?key=${key}&bbox=${BBOX}&fields=${FIELDS}`
      + `&language=en-US&timeValidityFilter=present`

    const res  = await fetch(url)
    if (!res.ok) return c.json({ incidents: [], fetchedAt: new Date().toISOString() })

    const data = await res.json()
    const incidents = (data.incidents ?? [])
      .filter(inc => KEEP.has(inc.properties?.iconCategory))
      .filter(inc => (inc.properties?.magnitudeOfDelay ?? 0) >= 1)
      .map(mapIncident)
      .sort((a, b) => b.severity - a.severity)

    const result = { incidents, fetchedAt: new Date().toISOString() }
    if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
    return c.json(result)
  } catch {
    return c.json({ incidents: [], fetchedAt: new Date().toISOString() })
  }
})

export default router
