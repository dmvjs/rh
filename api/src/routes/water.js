import { Hono } from 'hono'
import { authenticate } from '../middleware/auth.js'

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

// NWS alerts for Fairfax County VA
const NWS_ALERTS_URL = 'https://api.weather.gov/alerts/active?zone=VAC059'

// USGS WaterWatch flood stage thresholds
const WATERWATCH_URL = 'https://waterwatch.usgs.gov/webservices/floodstage?format=json'

// EPA SDWIS — drinking water violations for Fairfax Water (VA6059079)
const SDWIS_URL = 'https://data.epa.gov/efservice/VIOLATION/PWSID/VA6059079/JSON'

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

async function fetchFloodStages() {
  const res = await fetch(WATERWATCH_URL).catch(() => null)
  if (!res?.ok) return {}
  const data = await res.json()
  const out = {}
  for (const s of (data.sites ?? [])) {
    out[s.site_no] = {
      action:   parseFloat(s.action_stage)   || null,
      flood:    parseFloat(s.flood_stage)    || null,
      moderate: parseFloat(s.moderate_stage) || null,
      major:    parseFloat(s.major_stage)    || null,
    }
  }
  return out
}

async function fetchNWSAlerts() {
  const res = await fetch(NWS_ALERTS_URL, {
    headers: { 'User-Agent': 'ridgeleahills/1.0 (admin@ridgeleahills.com)', 'Accept': 'application/geo+json' },
  }).catch(() => null)
  if (!res?.ok) return []
  const data = await res.json()
  return (data.features ?? [])
    .filter(f => /(flood|water|hydro)/i.test(f.properties?.event ?? ''))
    .map(f => ({
      event:    f.properties.event,
      headline: f.properties.headline,
      severity: f.properties.severity,
      onset:    f.properties.onset,
      expires:  f.properties.expires,
      desc:     f.properties.description?.slice(0, 400),
    }))
}

async function fetchDrinkingWater() {
  const res = await fetch(SDWIS_URL).catch(() => null)
  if (!res?.ok) return []
  const data = await res.json().catch(() => [])
  // Return recent violations (last 5 years), most recent first
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 5)
  return data
    .filter(v => v.COMPL_PER_BEGIN_DATE && new Date(v.COMPL_PER_BEGIN_DATE) > cutoff)
    .sort((a, b) => (b.COMPL_PER_BEGIN_DATE ?? '').localeCompare(a.COMPL_PER_BEGIN_DATE ?? ''))
    .slice(0, 20)
    .map(v => ({
      violation:   v.VIOLATION_NAME,
      category:    v.VIOLATION_CATEGORY_CODE,
      beginDate:   v.COMPL_PER_BEGIN_DATE?.slice(0, 10),
      endDate:     v.COMPL_PER_END_DATE?.slice(0, 10),
      rtcDate:     v.RTC_DATE?.slice(0, 10),
      isHealthBased: v.IS_HEALTH_BASED_IND === 'Y',
    }))
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
  const CACHE_KEY = 'water:v3'
  const TTL       = 60 * 15 // 15 min — stream data changes frequently

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const [gauges, waterQuality, history, floodStages, alerts, drinkingWater] = await Promise.all([
    fetchStreamGauges().catch(() => []),
    fetchAttains().catch(() => []),
    fetchFloodStage().catch(() => null),
    fetchFloodStages().catch(() => ({})),
    fetchNWSAlerts().catch(() => []),
    fetchDrinkingWater().catch(() => []),
  ])

  // Attach flood stage thresholds to each gauge
  const gaugesWithStages = gauges.map(g => ({
    ...g,
    floodStages: floodStages[g.id] ?? null,
  }))

  const result = { gauges: gaugesWithStages, waterQuality, history, alerts, drinkingWater, fetchedAt: new Date().toISOString() }
  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
  return c.json(result)
})

export default router
