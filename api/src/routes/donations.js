import { Hono } from 'hono'

const router = new Hono()

// Zip codes covering Ridglea Hills / Annandale / Falls Church area
const ZIPS = ['22031']

const FEC_URL = 'https://api.open.fec.gov/v1/schedules/schedule_a/'

// Fetch contributions for a single zip + cycle
async function fetchForZip(zip, cycle, apiKey) {
  const params = new URLSearchParams({
    api_key:                    apiKey,
    contributor_zip:            zip,
    two_year_transaction_period: String(cycle),
    sort:                       '-contribution_receipt_date',
    per_page:                   '100',
  })
  const res = await fetch(`${FEC_URL}?${params}`).catch(() => null)
  if (!res?.ok) return []
  const data = await res.json()
  return (data.results ?? []).map(r => ({
    name:       r.contributor_name,
    employer:   r.contributor_employer,
    occupation: r.contributor_occupation,
    city:       r.contributor_city,
    zip:        r.contributor_zip?.slice(0, 5),
    amount:     r.contribution_receipt_amount,
    date:       r.contribution_receipt_date?.slice(0, 10),
    committee:  r.committee?.name ?? r.committee_id,
    candidate:  r.candidate?.name ?? null,
    cycle,
  }))
}

router.get('/', async (c) => {
  const kv      = c.env.CACHE
  const apiKey  = c.env.FEC_API_KEY ?? 'DEMO_KEY'
  const CACHE_KEY = 'donations:v2'
  const TTL       = 60 * 60 * 24 // 24h — FEC data is not real-time

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  // Fetch 2024 and 2022 cycles
  const allResults = await Promise.all(
    ZIPS.flatMap(zip => [2024, 2022].map(cycle => fetchForZip(zip, cycle, apiKey)))
  )

  const donations = allResults
    .flat()
    .filter(d => d.name && d.amount > 0)
    // Deduplicate by name+date+amount
    .filter((d, i, arr) =>
      arr.findIndex(x => x.name === d.name && x.date === d.date && x.amount === d.amount) === i
    )
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  const result = { donations, fetchedAt: new Date().toISOString() }
  if (kv && donations.length > 0) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
  return c.json(result)
})

export default router
