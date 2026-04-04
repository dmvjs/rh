import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function flowLabel(cfs, gh, stages) {
  if (gh != null && stages) {
    if (stages.major    && gh >= stages.major)    return { label: 'Major flood', cls: 'water-status-bad' }
    if (stages.moderate && gh >= stages.moderate) return { label: 'Moderate flood', cls: 'water-status-bad' }
    if (stages.flood    && gh >= stages.flood)    return { label: 'Flood stage', cls: 'water-status-bad' }
    if (stages.action   && gh >= stages.action)   return { label: 'Action stage', cls: 'water-status-warn' }
  }
  if (cfs === null || cfs === undefined) return { label: 'Unknown', cls: '' }
  if (cfs > 500)  return { label: 'High flow', cls: 'water-status-warn' }
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
  const flow  = flowLabel(dis?.noData ? null : dis?.value, gh?.noData ? null : gh?.value, g.floodStages)

  const stageBar = g.floodStages && gh && !gh.noData ? (() => {
    const s = g.floodStages
    const v = gh.value
    const markers = [
      { label: 'Action', val: s.action, color: '#f59e0b' },
      { label: 'Flood',  val: s.flood,  color: '#ef4444' },
      { label: 'Major',  val: s.major,  color: '#7f1d1d' },
    ].filter(m => m.val)
    if (!markers.length) return ''
    return `<div style="margin-top:6px;font-size:.75rem;color:var(--muted);display:flex;gap:10px;flex-wrap:wrap;">
      <span>Current: <strong>${v.toFixed(2)} ft</strong></span>
      ${markers.map(m => `<span style="color:${v >= m.val ? m.color : 'var(--muted)'};">${m.label}: ${m.val} ft</span>`).join('')}
    </div>`
  })() : ''

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
      ${stageBar}
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

function alertBanner(alerts) {
  if (!alerts?.length) return ''
  return alerts.map(a => `
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
        <p style="margin:0;font-weight:700;color:#b91c1c;font-size:.95rem;">${escHtml(a.event)}</p>
        <span class="water-status water-status-bad" style="white-space:nowrap;">${escHtml(a.severity)}</span>
      </div>
      ${a.headline ? `<p style="margin:6px 0 0;font-size:.85rem;color:#7f1d1d;">${escHtml(a.headline)}</p>` : ''}
    </div>
  `).join('')
}

function drinkingWaterSection(violations) {
  if (!violations) return ''
  const recent = violations.filter(v => v.isHealthBased)
  const nonHealth = violations.filter(v => !v.isHealthBased)

  function fmtDate(s) {
    if (!s) return ''
    const [y, m, d] = s.split('-').map(Number)
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1] + ` ${d}, ${y}`
  }

  function violationRow(v) {
    return `
      <div class="prop-card" style="padding:10px 14px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div>
            <p style="margin:0;font-size:.88rem;font-weight:600;">${escHtml(v.violation)}</p>
            <p style="margin:2px 0 0;font-size:.78rem;color:var(--muted);">${fmtDate(v.beginDate)}${v.rtcDate ? ` · resolved ${fmtDate(v.rtcDate)}` : ' · unresolved'}</p>
          </div>
          ${v.isHealthBased ? `<span class="water-status water-status-bad" style="white-space:nowrap;font-size:.72rem;">Health</span>` : `<span class="water-status" style="white-space:nowrap;font-size:.72rem;">Reporting</span>`}
        </div>
      </div>
    `
  }

  const rows = violations.map(violationRow).join('')
  const subtitle = violations.length === 0
    ? 'No violations in the last 5 years'
    : `${violations.length} violations (last 5 years) · ${recent.length} health-based · Fairfax Water PWSID VA6059079`

  return `
    <div class="prop-section">
      <div class="prop-section-header">
        <p class="prop-section-title">Drinking Water</p>
        <p class="prop-section-sub">${subtitle}</p>
      </div>
      ${violations.length === 0
        ? `<div class="prop-card" style="padding:12px 14px;"><p style="margin:0;color:var(--muted);font-size:.9rem;">No violations recorded. Fairfax Water serves this area from the Occoquan Reservoir and Potomac River.</p></div>`
        : `<div class="prop-cards">${rows}</div>`
      }
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

  const { gauges = [], waterQuality = [], history = null, alerts = [], drinkingWater = [] } = data

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
      <p class="pol-subtitle">Stream conditions, drinking water quality, and EPA assessments for the area. Data from USGS, NWS, EPA, and Fairfax Water.</p>
    </div>
    ${alertBanner(alerts)}
    ${drinkingWaterSection(drinkingWater)}
    ${sparkline(history)}
    ${gaugeHtml}
    ${wqHtml}
  `
}

init()
