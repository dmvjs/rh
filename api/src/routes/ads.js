import { Hono } from 'hono'
import { requireAdmin } from '../middleware/auth.js'

const router = new Hono()

// Public — returns all active ads grouped by size for client-side rotation
router.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, size, image_url, click_url FROM ads WHERE active = 1 ORDER BY created_at DESC`
  ).all()

  const grouped = {}
  for (const ad of results) {
    if (!grouped[ad.size]) grouped[ad.size] = []
    grouped[ad.size].push(ad)
  }
  return c.json(grouped)
})

// Admin CRUD
router.get('/admin', requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, name, size, image_url, click_url, active, created_at FROM ads ORDER BY created_at DESC`
  ).all()
  return c.json({ ads: results })
})

router.post('/admin', requireAdmin, async (c) => {
  const { name, size, image_url, click_url } = await c.req.json().catch(() => ({}))
  if (!name || !size || !image_url || !click_url) return c.json({ error: 'Missing fields' }, 400)
  if (!['970x66', '160x600', '320x50', '300x250'].includes(size)) return c.json({ error: 'Invalid size' }, 400)
  const { meta } = await c.env.DB.prepare(
    `INSERT INTO ads (name, size, image_url, click_url) VALUES (?, ?, ?, ?)`
  ).bind(name, size, image_url, click_url).run()
  return c.json({ ok: true, id: meta.last_row_id })
})

router.post('/admin/:id/toggle', requireAdmin, async (c) => {
  const { meta } = await c.env.DB.prepare(
    `UPDATE ads SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?`
  ).bind(Number(c.req.param('id'))).run()
  if (!meta.changes) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

router.delete('/admin/:id', requireAdmin, async (c) => {
  const { meta } = await c.env.DB.prepare(`DELETE FROM ads WHERE id = ?`)
    .bind(Number(c.req.param('id'))).run()
  if (!meta.changes) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

export default router
