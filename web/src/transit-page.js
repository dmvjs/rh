import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

const LINE_COLOR = {
  RD: '#BF0000', BL: '#0078AE', OR: '#ED8B00',
  SV: '#919D9D', GR: '#00B140', YL: '#FFD200',
}

const LINE_NAME = {
  RD: 'Red', BL: 'Blue', OR: 'Orange',
  SV: 'Silver', GR: 'Green', YL: 'Yellow',
}

function fmtMin(min) {
  if (min === 'BRD') return '<span class="tr-now">BRD</span>'
  if (min === 'ARR') return '<span class="tr-now">ARR</span>'
  const n = parseInt(min)
  if (isNaN(n)) return '<span style="color:var(--muted)">—</span>'
  if (n === 0)  return '<span class="tr-now">Now</span>'
  return `<strong>${n}</strong> <span style="color:var(--muted);font-size:11px">min</span>`
}

function linkify(text) {
  return text.replace(/(https?:\/\/[^\s.,]+(?:\.[^\s.,]+)*[^\s.,])/g,
    '<a href="$1" target="_blank" rel="noopener" class="tr-alert-link">$1</a>')
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function section(title, content) {
  return `
    <div class="tr-section">
      <p class="tr-section-title">${title}</p>
      ${content}
    </div>
  `
}

function renderAlerts(alerts) {
  if (!alerts?.length) return ''
  const label = alerts.length === 1 ? '1 service alert' : `${alerts.length} service alerts`
  return `
    <details class="tr-alerts">
      <summary class="tr-alerts-summary">${label}</summary>
      ${alerts.map(a => `<p class="tr-alert-text">${linkify(a)}</p>`).join('')}
    </details>
  `
}

function renderRail(rail) {
  const alertsHtml = renderAlerts(rail.alerts)

  const stationsHtml = `
    <div class="tr-rail-grid">
      ${rail.stations.map(s => `
        <div class="tr-station">
          <p class="tr-station-name">${s.name}</p>
          ${s.trains.length ? `
            <div class="tr-trains">
              ${s.trains.map(t => `
                <div class="tr-train">
                  <span class="tr-line-dot" style="background:${t.color}" title="${LINE_NAME[t.line] ?? t.line}"></span>
                  <span class="tr-dest">${t.dest}</span>
                  <span class="tr-cars">${t.cars ? t.cars + ' car' : ''}</span>
                  <span class="tr-min">${fmtMin(t.min)}</span>
                </div>
              `).join('')}
            </div>
          ` : `<p class="tr-empty">No trains predicted</p>`}
        </div>
      `).join('')}
    </div>
  `

  return alertsHtml + stationsHtml
}

function renderBus(bus) {
  const alertsHtml = renderAlerts(bus.alerts)

  if (!bus.stops?.length) {
    return alertsHtml + '<p class="tr-empty">No buses with active predictions nearby.</p>'
  }

  const stopsHtml = bus.stops.map(s => `
    <div class="tr-stop">
      <div class="tr-stop-header">
        <span class="tr-stop-name">${s.name}</span>
        <span class="tr-stop-routes">${s.routes.join(' · ')}</span>
      </div>
      <div class="tr-arrivals">
        ${s.arrivals.map(a => `
          <div class="tr-arrival">
            <span class="tr-route-badge">${a.route}</span>
            <span class="tr-arrival-dest">${a.dest}</span>
            <span class="tr-min">${fmtMin(a.min)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')

  return alertsHtml + `<div class="tr-stops">${stopsHtml}</div>`
}

function render(data) {
  const { rail, bus, fetchedAt } = data

  return `
    ${section('Metro Rail · Vienna &amp; Dunn Loring', renderRail(rail))}
    ${section('Bus · Stops Near Ridgelea Hills', renderBus(bus))}
    <p class="tr-updated">Updated ${fmtTime(fetchedAt)} · Refreshes every 60 seconds</p>
  `
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const el = document.getElementById('transit-page')

  async function load() {
    try {
      const data = await api.get('/api/transit')
      if (data.error) {
        el.innerHTML = `<p style="color:var(--muted)">${data.error}</p>`
        return
      }
      el.innerHTML = render(data)
    } catch {
      el.innerHTML = '<p style="color:var(--muted)">Transit data unavailable.</p>'
    }
  }

  await load()
  setInterval(load, 60_000)
}

init()
