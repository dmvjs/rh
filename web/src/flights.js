import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmtAlt(ft) {
  if (ft == null) return null
  return ft >= 1000 ? `${(ft / 1000).toFixed(1)}k ft` : `${ft} ft`
}

function altColor(ft) {
  if (ft == null) return 'var(--muted)'
  if (ft < 2000)  return '#b91c1c'
  if (ft < 6000)  return '#8a5a00'
  return 'var(--muted)'
}

function vertIcon(trend) {
  return { climbing: '↑', descending: '↓', level: '→' }[trend] ?? ''
}

function vertColor(trend) {
  return { climbing: '#2d6a35', descending: '#b91c1c', level: 'var(--muted)' }[trend] ?? 'var(--muted)'
}

function squawkBadge(sq) {
  if (!sq) return ''
  if (sq === '7500') return `<span class="water-status water-status-bad" title="Hijack">7500 HIJACK</span>`
  if (sq === '7600') return `<span class="water-status water-status-warn" title="Radio failure">7600 NORDO</span>`
  if (sq === '7700') return `<span class="water-status water-status-bad" title="Emergency">7700 EMERGENCY</span>`
  return ''
}

function aircraftCard(a) {
  const callsign   = a.callsign ?? '—'
  const flightNum  = a.callsign?.replace(/[A-Z]+/, '') ?? null
  const altStr     = fmtAlt(a.altFt)
  const speedStr   = a.speedKts != null ? `${a.speedKts} kts` : null
  const vertStr    = a.vertFpm != null ? `${a.vertFpm > 0 ? '+' : ''}${a.vertFpm} fpm` : null
  const distStr    = a.distMi != null ? `${a.distMi} mi` : null
  const dirStr     = a.cardinal && a.heading != null ? `${a.cardinal} (${a.heading}°)` : null
  const sq         = squawkBadge(a.squawk)

  return `
    <div class="prop-card" style="padding:12px 14px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-weight:700;font-size:1rem;letter-spacing:.02em;">${escHtml(callsign)}</span>
            ${a.airline ? `<span style="color:var(--muted);font-size:.82rem;">${escHtml(a.airline)}${flightNum ? ` ${flightNum}` : ''}</span>` : ''}
            ${sq}
            ${a.country && a.country !== 'United States' ? `<span style="font-size:.75rem;color:var(--muted);">${escHtml(a.country)}</span>` : ''}
          </div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:7px;">
            ${altStr ? `<div>
              <span style="font-size:.9rem;font-weight:600;color:${altColor(a.altFt)};">${altStr}</span>
              ${a.vertTrend ? `<span style="color:${vertColor(a.vertTrend)};font-weight:600;margin-left:4px;">${vertIcon(a.vertTrend)}</span>` : ''}
            </div>` : ''}
            ${speedStr ? `<span style="font-size:.85rem;color:var(--muted);">${speedStr}</span>` : ''}
            ${vertStr ? `<span style="font-size:.82rem;color:${vertColor(a.vertTrend)};">${vertStr}</span>` : ''}
            ${dirStr ? `<span style="font-size:.82rem;color:var(--muted);">heading ${dirStr}</span>` : ''}
          </div>
          ${a.phase ? `<p style="margin:4px 0 0;font-size:.75rem;color:var(--muted);">${a.phase}</p>` : ''}
        </div>
        <div style="text-align:right;white-space:nowrap;">
          ${distStr ? `<p style="margin:0;font-size:.8rem;color:var(--muted);">${distStr} away</p>` : ''}
          <p style="margin:2px 0 0;font-size:.7rem;color:var(--muted);font-family:monospace;">${escHtml(a.icao.toUpperCase())}</p>
          ${a.squawk && !['7500','7600','7700'].includes(a.squawk) ? `<p style="margin:2px 0 0;font-size:.7rem;color:var(--muted);">sqk ${a.squawk}</p>` : ''}
        </div>
      </div>
    </div>
  `
}

async function load(el) {
  const data = await api.get('/api/flights').catch(() => null)
  if (!data) {
    el.innerHTML = '<p style="color:var(--muted)">Could not load flight data.</p>'
    return
  }

  const { aircraft = [], fetchedAt } = data
  const time   = fetchedAt ? new Date(fetchedAt).toLocaleTimeString() : ''
  const low    = aircraft.filter(a => a.altFt != null && a.altFt < 5000)
  const emerg  = aircraft.filter(a => ['7500','7600','7700'].includes(a.squawk))

  const summary = [
    `${aircraft.length} aircraft in range`,
    low.length    ? `<span style="color:#b91c1c;font-weight:600;">${low.length} below 5,000 ft</span>` : null,
    emerg.length  ? `<span style="color:#b91c1c;font-weight:700;">${emerg.length} EMERGENCY SQUAWK</span>` : null,
  ].filter(Boolean).join(' · ')

  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Falls Church · Annandale · DCA approach corridor</p>
      <h1 class="pol-title">Flights Overhead</h1>
      <p class="pol-subtitle" id="flight-summary">${summary} · ${time} · <a href="#" id="refresh-link" style="color:var(--muted);">refresh</a></p>
    </div>
    ${aircraft.length === 0
      ? '<p style="color:var(--muted);padding:24px 0;">No aircraft currently overhead.</p>'
      : `<div style="display:flex;flex-direction:column;gap:8px;">${aircraft.map(aircraftCard).join('')}</div>`
    }
  `

  document.getElementById('refresh-link')?.addEventListener('click', e => {
    e.preventDefault()
    document.getElementById('flight-summary').textContent = 'Refreshing…'
    load(el)
  })
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const el = document.getElementById('flights-page')
  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Falls Church · Annandale · DCA approach corridor</p>
      <h1 class="pol-title">Flights Overhead</h1>
    </div>
    <div class="skeleton" style="height:90px;margin-bottom:8px;"></div>
    <div class="skeleton" style="height:90px;margin-bottom:8px;"></div>
    <div class="skeleton" style="height:90px;margin-bottom:8px;"></div>
  `

  await load(el)
  setInterval(() => load(el), 30_000)
}

init()
