import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes     from './routes/auth.js'
import listingRoutes  from './routes/listings.js'
import adminRoutes    from './routes/admin.js'
import uploadRoutes   from './routes/upload.js'
import addressRoutes  from './routes/addresses.js'
import newsRoutes       from './routes/news.js'
import weatherRoutes    from './routes/weather.js'
import directoryRoutes  from './routes/directory.js'
import transitRoutes     from './routes/transit.js'
import governmentRoutes  from './routes/government.js'
import propertyRoutes    from './routes/property.js'
import alertRoutes       from './routes/alerts.js'
import adsRoutes         from './routes/ads.js'
import waterRoutes        from './routes/water.js'
import flightRoutes       from './routes/flights.js'
import donationRoutes     from './routes/donations.js'
import inspectionRoutes   from './routes/inspections.js'

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
app.route('/api/directory', directoryRoutes)
app.route('/api/transit',     transitRoutes)
app.route('/api/government',  governmentRoutes)
app.route('/api/property',    propertyRoutes)
app.route('/api/alerts',      alertRoutes)
app.route('/api/ads',         adsRoutes)
app.route('/api/water',       waterRoutes)
app.route('/api/flights',     flightRoutes)
app.route('/api/donations',   donationRoutes)
app.route('/api/inspections', inspectionRoutes)

app.get('/api/health', (c) => c.json({ ok: true }))

export default app
