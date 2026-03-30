import { Hono } from 'hono'
import { authenticate } from '../middleware/auth.js'

const router = new Hono()

router.get('/', authenticate, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT name, address, phone, email, lat, lng
     FROM users WHERE approved = 1 AND lat IS NOT NULL ORDER BY name ASC`
  ).all()
  return c.json({ members: results })
})

export default router
