import { Hono } from 'hono'

const router = new Hono()

// Representative address for Ridgelea Hills — used for district lookups
const CIVIC_ADDRESS = '7450 Little River Tpke, Annandale, VA 22003'

// Static fallback for officials Google Civic doesn't always include
// (county school board, etc.) — update after each election cycle
const STATIC_EXTRAS = [
  {
    level: 'County', title: 'School Board', name: 'Ricardy J. Anderson', party: 'D',
    district: 'Mason District — FCPS', term: 'Term through Dec 2027',
    phones: [{ label: 'Office', number: '571-423-1083' }],
    website: 'https://www.fcps.edu/staff/ricardy-anderson',
    contact: 'https://www.fcps.edu/submit-question-ricardy-anderson',
    source: 'static',
  },
]

const PARTY_MAP = {
  'Democratic': 'D', 'Democrat': 'D',
  'Republican': 'R',
  'Independent': 'I', 'Nonpartisan': 'I',
}

const LEVEL_MAP = {
  'country':           'Federal',
  'administrativeArea1': 'State',
  'administrativeArea2': 'County',
  'locality':          'County',
}

const ROLE_TITLE_MAP = {
  'headOfGovernment':          null,  // derive from office name
  'legislatorUpperBody':       null,
  'legislatorLowerBody':       null,
  'deputyHeadOfGovernment':    null,
  'governmentOfficer':         null,
  'executiveCouncil':          null,
  'highestCourtJudge':         null,
  'judge':                     null,
}

async function fetchCivic(key) {
  const url = `https://civicinfo.googleapis.com/civicinfo/v2/representatives`
    + `?address=${encodeURIComponent(CIVIC_ADDRESS)}&key=${key}`

  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

function parseOfficial(officeName, official, level) {
  const party = PARTY_MAP[official.party] ?? 'I'
  const phones = (official.phones ?? []).map((n, i) => ({
    label: i === 0 ? 'Office' : `Phone ${i + 1}`,
    number: n,
  }))
  const website = official.urls?.[0] ?? ''
  const contact = official.channels?.find(c => c.type === 'Email')?.id
    ? `mailto:${official.channels.find(c => c.type === 'Email').id}`
    : website

  return {
    level,
    title:   officeName,
    name:    official.name,
    party,
    district: '',
    term:    '',
    phones,
    website,
    contact,
    photo:   official.photoUrl ?? '',
    address: official.address?.[0]
      ? [official.address[0].line1, official.address[0].city, official.address[0].state].filter(Boolean).join(', ')
      : '',
    source: 'google',
  }
}

function normalizeCivicData(data) {
  const officials = []

  for (const office of (data.offices ?? [])) {
    const level = LEVEL_MAP[office.levels?.[0]] ?? 'Local'

    for (const idx of (office.officialIndices ?? [])) {
      const official = data.officials?.[idx]
      if (!official) continue
      officials.push(parseOfficial(office.name, official, level))
    }
  }

  return officials
}

router.get('/', async (c) => {
  const key = c.env.GOOGLE_CIVIC_KEY
  const kv  = c.env.CACHE
  const CACHE_KEY = 'government:officials:v2'
  const TTL = 60 * 60 * 12  // 12 hours — officials rarely change mid-day

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  if (!key) {
    return c.json({ officials: STATIC_EXTRAS, fetchedAt: new Date().toISOString(), source: 'static' })
  }

  const data = await fetchCivic(key).catch(() => null)
  if (!data) {
    return c.json({ officials: STATIC_EXTRAS, fetchedAt: new Date().toISOString(), source: 'static' })
  }

  const officials = [
    ...normalizeCivicData(data),
    ...STATIC_EXTRAS,
  ]

  const result = { officials, fetchedAt: new Date().toISOString(), source: 'google' }

  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })

  return c.json(result)
})

export default router
