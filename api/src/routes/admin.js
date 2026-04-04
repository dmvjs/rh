import { Hono } from 'hono'
import { requireModerator, requireAdmin } from '../middleware/auth.js'
import { hashEmail } from '../crypto.js'

const router = new Hono()

router.get('/users', requireModerator, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, name, substr(email_hash, 1, 8) as email_prefix, address, note, approved, email_verified, role, created_at
     FROM users ORDER BY approved ASC, created_at DESC`
  ).all()
  return c.json({ users: results })
})

router.post('/users/:id/approve', requireModerator, async (c) => {
  const id   = Number(c.req.param('id'))
  const user = await c.env.DB.prepare('SELECT address FROM users WHERE id = ?').bind(id).first()
  if (!user) return c.json({ error: 'User not found' }, 404)

  await c.env.DB.prepare('UPDATE users SET approved = 1 WHERE id = ?').bind(id).run()

  // geocode in background
  c.executionCtx.waitUntil(geocodeAndStore(user.address, id, c.env.DB))

  return c.json({ ok: true })
})

async function geocodeAndStore(address, id, db) {
  try {
    const q   = encodeURIComponent(`${address}, Falls Church, VA 22042, USA`)
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'User-Agent': 'ridgeleahills/1.0' },
    })
    const data = await res.json()
    if (data[0]) {
      await db.prepare('UPDATE users SET lat = ?, lng = ? WHERE id = ?')
        .bind(parseFloat(data[0].lat), parseFloat(data[0].lon), id).run()
    }
  } catch {}
}

router.post('/users/:id/reject', requireModerator, async (c) => {
  const user = await c.env.DB.prepare('SELECT approved FROM users WHERE id = ?')
    .bind(Number(c.req.param('id'))).first()
  if (!user) return c.json({ error: 'User not found' }, 404)
  if (user.approved) return c.json({ error: 'Cannot reject an already-approved user' }, 400)
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(Number(c.req.param('id'))).run()
  return c.json({ ok: true })
})

router.post('/users/:id/role', requireAdmin, async (c) => {
  const { role } = await c.req.json().catch(() => ({}))
  if (!['user', 'moderator', 'admin'].includes(role)) return c.json({ error: 'Invalid role' }, 400)
  if (Number(c.req.param('id')) === c.get('user').id) return c.json({ error: 'Cannot change your own role' }, 400)
  const { meta } = await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?')
    .bind(role, Number(c.req.param('id'))).run()
  if (!meta.changes) return c.json({ error: 'User not found' }, 404)
  return c.json({ ok: true })
})

router.delete('/users/:id', requireAdmin, async (c) => {
  if (Number(c.req.param('id')) === c.get('user').id) return c.json({ error: 'Cannot delete yourself' }, 400)
  const { meta } = await c.env.DB.prepare('DELETE FROM users WHERE id = ?')
    .bind(Number(c.req.param('id'))).run()
  if (!meta.changes) return c.json({ error: 'User not found' }, 404)
  return c.json({ ok: true })
})

router.delete('/listings/:id', requireModerator, async (c) => {
  const { meta } = await c.env.DB.prepare('UPDATE listings SET active = 0 WHERE id = ?')
    .bind(Number(c.req.param('id'))).run()
  if (!meta.changes) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

router.get('/trusted-emails', requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, address, substr(email_hash, 1, 8) as hash_prefix FROM trusted_emails ORDER BY address ASC'
  ).all()
  return c.json({ trusted: results })
})

router.post('/trusted-emails', requireAdmin, async (c) => {
  const { email, address } = await c.req.json().catch(() => ({}))
  if (!email || !address) return c.json({ error: 'email and address are required' }, 400)
  const email_hash = await hashEmail(email)
  try {
    await c.env.DB.prepare('INSERT INTO trusted_emails (email_hash, address) VALUES (?, ?)')
      .bind(email_hash, address.trim()).run()
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return c.json({ error: 'Email already in list' }, 409)
    throw err
  }
  return c.json({ ok: true })
})

router.delete('/trusted-emails/:id', requireAdmin, async (c) => {
  const { meta } = await c.env.DB.prepare('DELETE FROM trusted_emails WHERE id = ?')
    .bind(Number(c.req.param('id'))).run()
  if (!meta.changes) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

export default router
