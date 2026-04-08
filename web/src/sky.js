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

// Observer coordinates (Ridglea Hills, VA)
const OBS_LAT = 38.84142
const OBS_LON = -77.25081

// Bright star catalog: [name, RA°, Dec°, apparent magnitude]
// RA° = RA_hours × 15. Sources: Yale BSC / Hipparcos.
const STARS = [
  // mag < 1
  ['Sirius',      101.29, -16.72, -1.46],
  ['Canopus',      95.99, -52.70, -0.74],
  ['Arcturus',    213.92,  19.18, -0.05],
  ['Vega',        279.23,  38.78,  0.03],
  ['Capella',      79.17,  46.00,  0.08],
  ['Rigel',        78.63,  -8.20,  0.13],
  ['Procyon',     114.83,   5.23,  0.34],
  ['Betelgeuse',   88.79,   7.41,  0.45],
  ['Altair',      297.70,   8.87,  0.77],
  ['Aldebaran',    68.98,  16.51,  0.87],
  ['Antares',     247.35, -26.43,  0.96],
  ['Spica',       201.30, -11.16,  0.97],
  // mag 1–2
  ['Pollux',      116.33,  28.03,  1.14],
  ['Fomalhaut',   344.41, -29.62,  1.16],
  ['Deneb',       310.36,  45.28,  1.25],
  ['Regulus',     152.09,  11.97,  1.35],
  ['Adhara',      104.66, -28.97,  1.50],
  ['Castor',      113.65,  31.89,  1.58],
  ['Shaula',      263.40, -37.10,  1.63],
  ['Bellatrix',    81.28,   6.35,  1.64],
  ['Alnath',       81.57,  28.61,  1.65],
  ['Alnilam',      84.05,  -1.20,  1.70],
  ['Alnitak',      85.19,  -1.94,  1.74],
  ['Regor',       122.38, -47.34,  1.78],
  ['Alioth',      193.51,  55.96,  1.77],
  ['Mirfak',       51.08,  49.86,  1.79],
  ['Dubhe',       165.93,  61.75,  1.79],
  ['Wezen',       107.10, -26.39,  1.83],
  ['Sargas',      264.33, -42.99,  1.87],
  ['Kaus Aust.',  276.04, -34.38,  1.85],
  ['Alkaid',      206.89,  49.31,  1.86],
  ['Menkalinan',   89.88,  44.95,  1.90],
  ['Alhena',       99.43,  16.40,  1.93],
  ['Mirzam',       95.68, -17.96,  1.98],
  ['Polaris',      37.95,  89.26,  1.98],
  ['Alphard',     141.90,  -8.66,  1.99],
  ['Hamal',        31.79,  23.46,  2.00],
  ['Mirach',       17.43,  35.62,  2.05],
  ['Almach',       30.00,  42.33,  2.10],
  ['Algieba',     154.00,  19.84,  2.08],
  ['Menkent',     211.67, -36.37,  2.06],
  ['Saiph',        86.94,  -9.67,  2.07],
  ['Alpheratz',     2.10,  29.09,  2.07],
  ['Kochab',      222.68,  74.16,  2.08],
  ['Rasalhague',  263.73,  12.56,  2.08],
  ['Algol',        47.04,  40.96,  2.12],
  ['Alphecca',    233.67,  26.71,  2.23],
  ['Diphda',       10.90, -17.99,  2.02],
  ['Nunki',       283.82, -26.30,  2.05],
  ['Denebola',    177.27,  14.57,  2.14],
  ['Aludra',      111.02, -29.30,  2.45],
  ['Ankaa',         6.57, -42.31,  2.40],
  ['Menkar',       45.57,   4.09,  2.54],
  ['Sadr',        305.56,  40.26,  2.20],
  ['Mintaka',      83.00,  -0.30,  2.23],
  ['Mizar',       200.98,  54.93,  2.23],
  ['Etamin',      268.38,  51.49,  2.24],
  ['Schedar',      10.13,  56.54,  2.24],
  ['Navi',         14.18,  60.72,  2.47],
  ['Ruchbah',      21.45,  60.24,  2.68],
  ['Caph',          2.29,  59.15,  2.28],
  ['Dschubba',    240.08, -22.62,  2.32],
  ['Wei',         252.54, -34.29,  2.29],
  ['Girtab',      265.62, -39.03,  2.39],
  ['Sabik',       257.59, -15.72,  2.43],
  ['Naos',        120.90, -40.00,  2.25],
  ['Enif',        326.05,   9.88,  2.38],
  ['Scheat',      345.94,  28.08,  2.42],
  ['Zubeneschamali',229.25, -9.38, 2.61],
  ['Alderamin',   319.65,  62.59,  2.45],
  ['Epsilon Per',  59.46,  40.01,  2.89],
  ['Markab',      346.19,  15.21,  2.49],
  ['Zosma',       168.53,  20.52,  2.56],
  ['Izar',        221.25,  27.07,  2.37],
  ['Merak',       165.46,  56.38,  2.37],
  ['Arneb',        83.18, -17.82,  2.58],
  ['Zubenelgenubi',222.72,-16.04,  2.75],
  ['Gienah',      183.79, -17.54,  2.59],
  ['Han',         254.42, -10.57,  2.56],
  ['Acrab',       241.36, -19.81,  2.62],
  ['Phact',        85.08, -34.07,  2.65],
  ['Sheratan',     28.66,  20.81,  2.64],
  ['Yed Prior',   243.59,  -3.70,  2.74],
  ['Unukalhai',   235.51,   6.43,  2.65],
  ['Porrima',     190.41,  -1.45,  2.74],
  ['Kornephoros', 247.56,  21.49,  2.77],
  ['Kraz',        187.47, -23.40,  2.65],
  ['Nihal',        85.51, -20.76,  2.84],
  ['Cursa',        76.38,  -5.09,  2.79],
  ['Rastaban',    262.61,  52.30,  2.79],
  ['Zeta Her',    249.68,  31.60,  2.81],
  ['Phecda',      178.46,  53.69,  2.44],
  ['Muphrid',     218.02,  18.40,  2.68],
  ['Kaus Media',  275.25, -29.83,  2.70],
  ['Fawaris',     306.96,  45.13,  2.87],
  ['Algenib',       3.31,  15.18,  2.83],
  ['Matar',       332.32,  30.22,  2.94],
  ['Rho Pup',     121.89, -24.30,  2.81],
  ['Vindemiatrix',195.54,  10.96,  2.83],
  ['Alcyone',      56.87,  24.10,  2.87],
  ['Tarazed',     296.57,  10.61,  2.72],
  ['Kaus Borealis',276.05,-25.42,  2.81],
  ['Lesath',      264.33, -37.30,  2.69],
  ['Albireo',     292.68,  27.96,  3.08],
  ['Ascella',     283.82, -29.88,  2.60],
  ['Gomeisa',     114.10,   8.29,  2.90],
  ['Furud',        95.08, -30.06,  3.02],
  ['Albaldah',    290.42, -21.02,  2.89],
  ['Pi Sco',      239.71, -26.11,  2.89],
  ['Alniyat',     245.81, -25.59,  2.89],
  ['Tau Sco',     248.97, -28.22,  2.82],
  ['Sadalsuud',   322.89,  -5.57,  2.91],
  ['Sadalmelik',  331.45,  -0.32,  2.95],
  ['Cebalrai',    265.87,   4.57,  2.77],
  ['Gienah Cyg',  305.56,  33.97,  2.48],
  ['Algorab',     188.37, -16.52,  2.94],
  ['Delta Per',    55.73,  47.79,  3.01],
  ['Zaurak',       59.51, -13.51,  2.97],
  ['Tejat',        95.74,  22.51,  2.88],
  ['Deneb Algedi', 325.02,-16.13,  2.85],
  ['Dabih',       305.25, -14.78,  3.08],
  ['Ras Elased',  146.46,  23.77,  2.98],
  ['Homam',       326.17,  10.83,  3.40],
  ['Gamma Hya',   199.73, -23.17,  3.00],
  ['Beta Tri',     31.79,  34.99,  3.00],
  ['Zeta Tau',     84.41,  21.14,  3.00],
  ['Pi Pup',      110.03, -37.10,  2.70],
  ['Wazn',         92.37, -35.77,  3.12],
  ['Gamma Lup',   224.63, -41.17,  2.78],
  ['Alpha Lup',   220.48, -47.39,  2.30],
  ['Beta Lup',    224.00, -43.13,  2.68],
  ['Theta UMa',   163.77,  51.68,  3.17],
  ['Acamar',       44.57, -40.30,  3.24],
  ['Theta Oph',   260.10, -24.99,  3.27],
  ['Delta And',    22.72,  30.86,  3.27],
  ['Skat',        340.03, -15.82,  3.27],
  ['Mu Sco',      253.26, -38.05,  3.08],
  ['Sulafat',     284.74,  32.69,  3.26],
  ['Megrez',      183.86,  57.03,  3.31],
  ['Propus',       93.72,  22.51,  3.31],
  ['Seginus',     219.47,  38.31,  3.03],
  ['Altais',      287.30,  64.56,  3.07],
  ['Eta Ser',     278.81,  -2.90,  3.26],
  ['Zeta Aql',    299.80,  13.86,  2.99],
  ['Theta Aql',   306.21,  -1.00,  3.23],
  ['Nu Hya',      211.59, -16.20,  3.11],
  ['Alfirk',      322.17,  70.56,  3.23],
  ['Errai',       354.84,  77.63,  3.21],
  ['Edasich',     231.23,  58.97,  3.29],
  ['Tau Sgr',     285.65, -27.67,  3.32],
  ['Auva',        197.63,   3.40,  3.38],
  ['Heze',        202.59,  -0.60,  3.38],
  ['Zeta Cyg',    318.23,  30.23,  3.20],
  ['Tania Aust.', 154.27,  41.50,  3.05],
  ['Minkar',      183.95, -22.62,  3.02],
  ['Segin',        28.60,  63.67,  3.38],
  ['Meissa',       83.79,   9.93,  3.39],
  ['Chertan',     171.53,  15.43,  3.34],
  ['Adhafera',    154.17,  23.42,  3.44],
  ['Al Tarf',     124.13,   9.19,  3.52],
  ['Hassaleh',     74.25,  33.17,  2.69],
  ['Mahasim',      89.93,  37.21,  2.65],
  ['Tania Bor.',  150.66,  42.91,  3.45],
  ['Sheliak',     282.52,  33.36,  3.45],
  ['Nekkar',      225.49,  40.39,  3.49],
  ['Mebsuda',     100.00,  25.13,  3.06],
  ['Zeta Per',     60.17,  31.89,  2.85],
  ['Wasat',       106.03,  22.00,  3.53],
  ['Alzirr',      101.32,  12.90,  3.36],
  ['Talitha',     134.80,  48.04,  3.14],
  ['Sarin',       258.00,  24.84,  3.14],
  ['Pi Her',      264.87,  36.81,  3.16],
  ['Phi Sgr',     280.47, -26.99,  3.17],
  ['Sigma Lib',   226.02, -25.28,  3.25],
  ['Thuban',      211.10,  64.38,  3.65],
  ['Mebuda',      100.50,  20.57,  3.79],
  ['Rotanev',     308.17,  14.60,  3.63],
  ['Alshain',     298.83,   6.41,  3.71],
  ['Kappa Gem',   116.59,  24.40,  3.57],
  ['Gamma Sge',   298.36,  19.49,  3.47],
  ['Eta Psc',      22.87,  15.34,  3.62],
  ['Lambda Aql',  284.91,  -4.88,  3.44],
  ['Delta Aql',   296.47,   3.11,  3.36],
  ['Mu Peg',      341.02,  24.60,  3.48],
  ['Theta Peg',   331.02,   6.19,  3.53],
  ['Alpha Tri',    29.09,  29.58,  3.41],
  ['Nu Oph',      271.45,  -9.77,  3.34],
  ['Eta Cet',      18.37, -10.18,  3.45],
  ['Tau Cet',      26.02, -15.94,  3.50],
  ['Gamma Cet',    41.24,   3.24,  3.47],
  ['Eta Leo',     155.88,  16.76,  3.49],
  ['Xi Sgr',      279.28, -21.11,  3.51],
  ['Beta CrB',    231.23,  29.10,  3.68],
  ['Alrescha',     30.51,   2.76,  3.82],
]

// Convert RA/Dec to Alt/Az using precomputed Local Sidereal Time (degrees)
function starAltAz(raDeg, decDeg, lst) {
  const HA    = ((lst - raDeg) % 360 + 360) % 360
  const phi   = OBS_LAT * Math.PI / 180
  const delta = decDeg  * Math.PI / 180
  const h     = HA      * Math.PI / 180
  const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h)
  const alt    = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI
  const cosAlt = Math.cos(alt * Math.PI / 180)
  if (Math.abs(cosAlt) < 1e-6) return { alt, az: 0 }
  const sinAz = -Math.cos(delta) * Math.sin(h) / cosAlt
  const cosAz = (Math.sin(delta) - Math.sin(phi) * sinAlt) / (Math.cos(phi) * cosAlt)
  const az    = (Math.atan2(sinAz, cosAz) * 180 / Math.PI + 360) % 360
  return { alt, az }
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

let skyAnimFrame  = null
let compassHeading = null  // null = fixed E→W view; number = live compass azimuth

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

  const MARG = 26

  function azDiff(az) {
    let d = az - (compassHeading ?? 180)
    while (d >  180) d -= 360
    while (d < -180) d += 360
    return d
  }

  function toXY(alt, az) {
    const d = azDiff(az)
    const y = (H - MARG) - (Math.max(0, alt) / 90) * (H - MARG - 8)
    return { x: (d / 180 + 0.5) * W, y, vis: Math.abs(d) <= 90 && alt > -5 }
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

    // Local Sidereal Time (degrees) for real star positions
    const nowMs = Date.now()
    const JD    = nowMs / 86400000 + 2440587.5
    const GMST  = ((280.46061837 + 360.98564736629 * (JD - 2451545.0)) % 360 + 360) % 360
    const LST   = ((GMST + OBS_LON) % 360 + 360) % 360

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

    // ── Stars — real positions from catalog ────────────────────
    // Named labels only for the 8 most recognizable stars
    const NAMED = new Set(['Sirius','Betelgeuse','Rigel','Vega','Altair','Deneb','Arcturus','Polaris'])
    if (liveAlt < 6) {
      const fadeIn = Math.min(1, Math.max(0, (-liveAlt + 6) / 12))
      ctx.font = '8px -apple-system,sans-serif'
      STARS.forEach(([name, raDeg, decDeg, mag], i) => {
        const { alt, az } = starAltAz(raDeg, decDeg, LST)
        const { x, y, vis } = toXY(alt, az)
        if (!vis) return
        const sr      = Math.max(0.5, 2.2 - mag * 0.55)
        const freq    = 0.7 + rand(i * 23.1) * 1.4
        const phase   = rand(i * 41.7) * Math.PI * 2
        const twinkle = 0.65 + 0.35 * Math.sin(t * 0.001 * freq + phase)
        const base    = mag < 0 ? 1.0 : mag < 1 ? 0.92 : mag < 2 ? 0.78 : 0.60
        const sa      = (base * fadeIn * twinkle).toFixed(2)
        const col     = mag < 0.5 ? `rgba(255,238,210,${sa})` : `rgba(255,255,255,${sa})`
        ctx.fillStyle = col
        ctx.beginPath(); ctx.arc(x, y, sr, 0, Math.PI * 2); ctx.fill()
        if (NAMED.has(name) && fadeIn > 0.4) {
          ctx.fillStyle = `rgba(200,200,200,${(fadeIn * 0.55).toFixed(2)})`
          ctx.textAlign = x > W * 0.8 ? 'right' : 'left'
          ctx.fillText(name, x > W * 0.8 ? x - sr - 3 : x + sr + 3, y + 1)
        }
      })
      ctx.textAlign = 'center'
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
    ;[{l:'N',az:0},{l:'NE',az:45},{l:'E',az:90},{l:'SE',az:135},{l:'S',az:180},{l:'SW',az:225},{l:'W',az:270},{l:'NW',az:315}].forEach(d => {
      const dx = azDiff(d.az)
      if (Math.abs(dx) < 90) ctx.fillText(d.l, (dx / 180 + 0.5) * W, H - MARG / 2)
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
          <button id="sky-compass-btn" class="sky-compass-btn" title="Align with compass" hidden>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2"/>
              <polygon points="8,2 9.4,8 8,6.5 6.6,8" fill="currentColor"/>
              <polygon points="8,14 6.6,8 8,9.5 9.4,8" fill="currentColor" opacity=".4"/>
            </svg>
          </button>
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

function initCompass() {
  if (!('DeviceOrientationEvent' in window) || !navigator.maxTouchPoints) return
  const btn = document.getElementById('sky-compass-btn')
  if (!btn) return
  btn.hidden = false

  function handleOrientation(e) {
    // iOS: webkitCompassHeading is clockwise-from-North directly
    // Android absolute: alpha is CCW-from-North, so negate
    const h = e.webkitCompassHeading ?? (e.absolute ? (360 - e.alpha) % 360 : null)
    if (h != null) compassHeading = h
  }

  btn.addEventListener('click', async () => {
    if (btn.classList.contains('sky-compass-on')) {
      compassHeading = null
      btn.classList.remove('sky-compass-on')
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true)
      window.removeEventListener('deviceorientation', handleOrientation, true)
      return
    }
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        if (await DeviceOrientationEvent.requestPermission() !== 'granted') return
      } catch { return }
    }
    btn.classList.add('sky-compass-on')
    window.addEventListener('deviceorientationabsolute', handleOrientation, true)
    window.addEventListener('deviceorientation', handleOrientation, true)
  })
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
  initCompass()
  setInterval(tickAge, 5000)
  tickAge()
  setInterval(refreshFlights, 60000)
  document.getElementById('sky-refresh')?.addEventListener('click', refreshFlights)
}

init()
