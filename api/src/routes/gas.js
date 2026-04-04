import { Hono } from 'hono'

const router = new Hono()

const CACHE_KEY = 'gas:v4'
const TTL = 60 * 60 * 6  // 6 hours — EIA updates weekly

router.get('/', async (c) => {
  const key = c.env.EIA_KEY
  const kv  = c.env.CACHE

  if (!key) return c.json({ error: 'Not configured' }, 500)

  const debug = c.req.query('debug')
  if (!debug && kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const fetchArea = (area) => {
    const params = [
      `api_key=${key}`,
      `frequency=weekly`,
      `data[0]=value`,
      `facets[product][]=EPM0`,
      `facets[duoarea][]=${area}`,
      `sort[0][column]=period`,
      `sort[0][direction]=desc`,
      `length=60`,
    ].join('&')
    return fetch(`https://api.eia.gov/v2/petroleum/pri/gnd/data/?${params}`)
      .then(r => r.json())
      .then(j => (j.response?.data ?? [])
        .filter(r => r.value != null && r.value !== '')
        .map(r => ({ period: r.period, value: parseFloat(r.value) }))
      )
      .catch(() => [])
  }

  // Y35DC = Washington-Baltimore-Arlington-Alexandria metro area
  const [localRows, nationalRows] = await Promise.all([
    fetchArea('Y35DC'),
    fetchArea('NUS'),
  ])
  if (debug) return c.json({ local: localRows.slice(0, 3), national: nationalRows.slice(0, 3) })

  const rows = localRows.length ? localRows : nationalRows
  if (!rows.length) return c.json({ error: 'No data' }, 502)

  const hasLocal   = localRows.length > 0
  const current    = rows[0].value
  const prev       = rows[1]?.value ?? null
  const yearAgo    = rows[51]?.value ?? rows[rows.length - 1]?.value ?? null
  const natCurrent = nationalRows[0]?.value ?? null

  const change     = prev     != null ? Math.round((current - prev)    * 1000) / 1000 : null
  const yoyChange  = yearAgo  != null ? Math.round((current - yearAgo) * 1000) / 1000 : null
  const yoyPct     = yearAgo  != null ? Math.round(((current - yearAgo) / yearAgo) * 1000) / 10 : null
  const vsNat      = hasLocal && natCurrent != null
    ? Math.round((current - natCurrent) * 1000) / 1000 : null

  const values     = rows.map(r => r.value)
  const high52     = Math.round(Math.max(...values.slice(0, 52)) * 1000) / 1000
  const low52      = Math.round(Math.min(...values.slice(0, 52)) * 1000) / 1000
  const sparkline  = rows.slice(0, 12).map(r => r.value).reverse()

  const result = {
    period:    rows[0].period,
    areaLabel: hasLocal ? 'DC Metro' : 'U.S. National',
    current:   Math.round(current * 1000) / 1000,
    national:  natCurrent != null ? Math.round(natCurrent * 1000) / 1000 : null,
    vsNat,
    change,
    yoyChange,
    yoyPct,
    high52,
    low52,
    sparkline,
  }

  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
  return c.json(result)
})

export default router
