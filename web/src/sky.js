import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmtAlt(ft) {
  if (ft == null) return null
  return `${(Math.round(ft / 100) * 100).toLocaleString()}ft`
}

function fmtSpeed(kts) {
  if (kts == null) return null
  return `${Math.round(kts)}kts`
}

function azDir(az) {
  return ['N','NE','E','SE','S','SW','W','NW'][Math.round(az / 45) % 8]
}

function fmtUsnoTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`
}

function moonEmoji(phase) {
  return {
    'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
    'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
    'Last Quarter': '🌗', 'Waning Crescent': '🌘',
  }[phase] ?? '🌙'
}

function planetEmoji(name) {
  return { Mercury: '●', Venus: '✦', Mars: '●', Jupiter: '●', Saturn: '🪐', Uranus: '●', Neptune: '●' }[name] ?? '●'
}

function planetColor(name) {
  return { Mercury: '#aaaaaa', Venus: '#f5c842', Mars: '#ef4444', Jupiter: '#f59e0b', Saturn: '#b45309', Uranus: '#67e8f9', Neptune: '#818cf8' }[name] ?? '#888888'
}

// Deterministic pseudo-random from seed (no Math.random so stars don't move)
function rand(seed) {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

// Draw the correct lunar phase shape using canvas geometry
function drawMoonPhase(ctx, x, y, R, curphase, fracillum) {
  const frac = parseFloat(String(fracillum ?? '100').replace('%', '')) / 100
  const isWaxing = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous'].includes(curphase)
  const dark = 'rgba(12, 12, 28, 0.94)'
  const lit  = '#E2DEC9'
  // terminator ellipse x semi-axis: R at quarter, 0 at full/new
  const ex = R * Math.abs(1 - 2 * frac)

  ctx.save()
  // Glow halo before clipping
  ctx.shadowColor = 'rgba(220,220,180,0.45)'
  ctx.shadowBlur  = 16
  ctx.fillStyle = lit
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0

  // Clip all subsequent drawing to the disc
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.clip()

  if (frac <= 0) {
    // New moon: all dark
    ctx.fillStyle = dark
    ctx.fillRect(x - R - 1, y - R - 1, 2 * R + 2, 2 * R + 2)

  } else if (frac >= 1) {
    // Full moon: already drawn lit above

  } else if (isWaxing) {
    if (frac <= 0.5) {
      // Waxing crescent: fill dark, then carve out lit right-sliver
      ctx.fillStyle = dark
      ctx.fillRect(x - R - 1, y - R - 1, 2 * R + 2, 2 * R + 2)
      ctx.fillStyle = lit
      ctx.beginPath()
      ctx.arc(x, y, R, -Math.PI / 2, Math.PI / 2, false)         // right disc arc CW
      ctx.ellipse(x, y, ex, R, 0, Math.PI / 2, -Math.PI / 2, true) // terminator CCW → right
      ctx.fill()
    } else {
      // Waxing gibbous: lit disc, then carve dark left-sliver
      ctx.fillStyle = dark
      ctx.beginPath()
      ctx.arc(x, y, R, -Math.PI / 2, Math.PI / 2, true)            // left disc arc CCW
      ctx.ellipse(x, y, ex, R, 0, Math.PI / 2, -Math.PI / 2, false) // terminator CW → left
      ctx.fill()
    }
  } else {
    // Waning phases — mirror of waxing (lit on left)
    if (frac >= 0.5) {
      // Waning gibbous: lit disc, dark right-sliver
      ctx.fillStyle = dark
      ctx.beginPath()
      ctx.arc(x, y, R, -Math.PI / 2, Math.PI / 2, false)          // right disc arc CW
      ctx.ellipse(x, y, ex, R, 0, Math.PI / 2, -Math.PI / 2, true) // terminator CCW → right
      ctx.fill()
    } else {
      // Waning crescent: fill dark, carve lit left-sliver
      ctx.fillStyle = dark
      ctx.fillRect(x - R - 1, y - R - 1, 2 * R + 2, 2 * R + 2)
      ctx.fillStyle = lit
      ctx.beginPath()
      ctx.arc(x, y, R, -Math.PI / 2, Math.PI / 2, true)             // left disc arc CCW
      ctx.ellipse(x, y, ex, R, 0, Math.PI / 2, -Math.PI / 2, false)  // terminator CW → left
      ctx.fill()
    }
  }

  ctx.restore()
}

let skyAnimFrame = null

// Estimate current sun altitude from rise/set times so the gradient drifts live
function estimateSunAlt(astro) {
  const sundata = astro?.sundata ?? []
  const rise = sundata.find(d => d.phen === 'Rise')
  const set  = sundata.find(d => d.phen === 'Set')
  if (!rise || !set) return null
  const now    = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const [rh, rm] = rise.time.split(':').map(Number)
  const [sh, sm] = set.time.split(':').map(Number)
  const riseMin = rh * 60 + rm
  const setMin  = sh * 60 + sm
  if (nowMin <= riseMin) return -Math.min(18, (riseMin - nowMin) * 0.25)
  if (nowMin >= setMin)  return -Math.min(18, (nowMin  - setMin)  * 0.25)
  return 55 * Math.sin(((nowMin - riseMin) / (setMin - riseMin)) * Math.PI)
}

// Sun disc: near-white at high altitude, warming to orange-red near horizon
function sunDiscColor(alt) {
  if (alt >= 30) return { disc: '#FFF6D0' }  // pale white-yellow
  if (alt >= 12) {
    const t = (alt - 12) / 18  // 0 at 12°, 1 at 30°
    const g = Math.round(200 + t * 46)       // 200→246
    const b = Math.round(t * 80)             // 0→80 (cooler = whiter)
    return { disc: `rgb(255,${g},${b})` }
  }
  const t = Math.max(0, alt / 12)            // 0 at horizon, 1 at 12°
  const g = Math.round(80 + t * 120)
  return { disc: `rgb(255,${g},0)` }
}

function drawSky(canvas, planets, astro, fetchedAt) {
  if (!canvas || !canvas.offsetWidth) return
  if (skyAnimFrame) { cancelAnimationFrame(skyAnimFrame); skyAnimFrame = null }

  const dpr = window.devicePixelRatio || 1
  canvas.width  = canvas.offsetWidth  * dpr
  canvas.height = canvas.offsetHeight * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const W = canvas.offsetWidth
  const H = canvas.offsetHeight

  const sun       = planets.find(p => p.name === 'Sun')
  const curphase  = astro?.curphase  ?? null
  const fracillum = astro?.fracillum ?? null
  const fetchMs   = fetchedAt ?? Date.now()

  const AZ0  = 90
  const AZ1  = 270
  const MARG = 26

  function azToX(az) {
    let a = az; if (a < AZ0) a += 360
    return ((a - AZ0) / (AZ1 - AZ0)) * W
  }

  function toXY(alt, az) {
    const x = azToX(az)
    let a = az; if (a < AZ0) a += 360
    const y = (H - MARG) - (Math.max(0, alt) / 90) * (H - MARG - 8)
    return { x, y, vis: a >= AZ0 && a <= AZ1 && alt > -5 }
  }

  // Pre-render black tree silhouettes once — composited each frame
  const treeOff = document.createElement('canvas')
  treeOff.width = canvas.width; treeOff.height = canvas.height
  const tC = treeOff.getContext('2d')
  tC.scale(dpr, dpr)
  const items = [
    '🌲','🌲','🌲','🌲','🌲','🌲','🌲','🌲',
    '🌲','🌲','🌲','🌲','🌲','🌲','🏠','🏡',
  ]
  items.forEach((em, i) => {
    const size = Math.round(22 + rand(i * 11.3 + 700) * 18)
    const x    = rand(i * 17.7 + 800) * W
    tC.font = `${size}px serif`
    tC.textAlign = 'center'
    tC.fillText(em, x, H - MARG + 8)
  })
  tC.globalCompositeOperation = 'source-atop'
  tC.fillStyle = '#000'
  tC.fillRect(0, 0, W, H)

  let sstar = null  // active shooting star { x,y,dx,dy,born,dur }

  function drawFrame(t) {
    ctx.clearRect(0, 0, W, H)
    ctx.save()
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip()

    // Live sun altitude from wall clock; azimuth drifts 15°/hr since fetch
    const liveAlt = estimateSunAlt(astro) ?? sun?.altitude ?? -90
    const elapsedHrs = (Date.now() - fetchMs) / 3600000
    const liveAz  = sun ? sun.azimuth + elapsedHrs * 15 : null

    // ── Sky gradient — smooth continuous interpolation ─────────
    // Anchor states: [altitude, [zenithR,G,B], [horizonR,G,B]]
    const SKY = [
      { a:  70, z: [10,  50, 140], h: [75, 152, 218] },  // high sun, saturated blue
      { a:  10, z: [14,  55, 148], h: [90, 160, 215] },  // daytime, slight haze
      { a:   3, z: [20,  18,  70], h: [215, 105,  20] }, // golden hour
      { a:   0, z: [12,   7,  35], h: [185,  50,   8] }, // horizon
      { a:  -4, z: [ 5,   7,  18], h: [ 55,  16,   5] }, // civil twilight
      { a: -12, z: [ 2,   4,  10], h: [  8,   8,  16] }, // nautical twilight
      { a: -20, z: [ 1,   2,   6], h: [  3,   5,  12] }, // night
    ]
    function lerpC(c1, c2, t) {
      return c1.map((v, i) => Math.round(v + (c2[i] - v) * t))
    }
    function skyColor(alt) {
      if (alt >= SKY[0].a) return { z: SKY[0].z, h: SKY[0].h }
      if (alt <= SKY[SKY.length - 1].a) { const s = SKY[SKY.length - 1]; return { z: s.z, h: s.h } }
      for (let i = 0; i < SKY.length - 1; i++) {
        if (alt <= SKY[i].a && alt >= SKY[i + 1].a) {
          const t = (SKY[i].a - alt) / (SKY[i].a - SKY[i + 1].a)
          return { z: lerpC(SKY[i].z, SKY[i + 1].z, t), h: lerpC(SKY[i].h, SKY[i + 1].h, t) }
        }
      }
      return { z: SKY[0].z, h: SKY[0].h }
    }
    const { z, h } = skyColor(liveAlt)
    const toRgb = c => `rgb(${c[0]},${c[1]},${c[2]})`
    const grad = ctx.createLinearGradient(0, 0, 0, H - MARG)
    grad.addColorStop(0, toRgb(z))
    grad.addColorStop(1, toRgb(h))
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H - MARG)

    // ── Stars — twinkling ──────────────────────────────────────
    if (liveAlt < 6) {
      const fadeIn = Math.min(1, Math.max(0, (-liveAlt + 6) / 12))
      for (let i = 0; i < 140; i++) {
        const sx    = rand(i * 3.7) * W
        const sy    = rand(i * 7.1) * (H - MARG - 10)
        const sr    = rand(i * 11.3) > 0.88 ? 1.3 : 0.55
        const freq  = 0.7 + rand(i * 23.1) * 1.4
        const phase = rand(i * 41.7) * Math.PI * 2
        const twinkle = 0.65 + 0.35 * Math.sin(t * 0.001 * freq + phase)
        const sa = (rand(i * 17.9) * 0.5 + 0.3) * fadeIn * twinkle
        ctx.fillStyle = `rgba(255,255,255,${sa.toFixed(2)})`
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill()
      }
    }

    // ── Shooting stars (night only) ────────────────────────────
    if (liveAlt < -2) {
      if (!sstar && Math.random() < 0.0004) {
        const angle = (0.25 + Math.random() * 0.5) * Math.PI
        const len   = 50 + Math.random() * 80
        sstar = { x: Math.random() * W * 0.85, y: Math.random() * (H - MARG) * 0.55,
                  dx: Math.cos(angle) * len,   dy: Math.sin(angle) * len,
                  born: t, dur: 450 + Math.random() * 250 }
      }
      if (sstar) {
        const prog = (t - sstar.born) / sstar.dur
        if (prog >= 1) {
          sstar = null
        } else {
          const tailX = sstar.x + sstar.dx * prog
          const tailY = sstar.y + sstar.dy * prog
          const headX = tailX - sstar.dx * 0.14
          const headY = tailY - sstar.dy * 0.14
          const alpha = (Math.sin(prog * Math.PI) * 0.9).toFixed(2)
          const streak = ctx.createLinearGradient(headX, headY, tailX, tailY)
          streak.addColorStop(0, `rgba(255,255,240,${alpha})`)
          streak.addColorStop(1, 'rgba(255,255,240,0)')
          ctx.save()
          ctx.strokeStyle = streak; ctx.lineWidth = 1.5
          ctx.beginPath(); ctx.moveTo(headX, headY); ctx.lineTo(tailX, tailY); ctx.stroke()
          ctx.restore()
        }
      }
    } else {
      sstar = null
    }

    // ── Celestial objects ──────────────────────────────────────
    planets.forEach(p => {
      const az  = (p.name === 'Sun'  && liveAz  != null) ? liveAz  : p.azimuth
      const alt = (p.name === 'Sun') ? liveAlt : p.altitude
      const { x, y, vis } = toXY(alt, az)
      if (!vis) return

      if (p.name === 'Sun') {
        const { disc } = sunDiscColor(liveAlt)
        ctx.fillStyle = disc
        ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill()

      } else if (p.name === 'Moon') {
        drawMoonPhase(ctx, x, y, 11, curphase, fracillum)

      } else {
        const color = planetColor(p.name)
        const r = Math.max(2.5, Math.min(5, 5.5 - (p.magnitude ?? 2) * 0.5))
        ctx.shadowColor = color; ctx.shadowBlur = r * 3.5
        ctx.fillStyle = color
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(255,255,255,0.65)'
        ctx.font = '9px -apple-system,sans-serif'
        const nearRight = x > W * 0.75
        ctx.textAlign = nearRight ? 'right' : 'left'
        ctx.fillText(p.name, nearRight ? x - r - 3 : x + r + 3, y)
        ctx.textAlign = 'center'
      }
    })

    // ── Tree silhouettes + 1px ground line ────────────────────
    ctx.drawImage(treeOff, 0, 0, W, H)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, H - MARG - 1, W, 1)

    // ── Horizon rule + direction labels ────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, H - MARG); ctx.lineTo(W, H - MARG); ctx.stroke()
    ctx.fillStyle = '#f7f7f5'
    ctx.fillRect(0, H - MARG, W, MARG)
    ctx.fillStyle = '#6b6b65'
    ctx.font = '10px -apple-system,BlinkMacSystemFont,sans-serif'
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
    ;[{l:'E',az:90},{l:'SE',az:135},{l:'S',az:180},{l:'SW',az:225},{l:'W',az:270}].forEach(d => {
      ctx.fillText(d.l, ((d.az - AZ0) / (AZ1 - AZ0)) * W, H - MARG / 2)
    })

    ctx.restore()
    skyAnimFrame = requestAnimationFrame(drawFrame)
  }

  skyAnimFrame = requestAnimationFrame(drawFrame)
}

function isDaytime(sundata) {
  if (!sundata?.length) return true
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const rise = sundata.find(d => d.phen === 'Rise')
  const set  = sundata.find(d => d.phen === 'Set')
  if (!rise || !set) return true
  const [rh, rm] = rise.time.split(':').map(Number)
  const [sh, sm] = set.time.split(':').map(Number)
  return nowMin >= rh * 60 + rm && nowMin < sh * 60 + sm
}

function minutesUntil(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return Math.round((target - now) / 60000)
}

function fmtCountdown(mins) {
  if (mins == null) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function renderAstro(astro) {
  if (!astro) return ''
  const { sundata = [], moondata = [], curphase, fracillum } = astro

  const day   = isDaytime(sundata)
  const rise  = sundata.find(d => d.phen === 'Rise')
  const set   = sundata.find(d => d.phen === 'Set')
  const mRise = moondata.find(d => d.phen === 'Rise')
  const mSet  = moondata.find(d => d.phen === 'Set')

  const nextEvt = day
    ? (set  ? `Sunset in ${fmtCountdown(minutesUntil(set.time))}` : '')
    : (rise ? `Sunrise in ${fmtCountdown(minutesUntil(rise.time))}` : '')

  return `
    <div class="sky-astro-card">
      <div class="sky-astro-top">
        <div class="sky-astro-half">
          <span class="sky-astro-icon">${day ? '☀️' : '🌃'}</span>
          <div>
            <p class="sky-astro-primary">${day ? 'Daytime' : 'Nighttime'}</p>
            ${nextEvt ? `<p class="sky-astro-sub">${esc(nextEvt)}</p>` : ''}
          </div>
        </div>
        <div class="sky-astro-rule"></div>
        <div class="sky-astro-half sky-astro-half-right">
          <span class="sky-astro-icon">${moonEmoji(curphase)}</span>
          <div>
            <p class="sky-astro-primary">${esc(curphase ?? '—')}</p>
            <p class="sky-astro-sub">${esc(fracillum ?? '')} illuminated</p>
          </div>
        </div>
      </div>
      <div class="sky-times">
        <div class="sky-time-cell">
          <p class="sky-time-label">Sunrise</p>
          <p class="sky-time-val">${fmtUsnoTime(rise?.time)}</p>
        </div>
        <div class="sky-time-cell">
          <p class="sky-time-label">Sunset</p>
          <p class="sky-time-val">${fmtUsnoTime(set?.time)}</p>
        </div>
        <div class="sky-time-cell">
          <p class="sky-time-label">Moonrise</p>
          <p class="sky-time-val">${fmtUsnoTime(mRise?.time)}</p>
        </div>
        <div class="sky-time-cell">
          <p class="sky-time-label">Moonset</p>
          <p class="sky-time-val">${fmtUsnoTime(mSet?.time)}</p>
        </div>
      </div>
    </div>
  `
}

function renderPlanets(planets) {
  const visible = planets.filter(p => p.aboveHorizon && p.name !== 'Sun' && p.name !== 'Moon')

  const rows = visible.length
    ? visible.map(p => `
        <div class="sky-planet-row">
          <span class="sky-planet-dot" style="color:${planetColor(p.name)}">●</span>
          <div class="sky-planet-body">
            <span class="sky-planet-name">${esc(p.name)}</span>
            <span class="sky-planet-const">${esc(p.constellation)}</span>
          </div>
          <div class="sky-planet-pos">
            <span class="sky-planet-alt">${Math.round(p.altitude)}° up</span>
            <span class="sky-planet-dir">${azDir(p.azimuth)}</span>
          </div>
          ${p.nakedEyeObject ? '<span class="sky-eye-badge">naked eye</span>' : ''}
        </div>
      `).join('')
    : '<p class="sky-no-planets">No planets above the horizon right now.</p>'

  return `
    <div class="pol-section">
      <p class="pol-section-title">Visible Above the Horizon</p>
      <div class="sky-now-layout">
        <div class="sky-canvas-wrap">
          <canvas id="sky-canvas" class="sky-canvas"></canvas>
        </div>
        <div class="sky-planet-list">${rows}</div>
      </div>
    </div>
  `
}

function renderApod(apod) {
  if (!apod) return ''

  const date = apod.date
    ? new Date(apod.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  const excerpt = apod.explanation ?? ''

  const media = apod.mediaType === 'image'
    ? `<a href="${esc(apod.hdurl || apod.url)}" target="_blank" rel="noopener" class="sky-apod-img-wrap">
         <img src="${esc(apod.url)}" alt="${esc(apod.title)}" class="sky-apod-img" loading="lazy">
       </a>`
    : `<a href="${esc(apod.url)}" target="_blank" rel="noopener" class="sky-apod-video-link">▶ Watch on NASA →</a>`

  const credit = apod.copyright ? `© ${esc(apod.copyright)} · ` : ''

  return `
    <div class="pol-section">
      <p class="pol-section-title">NASA · Astronomy Picture of the Day</p>
      <div class="sky-apod-card">
        ${media}
        <div class="sky-apod-body">
          <p class="sky-apod-title">${esc(apod.title)}</p>
          <p class="sky-apod-text">${esc(excerpt)}</p>
          <p class="sky-apod-credit">${credit}${esc(date)}</p>
        </div>
      </div>
    </div>
  `
}

function renderMap(flights) {
  return `
    <div class="sky-map-wrap">
      <div class="sky-map-hdr">
        <div>
          <p class="sky-map-title">Flights Overhead</p>
          <p class="sky-map-sub" id="sky-map-sub">${flights.length} aircraft · 16-mile radius · <span id="sky-age"></span></p>
        </div>
        <button class="sky-refresh" id="sky-refresh">↻ Refresh</button>
      </div>
      <div class="sky-map" id="sky-map"></div>
    </div>
  `
}

function renderFlightList(flights) {
  if (!flights.length) return ''
  const sorted = [...flights].sort((a, b) => (b.altFt ?? 0) - (a.altFt ?? 0)).slice(0, 36)
  const items = sorted.map(f => {
    const cs   = f.callsign ?? f.icao ?? '?'
    const alt  = fmtAlt(f.altFt)
    const spd  = fmtSpeed(f.velKts)
    const dir  = f.heading != null ? azDir(f.heading) : null
    const meta = [alt, spd, dir].filter(Boolean).join(' · ')
    return `
      <div class="sky-flight">
        <p class="sky-flight-cs">${esc(cs)}</p>
        <p class="sky-flight-meta">${esc(meta)}</p>
      </div>
    `
  }).join('')
  return `
    <div class="pol-section">
      <p class="pol-section-title">Aircraft · High to Low</p>
      <div class="sky-flight-grid">${items}</div>
    </div>
  `
}

// ── Leaflet map ───────────────────────────────────────────

let lmap = null
let planeMarkers = []

function planeIcon(heading) {
  const rot = ((heading ?? 0) - 90 + 360) % 360
  return L.divIcon({
    html: `<span style="display:block;transform:rotate(${rot}deg);font-size:26px;color:#1a3a5c;line-height:1;cursor:pointer">✈</span>`,
    className: 'sky-plane-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

function nearestAirport(f) {
  let best = null, bestDist = Infinity
  AIRPORTS.forEach(ap => {
    const d = distMiles(f.lat, f.lon, ap.lat, ap.lon)
    if (d < bestDist) { bestDist = d; best = ap }
  })
  if (bestDist < 4 && (f.altFt ?? 99999) < 6000) return `near ${best.code}`
  return null
}

function addPlaneMarkers(flights) {
  planeMarkers.forEach(m => m.remove())
  planeMarkers = []
  flights.forEach(f => {
    const cs   = f.callsign ?? f.icao ?? '?'
    const alt  = fmtAlt(f.altFt) ?? '—'
    const spd  = fmtSpeed(f.velKts) ?? '—'
    const aprt = nearestAirport(f)
    const tipLines = [`<strong>${esc(cs)}</strong>`, `${esc(alt)} · ${esc(spd)}`]
    if (aprt) tipLines.push(`<em>${esc(aprt)}</em>`)
    const m = L.marker([f.lat, f.lon], { icon: planeIcon(f.heading) })
    m.bindTooltip(tipLines.join('<br>'), {
      className: 'sky-lf-tip',
      sticky: true,
      offset: [0, -8],
    })
    m.addTo(lmap)
    planeMarkers.push(m)
  })
}

const AIRPORTS = [
  { icao: 'KDCA', name: 'Reagan National', code: 'DCA', lat: 38.8521, lon: -77.0377 },
  { icao: 'KIAD', name: 'Dulles International', code: 'IAD', lat: 38.9531, lon: -77.4565 },
]

function distMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function addAirportMarkers() {}

function initLeaflet(flights) {
  lmap = L.map('sky-map', {
    zoomControl: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    boxZoom: false,
    keyboard: false,
    dragging: false,
    attributionControl: false,
  })

  lmap.setView([38.84142, -77.25081], 10)

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(lmap)

  L.control.attribution({ prefix: false, position: 'bottomright' })
    .addAttribution('© <a href="https://osm.org/copyright">OpenStreetMap</a> contributors')
    .addTo(lmap)

  // 8800 Sandy Ridge Court
  L.circleMarker([38.84142, -77.25081], {
    radius: 4,
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 1,
    weight: 0,
  }).bindTooltip('Ridgelea Hills', {
    permanent: true,
    className: 'sky-rh-label sky-rh-label-light',
    direction: 'bottom',
    offset: [0, 6],
  }).addTo(lmap)

  addAirportMarkers(flights)
  addPlaneMarkers(flights)
}

let lastFetch = Date.now()

function tickAge() {
  const el = document.getElementById('sky-age')
  if (!el) return
  const s = Math.round((Date.now() - lastFetch) / 1000)
  el.textContent = s < 15 ? 'just updated' : `updated ${s}s ago`
}

async function refreshFlights(bbox) {
  const btn = document.getElementById('sky-refresh')
  if (btn) { btn.textContent = '↻'; btn.disabled = true }
  try {
    const { flights } = await api.get('/api/sky/flights')
    lastFetch = Date.now()
    if (lmap) addPlaneMarkers(flights)
    const sub = document.getElementById('sky-map-sub')
    if (sub) sub.innerHTML = `${flights.length} aircraft · 16-mile radius · <span id="sky-age">just updated</span>`
  } catch {}
  if (btn) { btn.textContent = '↻ Refresh'; btn.disabled = false }
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const el = document.getElementById('sky-page')

  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Mason District · Fairfax County · Virginia</p>
      <h1 class="pol-title">The Sky</h1>
      <p class="pol-subtitle">Live flights overhead, visible planets, and sun &amp; moon times for your neighborhood.</p>
    </div>
    <div class="skeleton" style="height:130px;margin-top:24px;border-radius:8px;"></div>
    <div class="skeleton" style="height:420px;margin-top:28px;border-radius:8px;"></div>
  `

  const data = await api.get('/api/sky').catch(() => null)
  if (!data) {
    el.innerHTML = '<p style="color:var(--muted);padding:40px 0">Could not load sky data.</p>'
    return
  }

  const { astro, planets, flights, apod, fetchedAt } = data
  lastFetch = fetchedAt ? new Date(fetchedAt).getTime() : Date.now()

  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Mason District · Fairfax County · Virginia</p>
      <h1 class="pol-title">The Sky</h1>
      <p class="pol-subtitle">Live flights overhead, visible planets, and sun &amp; moon times for your neighborhood.</p>
    </div>
    ${renderAstro(astro)}
    ${renderApod(apod)}
    ${renderPlanets(planets)}
    ${renderMap(flights)}
    ${renderFlightList(flights)}
    <p class="pol-updated">Flights via <a href="https://airplanes.live" target="_blank" rel="noopener" style="color:inherit">airplanes.live</a> · Sun &amp; Moon via <a href="https://aa.usno.navy.mil" target="_blank" rel="noopener" style="color:inherit">US Naval Observatory</a> · Planets via <a href="https://visibleplanets.dev" target="_blank" rel="noopener" style="color:inherit">visibleplanets.dev</a></p>
  `

  initLeaflet(flights)
  drawSky(document.getElementById('sky-canvas'), planets, astro, lastFetch)
  setInterval(tickAge, 5000)
  tickAge()
  setInterval(refreshFlights, 60000)
  document.getElementById('sky-refresh')?.addEventListener('click', refreshFlights)
}

init()
