import { Hono } from 'hono'
import { authenticate } from '../middleware/auth.js'
import { ADDRESSES } from '../db/addresses.js'

const router = new Hono()

router.get('/', authenticate, (c) => c.json({ addresses: ADDRESSES }))

export default router
