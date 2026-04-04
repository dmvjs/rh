import { Hono } from 'hono'
import { authenticate } from '../middleware/auth.js'

const router = new Hono()

const FEEDS = [
  'https://www.fairfaxcounty.gov/emergency/rss.xml',
  'https://www.fairfaxcounty.gov/publicworks/rss.xml',
  'https://www.fairfaxcounty.gov/parks/rss.xml',
]

function decodeEntities(s) {
  if (!s) return s
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
}

function parseRss(xml, source) {
  const items = []
  const itemRx = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = itemRx.exec(xml)) !== null) {
    const block = m[1]
    const get = tag => {
      const r = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`)
      const x = r.exec(block)
      return x ? x[1].trim() : null
    }
    const title   = decodeEntities(get('title'))
    const link    = get('link')
    const pubDate = get('pubDate')
    const desc    = get('description') || ''
    const snippet = decodeEntities(desc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 200) || null

    if (!title) continue
    const age = Date.now() - new Date(pubDate)
    if (age > 14 * 24 * 60 * 60 * 1000) continue  // skip older than 14 days

    items.push({ title, url: link, snippet, publishedAt: pubDate, source })
  }
  return items
}

router.get('/', authenticate, async (c) => {
  const kv = c.env.CACHE
  const CACHE_KEY = 'alerts:v1'
  const TTL = 60 * 15  // 15 min — these matter more if fresh

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const results = await Promise.allSettled(
    FEEDS.map(url =>
      fetch(url, { headers: { 'User-Agent': 'ridgeleahills/1.0' } })
        .then(r => r.text())
        .then(xml => parseRss(xml, new URL(url).pathname.split('/')[1]))
    )
  )

  const seen = new Set()
  const alerts = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .filter(a => {
      if (seen.has(a.title)) return false
      seen.add(a.title)
      return true
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  const result = { alerts, fetchedAt: new Date().toISOString() }
  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
  return c.json(result)
})

export default router
