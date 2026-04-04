import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { hashPassword, verifyPassword, hashEmail } from '../crypto.js'
import { sendVerificationEmail, sendPasswordResetEmail, notifyNewRegistration } from '../email.js'
import { authenticate } from '../middleware/auth.js'

const router = new Hono()

const TOKEN_TTL = 60 * 60 * 24 // 24 hours

router.post('/register', async (c) => {
  const { name, email, password, address, note } = await c.req.json().catch(() => ({}))

  if (!name || !email || !password || !address) {
    return c.json({ error: 'name, email, password, and address are required' }, 400)
  }

  const hash      = await hashPassword(password)
  const emailHash = await hashEmail(email)
  const user      = {
    name:    name.trim(),
    email:   email.toLowerCase().trim(),
    address: address.trim(),
    note:    note?.trim() || null,
  }

  const trusted  = await c.env.DB.prepare('SELECT id FROM trusted_emails WHERE email_hash = ?')
    .bind(emailHash).first()
  const approved = trusted ? 1 : 0

  let userId
  try {
    const { meta } = await c.env.DB.prepare(
      'INSERT INTO users (name, email_hash, password_hash, address, note, approved) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(user.name, emailHash, hash, user.address, user.note, approved).run()
    userId = meta.last_row_id
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return c.json({ error: 'Email already registered' }, 409)
    throw err
  }

  const token = crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO verification_tokens (user_id, token) VALUES (?, ?)'
  ).bind(userId, token).run()

  c.executionCtx.waitUntil(sendVerificationEmail(user.email, token, c.env))

  return c.json({
    message: trusted
      ? 'Check your email to confirm your address, then you\'re all set.'
      : 'Check your email to confirm your address, then your registration will be reviewed.',
  })
})

router.get('/verify', async (c) => {
  const token = c.req.query('token')
  if (!token) return c.json({ error: 'Missing token' }, 400)

  const row = await c.env.DB.prepare(
    'SELECT user_id, created_at FROM verification_tokens WHERE token = ?'
  ).bind(token).first()

  if (!row) return c.json({ error: 'Invalid or expired link' }, 400)

  const age = Math.floor(Date.now() / 1000) - row.created_at
  if (age > TOKEN_TTL) {
    await c.env.DB.prepare('DELETE FROM verification_tokens WHERE token = ?').bind(token).run()
    return c.json({ error: 'This link has expired. Please register again.' }, 400)
  }

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(row.user_id).first()
  if (!user) return c.json({ error: 'Account not found' }, 404)

  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').bind(row.user_id),
    c.env.DB.prepare('DELETE FROM verification_tokens WHERE token = ?').bind(token),
  ])

  // Notify admin now that email is confirmed
  if (!user.approved) {
    c.executionCtx.waitUntil(notifyNewRegistration(
      { name: user.name, address: user.address, note: user.note },
      c.env,
    ))
  }

  return c.json({ ok: true, approved: user.approved === 1 })
})

router.post('/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}))

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email_hash = ?')
    .bind(await hashEmail(email?.toLowerCase().trim() ?? '')).first()

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  if (!user.email_verified) return c.json({ error: 'Please verify your email first — check your inbox.' }, 403)
  if (!user.approved)       return c.json({ error: 'Your account is pending approval.' }, 403)

  const token = await sign(
    { id: user.id, name: user.name, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
    c.env.JWT_SECRET
  )

  return c.json({ token, id: user.id, name: user.name, role: user.role })
})

router.post('/reset-request', async (c) => {
  const { email } = await c.req.json().catch(() => ({}))
  if (!email) return c.json({ error: 'Email is required' }, 400)

  const user = await c.env.DB.prepare('SELECT id, email_verified FROM users WHERE email_hash = ?')
    .bind(await hashEmail(email?.toLowerCase().trim() ?? '')).first()

  // Always return the same message to avoid leaking whether an email exists
  if (user?.email_verified) {
    const token = crypto.randomUUID()
    await c.env.DB.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(user.id).run()
    await c.env.DB.prepare('INSERT INTO password_reset_tokens (user_id, token) VALUES (?, ?)').bind(user.id, token).run()
    c.executionCtx.waitUntil(sendPasswordResetEmail(email.toLowerCase().trim(), token, c.env))
  }

  return c.json({ message: 'If that email is registered, you\'ll receive a reset link shortly.' })
})

router.post('/reset', async (c) => {
  const { token, password } = await c.req.json().catch(() => ({}))
  if (!token || !password) return c.json({ error: 'Token and password are required' }, 400)
  if (password.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400)

  const row = await c.env.DB.prepare('SELECT user_id, created_at FROM password_reset_tokens WHERE token = ?')
    .bind(token).first()
  if (!row) return c.json({ error: 'Invalid or expired link' }, 400)

  const age = Math.floor(Date.now() / 1000) - row.created_at
  if (age > 60 * 60) {
    await c.env.DB.prepare('DELETE FROM password_reset_tokens WHERE token = ?').bind(token).run()
    return c.json({ error: 'This link has expired. Please request a new one.' }, 400)
  }

  const hash = await hashPassword(password)
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hash, row.user_id),
    c.env.DB.prepare('DELETE FROM password_reset_tokens WHERE token = ?').bind(token),
  ])

  return c.json({ ok: true })
})

router.post('/logout', (c) => {
  return c.json({ ok: true })
})

router.delete('/me', authenticate, async (c) => {
  const { id } = c.get('user')
  await c.env.DB.prepare('UPDATE listings SET active = 0 WHERE user_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

router.get('/me', authenticate, async (c) => {
  const { id } = c.get('user')
  const row = await c.env.DB.prepare(
    'SELECT id, name, role, address FROM users WHERE id = ?'
  ).bind(id).first()
  return c.json(row)
})

export default router
