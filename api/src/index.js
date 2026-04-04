import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes     from './routes/auth.js'
import listingRoutes  from './routes/listings.js'
import adminRoutes    from './routes/admin.js'
import uploadRoutes   from './routes/upload.js'
import addressRoutes  from './routes/addresses.js'
import newsRoutes       from './routes/news.js'
import weatherRoutes    from './routes/weather.js'

import transitRoutes     from './routes/transit.js'
import governmentRoutes  from './routes/government.js'
import propertyRoutes    from './routes/property.js'
import alertRoutes       from './routes/alerts.js'
import adsRoutes         from './routes/ads.js'
import waterRoutes        from './routes/water.js'
import parksRoutes        from './routes/parks.js'
import wildlifeRoutes     from './routes/wildlife.js'


const app = new Hono()

app.use('*', (c, next) => cors({
  origin:      c.env.WEB_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
})(c, next))

app.route('/api/auth',      authRoutes)
app.route('/api/listings',  listingRoutes)
app.route('/api/admin',     adminRoutes)
app.route('/api/upload',    uploadRoutes)
app.route('/api/addresses', addressRoutes)
app.route('/api/news',      newsRoutes)
app.route('/api/weather',   weatherRoutes)

app.route('/api/transit',     transitRoutes)
app.route('/api/government',  governmentRoutes)
app.route('/api/property',    propertyRoutes)
app.route('/api/alerts',      alertRoutes)
app.route('/api/ads',         adsRoutes)
app.route('/api/water',       waterRoutes)
app.route('/api/parks',       parksRoutes)
app.route('/api/wildlife',    wildlifeRoutes)


app.get('/api/health', (c) => c.json({ ok: true }))

export default {
  fetch: app.fetch,
  async scheduled(event, env) {
    // Warm flights and news cache every minute so users never wait
    await Promise.allSettled([
      fetch('https://rh-api.ridgeleahills.workers.dev/api/news'),
      fetch('https://rh-api.ridgeleahills.workers.dev/api/news/local'),
    ])
  },
}
