import { renderHeader, renderFooter } from './header.js'

const SECTIONS = [
  {
    title: 'Little River Turnpike (VA-236)',
    cams: [
      { name: 'NROCCTVVA236E00041', label: 'VA-236 at I-495',          dir: 'NB' },
      { name: 'NO0473',             label: 'VA-236 near Backlick Rd',   dir: 'EB' },
      { name: 'FairfaxVideo3835',   label: 'VA-236 near Gallows Rd',    dir: 'EB' },
      { name: 'NO0357',             label: 'VA-236 near Seven Corners',  dir: 'WB' },
    ],
  },
  {
    title: 'Capital Beltway (I-495)',
    cams: [
      { name: 'FairfaxVideo1040',   label: 'I-495 at Exit 50 (VA-236)', dir: 'SB' },
      { name: 'FairfaxVideo1069',   label: 'I-495 at Exit 50 (VA-236)', dir: 'SB' },
      { name: 'FairfaxVideo1071',   label: 'I-495 near Exit 52',        dir: 'NB' },
      { name: 'FairfaxVideo1043',   label: 'I-495 near Braddock Rd',    dir: 'NB' },
      { name: 'FairfaxVideo1041',   label: 'I-495 near Braddock Rd',    dir: 'SB' },
      { name: 'FairfaxVideo1032',   label: 'I-495 near Rolling Rd',     dir: 'SB' },
    ],
  },
]

const SNAP = name => `https://snapshot.vdotcameras.com/${name}.png`
const REFRESH_MS = 60_000

// Alert types relevant to road conditions
const ROAD_ALERT_TYPES = new Set([
  'DenseFogAdvisory', 'FreezingFogAdvisory', 'DenseSmokeAdvisory',
  'WinterStormWarning', 'WinterStormWatch', 'WinterWeatherAdvisory',
  'IceStormWarning', 'BlizzardWarning', 'HeavySnowWarning',
  'FreezingRainAdvisory', 'SleetAdvisory', 'SleetWarning',
  'FreezeWarning', 'FrostAdvisory',
  'WindAdvisory', 'HighWindWarning', 'HighWindWatch',
  'FloodWarning', 'FloodAdvisory', 'FlashFloodWarning', 'FlashFloodWatch',
  'SpecialWeatherStatement',
])

const WARNING_TYPES = new Set([
  'WinterStormWarning', 'IceStormWarning', 'BlizzardWarning', 'HeavySnowWarning',
  'HighWindWarning', 'FloodWarning', 'FlashFloodWarning', 'SleetWarning', 'FreezeWarning',
])

let lastRefreshed = Date.now()

function timeSince() {
  const secs = Math.round((Date.now() - lastRefreshed) / 1000)
  if (secs < 10) return 'just now'
  if (secs < 60) return `${secs}s ago`
  return `${Math.round(secs / 60)}m ago`
}

async function fetchRoadAlerts() {
  try {
    const res = await fetch('https://api.weather.gov/alerts/active?zone=VAC059', {
      headers: { 'User-Agent': 'ridgeleahills.com' },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.features ?? [])
      .filter(f => ROAD_ALERT_TYPES.has(f.properties?.event))
      .map(f => ({
        event:    f.properties.event,
        headline: f.properties.headline ?? f.properties.event,
        severity: f.properties.severity,
        warning:  WARNING_TYPES.has(f.properties.event),
      }))
  } catch {
    return []
  }
}

function renderAlerts(alerts) {
  if (!alerts.length) return ''
  return `
    <div class="cam-alerts">
      ${alerts.map(a => `
        <div class="cam-alert ${a.warning ? 'cam-alert-warn' : 'cam-alert-adv'}">
          <span class="cam-alert-event">${a.event}</span>
          <span class="cam-alert-text">${a.headline}</span>
        </div>
      `).join('')}
    </div>
  `
}


function camCard(cam) {
  return `
    <div class="cam-card" data-name="${cam.name}">
      <div class="cam-img-wrap">
        <img class="cam-img"
             src="${SNAP(cam.name)}?t=${Date.now()}"
             alt="${cam.label}"
             loading="lazy"
             onerror="this.closest('.cam-card').classList.add('cam-unavailable')">
        <span class="cam-dir">${cam.dir}</span>
      </div>
      <div class="cam-body">
        <p class="cam-label">${cam.label}</p>
      </div>
    </div>
  `
}

function render(alerts) {
  const total = SECTIONS.reduce((n, s) => n + s.cams.length, 0)

  const sectionsHtml = SECTIONS.map(s => `
    <section class="cam-section">
      <div class="cam-section-header">
        <span class="cam-section-label">${s.title}</span>
        <span class="cam-section-count">${s.cams.length} ${s.cams.length === 1 ? 'camera' : 'cameras'}</span>
      </div>
      <div class="cam-grid">
        ${s.cams.map(camCard).join('')}
      </div>
    </section>
  `).join('')

  return `
    <div class="cam-intro">
      <p class="cam-intro-label">Ridgelea Hills</p>
      <h1 class="cam-intro-title">Traffic Cameras</h1>
      <p class="cam-intro-sub">${total} VDOT live feeds across ${SECTIONS.length} nearby corridors.</p>
      <p class="cam-intro-meta"><span class="cam-live-dot"></span>Live · updated <span id="cam-updated">just now</span> · refreshes every minute</p>
    </div>
    ${renderAlerts(alerts)}
    ${sectionsHtml}
    <p class="cam-credit">Camera feeds from <a href="https://www.vdotcameras.com" target="_blank" rel="noopener">VDOT</a>. Road condition alerts from <a href="https://www.weather.gov" target="_blank" rel="noopener">NWS</a>.</p>
  `
}

function refreshImages() {
  document.querySelectorAll('.cam-img').forEach(img => {
    const name = img.closest('.cam-card').dataset.name
    const next = new Image()
    next.onload = () => { img.src = next.src }
    next.src = `${SNAP(name)}?t=${Date.now()}`
  })
  lastRefreshed = Date.now()
  const el = document.getElementById('cam-updated')
  if (el) el.textContent = 'just now'
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const alerts = await fetchRoadAlerts()

  document.getElementById('cameras-page').innerHTML = render(alerts)

  // After initial load, push unavailable cameras to the end of their grid
  setTimeout(() => {
    document.querySelectorAll('.cam-grid').forEach(grid => {
      grid.querySelectorAll('.cam-card.cam-unavailable').forEach(card => grid.appendChild(card))
    })
  }, 4_000)

  setInterval(() => {
    const el = document.getElementById('cam-updated')
    if (el) el.textContent = timeSince()
  }, 15_000)

  setInterval(refreshImages, REFRESH_MS)
}

init()
