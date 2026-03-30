import { Hono } from 'hono'
import { authenticate } from '../middleware/auth.js'

const router = new Hono()

const CATEGORIES = new Set([
  'for-sale', 'free', 'services', 'lost-found', 'events', 'recommendations',
])

const parse = (row) => ({ ...row, images: JSON.parse(row.images) })

router.get('/', async (c) => {
  const { category, limit = '50', offset = '0' } = c.req.query()
  const safeLimit  = Math.min(Math.max(Number(limit)  || 0, 0), 100)
  const safeOffset = Math.max(Number(offset) || 0, 0)
  const now = Math.floor(Date.now() / 1000)

  if (category && !CATEGORIES.has(category)) return c.json({ listings: [] })

  const { results } = category
    ? await c.env.DB.prepare(
        `SELECT l.id, l.category, l.title, l.price, l.images, l.created_at, u.name AS author
         FROM listings l JOIN users u ON u.id = l.user_id
         WHERE l.active = 1 AND l.expires_at > ? AND l.category = ?
         ORDER BY l.created_at DESC LIMIT ? OFFSET ?`
      ).bind(now, category, safeLimit, safeOffset).all()
    : await c.env.DB.prepare(
        `SELECT l.id, l.category, l.title, l.price, l.images, l.created_at, u.name AS author
         FROM listings l JOIN users u ON u.id = l.user_id
         WHERE l.active = 1 AND l.expires_at > ?
         ORDER BY l.created_at DESC LIMIT ? OFFSET ?`
      ).bind(now, safeLimit, safeOffset).all()

  return c.json({ listings: results.map(parse) })
})

router.get('/mine', authenticate, async (c) => {
  const { id } = c.get('user')
  const { results } = await c.env.DB.prepare(
    'SELECT id, category, title, price, images, active, created_at, expires_at FROM listings WHERE user_id = ? AND active = 1 ORDER BY created_at DESC'
  ).bind(id).all()
  return c.json({ listings: results.map(parse) })
})

router.get('/:id', async (c) => {
  const listing = await c.env.DB.prepare(
    'SELECT l.*, u.name AS author, u.email AS author_email FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ? AND l.active = 1'
  ).bind(Number(c.req.param('id'))).first()
  if (!listing) return c.json({ error: 'Not found' }, 404)

  // only expose author email to authenticated users
  const token = c.req.header('Authorization')?.slice(7)
  if (!token) delete listing.author_email

  return c.json(parse(listing))
})

router.post('/', authenticate, async (c) => {
  const { id, role } = c.get('user')
  const { category, title, body, price, images = [], contact_email, contact_phone } = await c.req.json().catch(() => ({}))

  if (!category || !title || !body) return c.json({ error: 'category, title, and body are required' }, 400)
  if (!CATEGORIES.has(category)) return c.json({ error: 'Invalid category' }, 400)

  const { meta } = await c.env.DB.prepare(
    'INSERT INTO listings (user_id, category, title, body, price, images, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, category, title.trim(), body.trim(),
    price != null ? Math.round(Number(price) * 100) : null,
    JSON.stringify(images),
    contact_email?.trim() || null,
    contact_phone?.trim() || null,
  ).run()

  return c.json({ id: meta.last_row_id }, 201)
})

router.delete('/:id', authenticate, async (c) => {
  const { id, role } = c.get('user')
  const listing = await c.env.DB.prepare('SELECT user_id FROM listings WHERE id = ?')
    .bind(Number(c.req.param('id'))).first()
  if (!listing) return c.json({ error: 'Not found' }, 404)
  if (listing.user_id !== id && role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
  await c.env.DB.prepare('UPDATE listings SET active = 0 WHERE id = ?').bind(Number(c.req.param('id'))).run()
  return c.json({ ok: true })
})

export default router
