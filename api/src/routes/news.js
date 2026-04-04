import { Hono } from 'hono'

const router = new Hono()

const FEEDS = [
  'https://wtop.com/feed/',
  'https://www.wamu.org/feed',
  'https://ffxnow.com/feed/',
  'https://www.insidenova.com/search/?f=rss&t=article&c=news&l=50&s=start_time&sd=desc',
  'https://annandaletoday.com/feed/',
  'https://www.nbcwashington.com/news/local/northern-virginia/feed/',
  'https://www.fox5dc.com/rss/tags/us,va',
  'https://www.wusa9.com/feeds/syndication/rss/news',
  'https://patch.com/virginia/annandale/rss.xml',
  'https://patch.com/virginia/fairfax/rss.xml',
  'https://www.fairfaxtimes.com/feed/',
  'https://news.google.com/rss/search?q=Annandale+Virginia+news&hl=en-US&gl=US&ceid=US:en',
  // Neighborhood-specific searches — surface any mention of the community
  'https://news.google.com/rss/search?q=%22Ridgelea+Hills%22+Virginia&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=%22Ridglea+Hills%22+Virginia&hl=en-US&gl=US&ceid=US:en',
]

const LOCAL_FEEDS = [
  ...FEEDS,
  'https://arlnow.com/feed/',
  'https://fcpdnews.wordpress.com/feed/',
  'https://www.ffxnow.com/tag/crime/feed/',
  'https://www.ffxnow.com/tag/police/feed/',
  'https://www.insidenova.com/search/?f=rss&t=article&c=news/crime_police/fairfax&l=50&s=start_time&sd=desc',
]

// Distinctive names used to filter RSS articles (must be specific enough to avoid false positives)
const LOCAL_RE = /ridgelea|mantua|moss brooke|millbank|sandalwood|laro|bentwood|glade hill|sandy ridge|southlea/i

// All Mantua streets — used only for police CSV (already scoped to Fairfax County)
const POLICE_RE = /acosta|alba place|albion|amberley|autumn leaf|barbara lane|barkley|bentwood|blairmore|bosworth|briarbush|briary|brookings|cedar lane|chantal|chapel hill|chichester|christopher st|colchester brook|colesbury|convento|copeland pond|cordova place|coronado|courtley|cranleigh|crestview|delburne|denise lane|dorado|duvall|eakin park|edenvale|glade hill|glen court|glenbrook|goodview|grosvenor|(?<!new )guinea|guysborough|hamilton drive|hillside place|horner|karen drive|kilmarnock|kirkwood|kittery|landon court|laro|latrobe|laurel leaf|leghorn|lemington|lido place|lothbury|lynn regis|lynnhurst|mantua|mathy|maywood|midland road|mill springs|millbank|morningside|moss brooke|nutley|okla|olley|overbrook|parkside|pembridge|pentland|persimmon|petros|pixie|ponce place|prado place|prince william drive|readsborough|ridgelea|rocky mount|sandalwood|sandy ridge|santayana|skyview|southlea|southwick|st marks|st pauls|stonehurst|stoneleigh|swinburne|taylor drive|tovito|white clover|wynford/i

// Block-restricted streets: only match within these address number ranges
const BLOCK_RULES = [
  { re: /PINELAND/i,     min: 3800, max: 3921 },
  { re: /LEROY/i,        min: 8700, max: 8799 },
  { re: /LITTLE RIVER/i, min: 3921, max: 3921 },
  { re: /LITTLE RIVER/i, min: 8600, max: 9400 },
  { re: /PROSPERITY/i,   min: 3000, max: 3900 },
  { re: /ARLINGTON BLVD|ARLINGTON BOULEVARD/i, min: 8500, max: 9400 },
  { re: /PICKETT/i,      min: 3000, max: 3900 },
]

function isLocalAddress(addressRaw) {
  if (POLICE_RE.test(addressRaw)) return true
  const m = /^(\d+)\s+/.exec(addressRaw.trim())
  if (!m) return false
  const num = parseInt(m[1])
  return BLOCK_RULES.some(r => r.re.test(addressRaw) && num >= r.min && num <= r.max)
}

// General news must mention this region to pass — keep specific to avoid metro noise
const AREA_RE = /\b(fairfax|annandale|arlington|alexandria|falls church|tysons|mclean|vienna|herndon|reston|loudoun|sterling|ashburn|leesburg|chantilly|centreville|springfield|burke|mantua|prince william|manassas|NoVA|northern virginia|washington dc|washington, dc)\b/i

const BLOCKED_DOMAINS = new Set([
  'telemundo.com', 'telemundo47.com', 'noticias.telemundo.com',
  'univision.com', 'univisionnoticias.com',
  'elnuevoherald.com', 'lavozdehouston.com',
  'legacy.com', 'tributes.com', 'dignitymemorial.com',
  'wjla.com',
])

// Rough English-only check — skip if title has too many accented/non-Latin characters
function looksEnglish(text) {
  if (!text) return true
  const nonAscii = (text.match(/[^\x00-\x7F]/g) ?? []).length
  return nonAscii / text.length < 0.1
}

function decodeEntities(s) {
  if (!s) return s
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function extractVideo(block) {
  const m = /media:content[^>]+type=["']video[^"']*["'][^>]+url=["']([^"']+)["']|media:content[^>]+url=["']([^"']+)["'][^>]+type=["']video[^"']*["']/.exec(block)
  return m ? (m[1] || m[2]) : null
}

function extractImage(block) {
  let m = /media:content[^>]+url=["']([^"']+)["']/.exec(block)
  if (m) return m[1]
  m = /media:thumbnail[^>]+url=["']([^"']+)["']/.exec(block)
  if (m) return m[1]
  m = /<enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/.exec(block)
  if (m) return m[1]
  m = /<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image[^"']*["']/.exec(block)
  if (m) return m[1]
  m = /<img[^>]+src=["']([^"']+)["']/.exec(block)
  if (m && !m[1].includes('tracking') && !m[1].includes('pixel')) return m[1]
  return null
}

function parseXml(xml) {
  const items = []
  const itemRx = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = itemRx.exec(xml)) !== null) {
    const block = m[1]
    const get   = (tag) => {
      const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`)
      const x = r.exec(block)
      return x ? x[1].trim() : null
    }

    const title   = decodeEntities(get('title'))
    const link    = get('link')
    const pubDate = get('pubDate')
    const video   = extractVideo(block)
    const image   = video ? null : extractImage(block)
    const author  = get('dc:creator') || get('author') || null

    const rawDesc = get('description') || get('content:encoded') || ''
    const snippet = decodeEntities(rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 140) || null

    let domain = null
    try { domain = new URL(link).hostname.replace(/^www\./, '') } catch {}

    const skipRe = /\b(murder(ed|s|ing)?|shooting|bomb(ed|ing|s)?|terror(ist|ism)?|death row|massacre|execut(ed|ion)|hostage|riot(s|ing)?|gunman|gunfire|arson|overdose|suicide|birth defect)\b/i
    const checkText = `${title ?? ''} ${snippet ?? ''}`
    const skip = /daily debrief|morning notes|news recap|obituar|\bglance\b|scoreboard|standings|box score|\bw l t\b/i.test(title ?? '')
      || skipRe.test(checkText)
    if (title && link && !skip) items.push({ title, url: link, image, video, publishedAt: pubDate, author, snippet, domain })
  }
  return items
}

function fetchFeed(url) {
  return fetch(url, { headers: { 'User-Agent': 'ridgeleahills/1.0' } })
    .then(r => r.text())
    .then(parseXml)
}

router.get('/', async (c) => {
  const kv = c.env.CACHE
  const CACHE_KEY = 'news:v3'
  const TTL = 60 * 20

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const results = await Promise.allSettled(FEEDS.map(fetchFeed))

  const all = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(a => {
      if (BLOCKED_DOMAINS.has(a.domain)) return false
      if (!looksEnglish(a.title)) return false
      const age = Date.now() - new Date(a.publishedAt)
      if (age > 14 * 24 * 60 * 60 * 1000) return false
      const text = `${a.title ?? ''} ${a.snippet ?? ''}`
      return AREA_RE.test(text)
    })
    .map(a => ({
      ...a,
      local: LOCAL_RE.test(`${a.title ?? ''} ${a.snippet ?? ''}`),
    }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  // Local stories always float to the top
  const localItems    = all.filter(a => a.local)
  const regionalItems = all.filter(a => !a.local)

  const seenTitles = new Set()
  const domainCount = {}

  function admit(a) {
    const titleKey = (a.title ?? '').toLowerCase().replace(/\W+/g, ' ').trim().slice(0, 60)
    if (seenTitles.has(titleKey)) return false
    seenTitles.add(titleKey)
    if (!a.local) {
      domainCount[a.domain] = (domainCount[a.domain] ?? 0) + 1
      if (domainCount[a.domain] > 3) return false
    }
    return true
  }

  const articles = [
    ...localItems.filter(admit),
    ...regionalItems.filter(admit),
  ].slice(0, 12)

  const result = { articles }
  if (kv && articles.length > 0) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
  return c.json(result)
})

function parsePoliceRow(line) {
  const delimiter = line.includes('\t') ? '\t' : ','
  const parts = line.split(delimiter).map(p => p.trim())

  // Anchor on the date field (YYYY-MM-DD) — robust regardless of leading fields
  const dateIdx = parts.findIndex(p => /^\d{4}-\d{2}-\d{2}$/.test(p))
  if (dateIdx < 1) return null

  const desc       = parts[dateIdx - 1]
  const date       = parts[dateIdx]
  const time       = parts[dateIdx + 1]
  const addressRaw = parts[dateIdx + 2]

  if (!desc || !time || !addressRaw) return null

  const address = addressRaw.split(';')[0].trim()
  const type    = desc.replace(/\s*\([^)]+\)\s*$/, '').trim()
  const t       = time.padStart(4, '0')
  const timeStr = `${t.slice(0, 2)}:${t.slice(2, 4)}`

  return { type, address, date, time: timeStr, _raw: addressRaw }
}

async function fetchPolice(kv) {
  const CACHE_KEY = 'police:report'
  const TTL = 60 * 60 // 1 hour

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return JSON.parse(cached)
  }

  const res = await fetch('https://www.fairfaxcounty.gov/apps/pfsu/api/file/crimereportsfromsp', {
    headers: { 'User-Agent': 'ridgeleahills/1.0' },
  })
  const text = await res.text()
  const lines = text.trim().split('\n')

  const seen = new Set()
  const incidents = []

  for (const line of lines) {
    const row = parsePoliceRow(line)
    if (!row) continue
    if (!isLocalAddress(row._raw)) continue

    const key = `${row.date}|${row.time}|${row._raw}`
    if (seen.has(key)) continue
    seen.add(key)

    const { _raw, ...incident } = row
    incidents.push(incident)
  }

  incidents.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))

  const result = { incidents, nearby: false }

  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })

  return result
}

router.get('/local', async (c) => {
  const kv = c.env.CACHE
  const CACHE_KEY = 'news-local:v2'
  const TTL = 60 * 20

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const [feedResults, policeResult] = await Promise.all([
    Promise.allSettled(LOCAL_FEEDS.map(fetchFeed)),
    fetchPolice(c.env.CACHE).catch(() => ({ incidents: [], nearby: false })),
  ])
  const police = policeResult

  const seen = new Set()
  const local = feedResults
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(a => {
      if (BLOCKED_DOMAINS.has(a.domain)) return false
      if (!looksEnglish(a.title)) return false
      const age = Date.now() - new Date(a.publishedAt)
      if (age > 90 * 24 * 60 * 60 * 1000) return false
      const text = `${a.title ?? ''} ${a.snippet ?? ''}`
      return LOCAL_RE.test(text)
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .filter(a => {
      if (seen.has(a.url)) return false
      seen.add(a.url)
      return true
    })
    .slice(0, 20)

  const result = { local, police: police.incidents }
  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
  return c.json(result)
})

export default router
