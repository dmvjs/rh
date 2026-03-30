import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function flowLabel(cfs) {
  if (cfs === null || cfs === undefined) return { label: 'Unknown', cls: '' }
  if (cfs > 500)  return { label: 'Flood risk', cls: 'water-status-bad' }
  if (cfs > 100)  return { label: 'High flow', cls: 'water-status-warn' }
  if (cfs > 20)   return { label: 'Elevated', cls: 'water-status-warn' }
  if (cfs > 0)    return { label: 'Normal', cls: 'water-status-good' }
  return { label: 'Low / dry', cls: 'water-status-warn' }
}

function statusLabel(status) {
  if (status === 'Cause')    return { label: 'Impaired', cls: 'water-status-bad' }
  if (status === 'Meeting')  return { label: 'Meeting standards', cls: 'water-status-good' }
  return { label: status ?? 'Unknown', cls: '' }
}

function tempC2F(c) {
  return (c * 9 / 5 + 32).toFixed(1)
}

function gaugeCard(g) {
  const dis   = g.discharge
  const gh    = g.gaugeHeight
  const temp  = g.waterTemp
  const flow  = flowLabel(dis?.noData ? null : dis?.value)

  return `
    <div class="prop-card">
      <div class="prop-card-top">
        <div>
          <p class="prop-address">${escHtml(g.name)}</p>
          <p style="margin:0;font-size:.8rem;color:var(--muted);">${escHtml(g.location)} · USGS ${escHtml(g.id)}</p>
        </div>
        <span class="water-status ${flow.cls}">${flow.label}</span>
      </div>
      <div class="prop-card-bottom" style="display:flex;gap:16px;flex-wrap:wrap;">
        ${dis && !dis.noData ? `<span style="font-size:.85rem;"><strong>${dis.value.toFixed(1)}</strong> <span style="color:var(--muted)">cfs discharge</span></span>` : ''}
        ${gh  && !gh.noData  ? `<span style="font-size:.85rem;"><strong>${gh.value.toFixed(2)} ft</strong> <span style="color:var(--muted)">gauge height</span></span>` : ''}
        ${temp && !temp.noData ? `<span style="font-size:.85rem;"><strong>${tempC2F(temp.value)}°F</strong> <span style="color:var(--muted)">water temp</span></span>` : ''}
      </div>
    </div>
  `
}

function wqCard(wb) {
  const { label, cls } = statusLabel(wb.status)
  const causes = wb.causes?.length
    ? `<p style="margin:4px 0 0;font-size:.8rem;color:var(--muted);">Impairments: ${wb.causes.map(escHtml).join(', ')}</p>`
    : ''
  return `
    <div class="prop-card">
      <div class="prop-card-top">
        <div>
          <p class="prop-address">${escHtml(wb.name)}</p>
          <p style="margin:0;font-size:.8rem;color:var(--muted);">${escHtml(wb.type ?? '')}</p>
          ${causes}
        </div>
        <span class="water-status ${cls}">${label}</span>
      </div>
    </div>
  `
}

function sparkline(history) {
  if (!history?.length) return ''
  const vals = history.map(p => p.v)
  const max  = Math.max(...vals, 1)
  const W    = 600, H = 60
  const pts  = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - (v / max) * H
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return `
    <div style="margin:0 0 24px;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;">
      <p style="margin:0 0 8px;font-size:.8rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;">Accotink Creek — gauge height, last 30 days</p>
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="60" preserveAspectRatio="none" style="display:block;">
        <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
      </svg>
      <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:.75rem;color:var(--muted);">
        <span>30 days ago</span>
        <span>now</span>
      </div>
    </div>
  `
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const el = document.getElementById('water-page')
  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Accotink Watershed · Fairfax County</p>
      <h1 class="pol-title">Water Quality</h1>
      <p class="pol-subtitle">Stream conditions and EPA water quality assessments for local creeks. Data from USGS and EPA ATTAINS.</p>
    </div>
    <div class="skeleton" style="height:90px;margin-bottom:12px;"></div>
    <div class="skeleton" style="height:90px;margin-bottom:12px;"></div>
    <div class="skeleton" style="height:90px;margin-bottom:12px;"></div>
  `

  const data = await api.get('/api/water').catch(() => null)

  if (!data) {
    el.innerHTML = '<p style="color:var(--muted)">Could not load water data.</p>'
    return
  }

  const { gauges = [], waterQuality = [], history = null } = data

  const gaugeHtml = gauges.length ? `
    <div class="prop-section">
      <div class="prop-section-header">
        <p class="prop-section-title">Stream Gauges</p>
        <p class="prop-section-sub">Live USGS readings</p>
      </div>
      <div class="prop-cards">${gauges.map(gaugeCard).join('')}</div>
    </div>
  ` : ''

  const wqHtml = waterQuality.length ? `
    <div class="prop-section">
      <div class="prop-section-header">
        <p class="prop-section-title">EPA Water Quality Assessments</p>
        <p class="prop-section-sub">Accotink watershed · local creeks</p>
      </div>
      <div class="prop-cards">${waterQuality.map(wqCard).join('')}</div>
    </div>
  ` : ''

  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Accotink Watershed · Fairfax County</p>
      <h1 class="pol-title">Water Quality</h1>
      <p class="pol-subtitle">Stream conditions and EPA water quality assessments for local creeks. Data from USGS and EPA ATTAINS.</p>
    </div>
    ${sparkline(history)}
    ${gaugeHtml}
    ${wqHtml}
  `
}

init()
