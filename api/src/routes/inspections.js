import { Hono } from 'hono'

const router = new Hono()

// Annandale / Falls Church / Bailey's Crossroads bounding box
const BBOX = { south: 38.80, west: -77.35, north: 38.90, east: -77.15 }

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// PLUS food permit layer — polygons in Fairfax county
const PLUS_EH_URL = 'https://www.fairfaxcounty.gov/gisint1/rest/services/PLUS/PLUSGISRecords/FeatureServer/6/query'

// Nominatim reverse geocode — only used as fallback
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

async function fetchOsmEstablishments() {
  const { south, west, north, east } = BBOX
  const query = `[out:json][timeout:30];
    (
      node["amenity"~"restaurant|fast_food|cafe|bar|food_court"](${south},${west},${north},${east});
      way["amenity"~"restaurant|fast_food|cafe|bar|food_court"](${south},${west},${north},${east});
    );
    out center 300;`

  const res = await fetch(OVERPASS_URL, {
    method:  'POST',
    body:    `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ridgeleahills/1.0' },
  }).catch(() => null)
  if (!res?.ok) return []

  const data = await res.json()
  return (data.elements ?? []).map(e => {
    const tags = e.tags ?? {}
    const lat  = e.lat ?? e.center?.lat
    const lon  = e.lon ?? e.center?.lon
    return {
      osmId:    e.id,
      name:     tags.name ?? null,
      cuisine:  tags.cuisine?.replace(/_/g, ' ') ?? null,
      amenity:  tags.amenity,
      address:  [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || null,
      city:     tags['addr:city'] ?? null,
      phone:    tags['contact:phone'] ?? tags.phone ?? null,
      website:  tags.website ?? tags['contact:website'] ?? null,
      lat, lon,
    }
  }).filter(e => e.name && e.lat && e.lon)
}

async function fetchPlusPermits() {
  const { south, west, north, east } = BBOX
  const params = new URLSearchParams({
    where:          "APPTYPEALIAS = 'Food Establishment Permit'",
    geometry:       `${west},${south},${east},${north}`,
    geometryType:   'esriGeometryEnvelope',
    inSR:           '4326',
    spatialRel:     'esriSpatialRelIntersects',
    outFields:      'RECORDID,LINK_URL,ISSUEDATE',
    returnGeometry:  'true',
    returnCentroid:  'true',
    outSR:           '4326',
    resultRecordCount: '500',
    f:              'json',
  })
  const res = await fetch(`${PLUS_EH_URL}?${params}`).catch(() => null)
  if (!res?.ok) return []

  const data = await res.json()
  return (data.features ?? []).map(f => ({
    id:      f.attributes.RECORDID,
    url:     f.attributes.LINK_URL,
    date:    f.attributes.ISSUEDATE ? new Date(f.attributes.ISSUEDATE).toISOString().slice(0, 10) : null,
    lat:     f.centroid?.y ?? null,
    lon:     f.centroid?.x ?? null,
  }))
}

// Match OSM establishment to nearest PLUS permit by lat/lon distance
function distDeg(a, b) {
  if (!a.lat || !b.lat) return Infinity
  const dlat = a.lat - b.lat, dlon = a.lon - b.lon
  return Math.sqrt(dlat * dlat + dlon * dlon)
}

router.get('/', async (c) => {
  const kv        = c.env.CACHE
  const CACHE_KEY = 'inspections:v3'
  const TTL       = 60 * 60 * 6

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const [osmPlaces, permits] = await Promise.all([
    fetchOsmEstablishments().catch(() => []),
    fetchPlusPermits().catch(() => []),
  ])

  // Match each OSM place to its nearest PLUS permit (within ~100m = 0.001 deg)
  const MATCH_THRESHOLD = 0.001
  const establishments = osmPlaces.map(place => {
    let nearest = null, nearestDist = Infinity
    for (const p of permits) {
      const d = distDeg(place, p)
      if (d < nearestDist) { nearestDist = d; nearest = p }
    }
    return {
      ...place,
      permitId:   nearestDist < MATCH_THRESHOLD ? nearest?.id   : null,
      permitUrl:  nearestDist < MATCH_THRESHOLD ? nearest?.url  : null,
      permitDate: nearestDist < MATCH_THRESHOLD ? nearest?.date : null,
    }
  }).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

  const result = { establishments, totalPermits: permits.length, fetchedAt: new Date().toISOString() }
  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
  return c.json(result)
})

export default router
