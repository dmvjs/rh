import { Hono } from 'hono'

const router = new Hono()

// USGS stream gauges near Ridglea Hills / Falls Church / Annandale
// Accotink Creek near Annandale: 01654000
// Cameron Run at Alexandria: 01651770
// Long Branch near Annandale: 01651800
const GAUGES = [
  { id: '01654000', name: 'Accotink Creek',    location: 'near Annandale' },
  { id: '01651800', name: 'Long Branch',        location: 'near Annandale' },
  { id: '01651770', name: 'Cameron Run',        location: 'at Alexandria' },
]

// EPA ATTAINS — water quality assessments for local water bodies
const ATTAINS_URL = 'https://attains.epa.gov/attains-public/api/assessments'

// USGS NWIS — current conditions
const USGS_IV_URL = 'https://waterservices.usgs.gov/nwis/iv/'

// Virginia DEQ water quality — Accotink Creek HUC
const HUC8 = '02080105' // Middle Potomac-Anacostia-Occoquan

async function fetchStreamGauges() {
  const sites = GAUGES.map(g => g.id).join(',')
  const params = new URLSearchParams({
    sites,
    parameterCd: '00060,00065,00010', // discharge (cfs), gauge height (ft), water temp (C)
    siteStatus:  'active',
    format:      'json',
  })
  const res = await fetch(`${USGS_IV_URL}?${params}`).catch(() => null)
  if (!res?.ok) return []

  const data = await res.json()
  const ts   = data?.value?.timeSeries ?? []

  const byGauge = {}
  for (const t of ts) {
    const siteNo = t.sourceInfo?.siteCode?.[0]?.value
    const pCode  = t.variable?.variableCode?.[0]?.value
    const val    = t.values?.[0]?.value?.[0]
    if (!siteNo || !val) continue
    if (!byGauge[siteNo]) byGauge[siteNo] = {}
    byGauge[siteNo][pCode] = {
      value:    parseFloat(val.value),
      dateTime: val.dateTime,
      noData:   val.value === '-999999',
    }
  }

  return GAUGES.map(g => ({
    id:           g.id,
    name:         g.name,
    location:     g.location,
    discharge:    byGauge[g.id]?.['00060'] ?? null,  // cfs
    gaugeHeight:  byGauge[g.id]?.['00065'] ?? null,  // ft
    waterTemp:    byGauge[g.id]?.['00010'] ?? null,  // C
  }))
}

async function fetchAttains() {
  // Get water quality assessments for the HUC8 watershed
  const params = new URLSearchParams({
    huc:          HUC8,
    returnCountOnly: 'false',
    f:            'json',
  })
  const res = await fetch(`${ATTAINS_URL}?${params}`, {
    headers: { 'Accept': 'application/json' },
  }).catch(() => null)
  if (!res?.ok) return []

  const data = await res.json()
  const items = data?.items ?? []

  const results = []
  for (const item of items) {
    for (const wb of (item.waterBodies ?? [])) {
      // Only water bodies with impaired status or that are local creeks
      const name = wb.name ?? ''
      if (!/(accotink|long branch|cameron|holmes|lubber|pike|fourmile|pimmit|difficult run)/i.test(name) &&
          wb.overallStatus !== 'Cause') continue
      results.push({
        name:           wb.name,
        type:           wb.waterBodyType,
        status:         wb.overallStatus,           // 'Cause' = impaired, 'Meeting' = OK
        epaIrCategory:  wb.epaIrCategory,
        causes:         (wb.causes ?? []).map(c => c.causeName),
        useGroups:      (wb.useGroups ?? []).map(u => u.useGroupName),
      })
    }
  }
  return results
}

async function fetchFloodStage() {
  // USGS flood stage thresholds for Accotink Creek
  const params = new URLSearchParams({
    sites:       '01654000',
    service:     'iv',
    parameterCd: '00065',
    period:      'P30D',
    format:      'json',
  })
  const res = await fetch(`https://waterservices.usgs.gov/nwis/iv/?${params}`).catch(() => null)
  if (!res?.ok) return null

  const data  = await res.json()
  const vals  = data?.value?.timeSeries?.[0]?.values?.[0]?.value ?? []
  if (!vals.length) return null

  return vals.slice(-30 * 24).map(v => ({
    t: v.dateTime,
    v: parseFloat(v.value),
  })).filter(p => !isNaN(p.v))
}

router.get('/', async (c) => {
  const kv       = c.env.CACHE
  const CACHE_KEY = 'water:v2'
  const TTL       = 60 * 15 // 15 min — stream data changes frequently

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const [gauges, waterQuality, history] = await Promise.all([
    fetchStreamGauges().catch(() => []),
    fetchAttains().catch(() => []),
    fetchFloodStage().catch(() => null),
  ])

  const result = { gauges, waterQuality, history, fetchedAt: new Date().toISOString() }
  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
  return c.json(result)
})

export default router
