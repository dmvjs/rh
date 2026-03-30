import { verify } from 'hono/jwt'

async function getPayload(c) {
  const header = c.req.header('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    return await verify(token, c.env.JWT_SECRET, 'HS256')
  } catch {
    return null
  }
}

export async function authenticate(c, next) {
  const payload = await getPayload(c)
  if (!payload) return c.json({ error: 'Unauthorized' }, 401)
  c.set('user', payload)
  return next()
}

export async function requireModerator(c, next) {
  const payload = await getPayload(c)
  if (!payload) return c.json({ error: 'Unauthorized' }, 401)
  if (!['moderator', 'admin'].includes(payload.role)) return c.json({ error: 'Forbidden' }, 403)
  c.set('user', payload)
  return next()
}

export async function requireAdmin(c, next) {
  const payload = await getPayload(c)
  if (!payload) return c.json({ error: 'Unauthorized' }, 401)
  if (payload.role !== 'admin') return c.json({ error: 'Forbidden' }, 403)
  c.set('user', payload)
  return next()
}
