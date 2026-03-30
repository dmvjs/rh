import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { hashPassword, verifyPassword } from '../crypto.js'
import { notifyNewRegistration } from '../email.js'
import { authenticate } from '../middleware/auth.js'

const router = new Hono()

router.post('/register', async (c) => {
  const { name, email, password, address, phone, note } = await c.req.json().catch(() => ({}))

  if (!name || !email || !password || !address) {
    return c.json({ error: 'name, email, password, and address are required' }, 400)
  }

  const hash = await hashPassword(password)
  const user = {
    name:    name.trim(),
    email:   email.toLowerCase().trim(),
    address: address.trim(),
    phone:   phone?.trim() || null,
    note:    note?.trim()  || null,
  }

  const trusted = await c.env.DB.prepare('SELECT id FROM trusted_emails WHERE email = ?')
    .bind(user.email).first()
  const approved = trusted ? 1 : 0

  try {
    await c.env.DB.prepare(
      'INSERT INTO users (name, email, password_hash, address, phone, note, approved) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(user.name, user.email, hash, user.address, user.phone, user.note, approved).run()
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return c.json({ error: 'Email already registered' }, 409)
    throw err
  }

  if (!approved) {
    c.executionCtx.waitUntil(notifyNewRegistration(user, c.env))
  }

  return c.json({
    message: approved
      ? 'You\'re all set — sign in to get started.'
      : 'Registration received. You will be notified by email once approved.',
  })
})

router.post('/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}))

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email?.toLowerCase().trim()).first()

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  if (!user.approved) return c.json({ error: 'Your account is pending approval' }, 403)

  const token = await sign(
    { id: user.id, name: user.name, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
    c.env.JWT_SECRET
  )

  return c.json({ token, id: user.id, name: user.name, role: user.role })
})

router.post('/logout', (c) => {
  return c.json({ ok: true })
})

router.get('/me', authenticate, async (c) => {
  const { id } = c.get('user')
  const row = await c.env.DB.prepare(
    'SELECT id, name, email, role, address FROM users WHERE id = ?'
  ).bind(id).first()
  return c.json(row)
})

export default router
