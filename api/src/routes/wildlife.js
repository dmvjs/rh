import { Hono } from 'hono'

const router = new Hono()

const CACHE_KEY = 'wildlife:v1'
const TTL       = 60 * 60 * 6 // 6 hours

const LAT    = 38.8398
const LNG    = -77.2504
const RADIUS = 8 // km

const GROUPS = [
  { key: 'Plantae',   label: 'Plants & Trees',         taxa: ['Plantae'] },
  { key: 'Mammalia',  label: 'Mammals',                taxa: ['Mammalia'] },
  { key: 'Insecta',   label: 'Insects',                taxa: ['Insecta', 'Arachnida'] },
  { key: 'Reptilia',  label: 'Reptiles & Amphibians',  taxa: ['Reptilia', 'Amphibia'] },
  { key: 'Fungi',     label: 'Fungi',                  taxa: ['Fungi'] },
  { key: 'Aves',      label: 'Birds',                  taxa: ['Aves'] },
]

function photoUrl(obs) {
  const url = obs.photos?.[0]?.url
  if (!url) return null
  return url.replace('/square.', '/medium.')
}

function mapObs(obs) {
  return {
    id:          obs.id,
    common_name: obs.taxon?.preferred_common_name ?? null,
    sci_name:    obs.taxon?.name ?? null,
    photo_url:   photoUrl(obs),
    observed_on: obs.observed_on ?? null,
    url:         obs.uri,
    taxon_id:    obs.taxon?.id ?? null,
  }
}

async function fetchGroup(taxa) {
  const results = await Promise.all(taxa.map(async (t) => {
    try {
      const params = new URLSearchParams({
        lat:           LAT,
        lng:           LNG,
        radius:        RADIUS,
        quality_grade: 'research',
        per_page:      50,
        order_by:      'observed_on',
        order:         'desc',
        photos:        'true',
        iconic_taxa:   t,
      })
      const res  = await fetch(`https://api.inaturalist.org/v1/observations?${params}`)
      if (!res.ok) return []
      const data = await res.json()
      return data.results ?? []
    } catch {
      return []
    }
  }))

  const seen = new Set()
  return results.flat()
    .map(mapObs)
    .filter(o => o.photo_url && o.taxon_id && o.sci_name)
    .filter(o => {
      if (seen.has(o.taxon_id)) return false
      seen.add(o.taxon_id)
      return true
    })
    .slice(0, 16)
}

router.get('/', async (c) => {
  const kv = c.env.CACHE

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  try {
    const groups = await Promise.all(
      GROUPS.map(async (g) => ({
        key:   g.key,
        label: g.label,
        items: await fetchGroup(g.taxa),
      }))
    )

    const total = new Set(
      groups.flatMap(g => g.items.map(o => o.taxon_id))
    ).size

    const result = {
      groups:     groups.filter(g => g.items.length > 0),
      total,
      updated_at: new Date().toISOString(),
    }

    if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })

    return c.json(result)
  } catch {
    return c.json({ error: 'Failed to fetch wildlife data' }, 500)
  }
})

export default router
