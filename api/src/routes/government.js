import { Hono } from 'hono'

const router = new Hono()

// Representative address for Ridgelea Hills — used for Civic API lookups
const CIVIC_ADDRESS = '7450 Little River Tpke, Annandale, VA 22003'

// Static extras for officials Google Civic doesn't reliably return (school board, etc.)
const STATIC_EXTRAS = [
  {
    level: 'County', title: 'School Board Member', name: 'Ricardy J. Anderson', party: 'D',
    district: 'Mason District — FCPS', term: 'Term through Dec 2027', photo: '',
    phones: [{ label: 'Office', number: '571-423-1083' }],
    website: 'https://www.fcps.edu/staff/ricardy-anderson',
    contact: 'https://www.fcps.edu/submit-question-ricardy-anderson',
    source: 'static',
  },
]

// Full static fallback when Civic API is unavailable
const STATIC_OFFICIALS = [
  {
    level: 'Federal', title: 'U.S. Senator', name: 'Mark R. Warner', party: 'D',
    district: 'Virginia', term: 'Up for re-election Nov 2026', photo: '',
    phones: [{ label: 'DC', number: '202-224-2023' }, { label: 'VA', number: '877-676-2759' }],
    website: 'https://www.warner.senate.gov',
    contact: 'https://www.warner.senate.gov/public/index.cfm/contact',
    source: 'static',
  },
  {
    level: 'Federal', title: 'U.S. Senator', name: 'Tim Kaine', party: 'D',
    district: 'Virginia', term: 'Term through 2030', photo: '',
    phones: [{ label: 'DC', number: '202-224-4024' }, { label: 'NoVA', number: '703-361-3192' }],
    website: 'https://www.kaine.senate.gov',
    contact: 'https://www.kaine.senate.gov/contact',
    source: 'static',
  },
  {
    level: 'Federal', title: 'U.S. Representative', name: 'James Walkinshaw', party: 'D',
    district: "Virginia's 11th Congressional District", term: 'Up for election Nov 2026', photo: '',
    phones: [],
    website: 'https://walkinshaw.house.gov',
    contact: 'https://walkinshaw.house.gov/contact',
    source: 'static',
  },
  {
    level: 'State', title: 'Governor', name: 'Abigail Spanberger', party: 'D',
    district: 'Virginia', term: 'Sworn in Jan 17, 2026', photo: '',
    phones: [{ label: 'Office', number: '804-786-2211' }],
    website: 'https://www.governor.virginia.gov',
    contact: 'https://www.governor.virginia.gov/contact/',
    source: 'static',
  },
  {
    level: 'State', title: 'Lieutenant Governor', name: 'Ghazala Hashmi', party: 'D',
    district: 'Virginia', term: 'Sworn in Jan 17, 2026', photo: '',
    phones: [{ label: 'Office', number: '804-593-2897' }],
    website: 'https://www.ltgov.virginia.gov',
    contact: 'mailto:ltgov43@ltgov.virginia.gov',
    source: 'static',
  },
  {
    level: 'State', title: 'Attorney General', name: 'Jay Jones', party: 'D',
    district: 'Virginia', term: 'Sworn in Jan 17, 2026', photo: '',
    phones: [{ label: 'Office', number: '804-786-2071' }],
    website: 'https://www.oag.state.va.us',
    contact: 'mailto:mailoag@oag.state.va.us',
    source: 'static',
  },
  {
    level: 'State', title: 'State Senator', name: 'David Marsden', party: 'D',
    district: 'Senate District 35', term: 'Term through Jan 2028', photo: '',
    phones: [{ label: 'District', number: '571-249-3037' }, { label: 'Richmond', number: '804-698-7535' }],
    website: 'https://apps.senate.virginia.gov/Senator/memberpage.php?id=S80',
    contact: 'mailto:senatormarsden@senate.virginia.gov',
    source: 'static',
  },
  {
    level: 'State', title: 'State Delegate', name: 'Vivian E. Watts', party: 'D',
    district: 'House District 14', term: 'Term through Jan 2028', photo: '',
    phones: [{ label: 'District', number: '703-978-2989' }, { label: 'Richmond', number: '804-698-1014' }],
    website: 'https://vivianwatts.com',
    contact: 'https://vivianwatts.com/contact/',
    source: 'static',
  },
  {
    level: 'County', title: 'Board of Supervisors', name: 'Andres F. Jimenez', party: 'D',
    district: 'Mason District', term: 'Term through Dec 2027', photo: '',
    phones: [{ label: 'Office', number: '703-256-7717' }],
    website: 'https://www.fairfaxcounty.gov/mason/home',
    contact: 'mailto:Mason@fairfaxcounty.gov',
    source: 'static',
  },
  {
    level: 'County', title: 'School Board Member', name: 'Ricardy J. Anderson', party: 'D',
    district: 'Mason District — FCPS', term: 'Term through Dec 2027', photo: '',
    phones: [{ label: 'Office', number: '571-423-1083' }],
    website: 'https://www.fcps.edu/staff/ricardy-anderson',
    contact: 'https://www.fcps.edu/submit-question-ricardy-anderson',
    source: 'static',
  },
]

const ELECTIONS = [
  { date: 'Apr 21, 2026', iso: '2026-04-21', label: 'Special election — VA redistricting referendum' },
  { date: 'Jun 19, 2026', iso: '2026-06-19', label: 'Early voting opens for August primary' },
  { date: 'Aug 4, 2026',  iso: '2026-08-04', label: 'Primary — U.S. Senate (Warner) · U.S. House VA-11' },
  { date: 'Oct 23, 2026', iso: '2026-10-23', label: 'Voter registration deadline for November general' },
  { date: 'Nov 3, 2026',  iso: '2026-11-03', label: 'General election — U.S. Senate · U.S. House' },
  { date: 'Nov 2027',     iso: '2027-11-01', label: 'Virginia House of Delegates elections (odd year)' },
]

const RESOURCES = [
  { label: 'Find your polling place',       url: 'https://www.fairfaxcounty.gov/elections/' },
  { label: 'My Neighborhood (Fairfax Co.)', url: 'https://www.fairfaxcounty.gov/myneighborhood' },
  { label: 'Virginia voter registration',   url: 'https://www.elections.virginia.gov/registration/' },
  { label: "Who's My Legislator (VA)",      url: 'https://whosmy.virginiageneralassembly.gov/' },
  { label: 'Virginia Dept. of Elections',   url: 'https://www.elections.virginia.gov/' },
]

// Bioguide IDs → official Congress portrait at bioguide.congress.gov
const BIOGUIDE = {
  'Mark R. Warner':       'W000805',
  'Tim Kaine':            'K000384',
  'Abigail Spanberger':   'S001209',
  'James Walkinshaw':     'W000830',
}

// Direct photo URLs for officials unlikely to appear on Wikipedia
const DIRECT_PHOTOS = {
  'Andres F. Jimenez':   'https://www.fairfaxcounty.gov/board/sites/board/files/assets/images/supervisors/jimenez.jpg',
  'Ricardy J. Anderson': 'https://www.fcps.edu/sites/default/files/media/photos/board-members/anderson-ricardy.jpg',
}

// Skip Wikipedia lookup for these — bad matches or low quality photos
const SKIP_WIKI = new Set(['David Marsden'])

const WIKI_HEADERS = { 'User-Agent': 'RidgeleaHills/1.0 (neighborhood info site)' }
const POLITICAL_RE = /senator|representative|governor|delegate|attorney general|supervisor|politician|virginia|county/i

// Fetch a Wikipedia photo using search + REST summary API with validation
async function wikiPhoto(name, hint) {
  try {
    const q = encodeURIComponent(`${name} ${hint}`)
    const search = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&srlimit=4`,
      { headers: WIKI_HEADERS }
    ).then(r => r.json())

    const results = search.query?.search ?? []
    if (!results.length) return ''

    // Prefer the result whose snippet mentions a political role
    const best = results.find(r => POLITICAL_RE.test(r.snippet ?? '')) ?? results[0]

    // REST summary API: cleaner, more stable, includes description for validation
    const summary = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(best.title)}`,
      { headers: WIKI_HEADERS }
    ).then(r => r.json())

    if (!summary.thumbnail?.source) return ''

    // Guard against matching a wrong person (place, concept, etc.)
    const desc = (summary.description ?? '') + (summary.extract ?? '')
    if (!POLITICAL_RE.test(desc) && !/american|politician|official/i.test(desc)) return ''

    return summary.thumbnail.source
  } catch { return '' }
}

async function enrichPhotos(officials) {
  return Promise.all(officials.map(async o => {
    if (o.photo) return o
    // 1. Bioguide official portrait
    const bgId = BIOGUIDE[o.name]
    if (bgId) return { ...o, photo: `https://bioguide.congress.gov/bioguide/photo/${bgId[0]}/${bgId}.jpg` }
    // 2. Direct known URL
    if (DIRECT_PHOTOS[o.name]) return { ...o, photo: DIRECT_PHOTOS[o.name] }
    // 3. Wikipedia — best-effort, result is cached with the rest
    if (SKIP_WIKI.has(o.name)) return o
    const hint  = o.level === 'State'  ? `Virginia ${o.title}`
                : o.level === 'County' ? `Fairfax County Virginia ${o.title}`
                : o.title
    const photo = await wikiPhoto(o.name, hint)
    return photo ? { ...o, photo } : o
  }))
}

const PARTY_MAP = {
  'Democratic': 'D', 'Democrat': 'D',
  'Republican': 'R',
  'Independent': 'I', 'Nonpartisan': 'I',
}

const LEVEL_MAP = {
  'country':             'Federal',
  'administrativeArea1': 'State',
  'administrativeArea2': 'County',
  'locality':            'County',
  'regional':            'County',
}

async function fetchCivic(key) {
  const url = `https://civicinfo.googleapis.com/civicinfo/v2/representatives`
    + `?address=${encodeURIComponent(CIVIC_ADDRESS)}&key=${key}`
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

function normalizeCivicData(data) {
  const officials = []
  for (const office of (data.offices ?? [])) {
    const level = LEVEL_MAP[office.levels?.[0]]
    if (!level) continue
    const divName = data.divisions?.[office.divisionId]?.name ?? ''
    for (const idx of (office.officialIndices ?? [])) {
      const o = data.officials?.[idx]
      if (!o) continue
      officials.push({
        level,
        title:    office.name,
        name:     o.name,
        party:    PARTY_MAP[o.party] ?? 'I',
        district: divName,
        term:     '',
        photo:    o.photoUrl ?? '',
        phones:   (o.phones ?? []).map((n, i) => ({ label: i === 0 ? 'Office' : 'Alt', number: n })),
        website:  o.urls?.[0] ?? '',
        contact:  o.emails?.[0]
          ? `mailto:${o.emails[0]}`
          : (o.urls?.[0] ?? ''),
        source: 'google',
      })
    }
  }
  return officials
}

router.get('/', async (c) => {
  const key = c.env.GOOGLE_CIVIC_KEY
  const kv  = c.env.CACHE
  const CACHE_KEY = 'government:v8'
  const TTL = 60 * 60 * 12  // 12 hours

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  let officials = STATIC_OFFICIALS
  let source    = 'static'

  if (key) {
    const data = await fetchCivic(key).catch(() => null)
    if (data?.offices?.length) {
      const civic = normalizeCivicData(data)
      const civicTitles = new Set(civic.map(o => o.title.toLowerCase()))
      const extras = STATIC_EXTRAS.filter(o => !civicTitles.has(o.title.toLowerCase()))
      officials = [...civic, ...extras]
      source    = 'google'
    }
  }

  officials = await enrichPhotos(officials)

  const result = {
    officials,
    elections: ELECTIONS,
    resources: RESOURCES,
    source,
    fetchedAt: new Date().toISOString(),
  }

  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })

  return c.json(result)
})

export default router
