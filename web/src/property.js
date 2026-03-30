import { renderHeader, renderFooter, requireAuth } from './header.js'
import { api } from './api.js'

function fmtPrice(n) {
  return '$' + Number(n).toLocaleString('en-US')
}

function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1]
  return `${mon} ${d}, ${y}`
}

function fmtCost(n) {
  if (!n) return null
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return fmtPrice(n)
}

function shortType(type) {
  return (type ?? '')
    .replace('Residential ', '')
    .replace('Commercial ', 'Commercial — ')
}

function saleCard(s) {
  const priceHtml = `<span class="prop-price">${fmtPrice(s.price)}</span>`
  const addrHtml  = s.address
    ? `<p class="prop-address">${s.address}</p>`
    : `<p class="prop-address prop-address-pin">PIN ${s.pin ?? '—'}</p>`
  const dateHtml  = s.date ? `<span class="prop-meta-date">${fmtDate(s.date)}</span>` : ''
  const validity  = s.validity === 'Pending verification'
    ? `<span class="prop-badge">Pending</span>` : ''
  const deedLink  = s.deedUrl
    ? `<a href="${s.deedUrl}" class="prop-btn" target="_blank" rel="noopener">View Deed</a>` : ''

  return `
    <div class="prop-card">
      <div class="prop-card-top">
        <div>
          ${addrHtml}
          <div class="prop-card-row">${priceHtml}${validity}</div>
        </div>
        <div class="prop-card-actions">${deedLink}</div>
      </div>
      ${dateHtml ? `<div class="prop-card-bottom">${dateHtml}</div>` : ''}
    </div>
  `
}

function permitCard(p) {
  const cost    = p.cost ? `<span class="prop-permit-cost">${fmtCost(p.cost)} est.</span>` : ''
  const status  = `<span class="prop-permit-status prop-status-${(p.status ?? '').toLowerCase().replace(/\s+/g, '-')}">${p.status ?? ''}</span>`
  const link    = p.url
    ? `<a href="${p.url}" class="prop-btn" target="_blank" rel="noopener">PLUS ↗</a>` : ''

  return `
    <div class="prop-card">
      <div class="prop-card-top">
        <div>
          <p class="prop-address">${p.address || '—'}</p>
          <div class="prop-card-row">
            <span class="prop-permit-type">${shortType(p.type)}</span>
            ${status}
          </div>
        </div>
        <div class="prop-card-actions">${link}</div>
      </div>
      <div class="prop-card-bottom">
        ${p.issuedDate ? `<span class="prop-meta-date">Issued ${fmtDate(p.issuedDate)}</span>` : ''}
        ${cost}
      </div>
    </div>
  `
}

function fmtDelta(assessed, prior) {
  if (!assessed || !prior) return ''
  const delta = assessed - prior
  const pct   = ((delta / prior) * 100).toFixed(1)
  const sign  = delta >= 0 ? '+' : ''
  const color = delta >= 0 ? '#3a7d44' : '#c0392b'
  return `<span style="color:${color};font-size:.8rem;font-weight:600;">${sign}${fmtPrice(delta)} (${sign}${pct}%)</span>`
}

function assessCard(a) {
  const delta = fmtDelta(a.assessed, a.prior)
  const exemp = a.exemption ? `<span class="prop-badge" style="background:#f5e6c8;color:#7a5a1a;">${a.exemption}</span>` : ''
  return `
    <div class="prop-card">
      <div class="prop-card-top">
        <div>
          <p class="prop-address">${a.address || `PIN ${a.pin}`}</p>
          <div class="prop-card-row">
            <span class="prop-price">${fmtPrice(a.assessed)}</span>
            ${exemp}
          </div>
        </div>
        <div style="text-align:right;">
          ${delta}
          ${a.prior ? `<p style="font-size:.75rem;color:var(--muted);margin:2px 0 0;">prior ${fmtPrice(a.prior)}</p>` : ''}
        </div>
      </div>
    </div>
  `
}

function zoningCard(z) {
  const link = z.url ? `<a href="${z.url}" class="prop-btn" target="_blank" rel="noopener">PLUS ↗</a>` : ''
  const desc = z.description ? `<p style="margin:4px 0 0;font-size:.8rem;color:var(--muted);line-height:1.4;">${z.description}</p>` : ''
  return `
    <div class="prop-card">
      <div class="prop-card-top">
        <div>
          <p class="prop-address">${z.address || `PIN ${z.pin}`}</p>
          <div class="prop-card-row">
            <span class="prop-permit-type">${z.type ?? ''}</span>
            <span class="prop-permit-status">${z.status ?? ''}</span>
          </div>
          ${z.applicant ? `<p style="margin:2px 0 0;font-size:.8rem;color:var(--muted);">Applicant: ${z.applicant}</p>` : ''}
          ${desc}
        </div>
        <div class="prop-card-actions">${link}</div>
      </div>
      <div class="prop-card-bottom">
        ${z.date ? `<span class="prop-meta-date">Submitted ${fmtDate(z.date)}</span>` : ''}
      </div>
    </div>
  `
}

function section(title, subtitle, cards) {
  if (!cards.length) return ''
  return `
    <div class="prop-section">
      <div class="prop-section-header">
        <p class="prop-section-title">${title}</p>
        ${subtitle ? `<p class="prop-section-sub">${subtitle}</p>` : ''}
      </div>
      <div class="prop-cards">${cards.join('')}</div>
    </div>
  `
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const user = await requireAuth()
  if (!user) return

  const el = document.getElementById('property-page')
  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Mason District · Fairfax County</p>
      <h1 class="pol-title">Property Activity</h1>
      <p class="pol-subtitle">Recent sales and permits on neighborhood streets. Data from Fairfax County.</p>
    </div>
    <div class="skeleton" style="height:100px;margin-bottom:12px;"></div>
    <div class="skeleton" style="height:100px;margin-bottom:12px;"></div>
    <div class="skeleton" style="height:100px;margin-bottom:12px;"></div>
  `

  const data = await api.get('/api/property').catch(() => null)

  if (!data) {
    el.innerHTML += '<p style="color:var(--muted)">Could not load property data.</p>'
    return
  }

  const { sales = [], permits = [], assessments = [], zoningCases = [] } = data

  // Sort assessments by year-over-year change descending
  const sortedAssess = [...assessments].sort((a, b) => ((b.assessed - b.prior) || 0) - ((a.assessed - a.prior) || 0))

  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Mason District · Fairfax County</p>
      <h1 class="pol-title">Property Activity</h1>
      <p class="pol-subtitle">Sales, permits, assessments, and zoning cases on neighborhood streets. Data from Fairfax County.</p>
    </div>
    ${section('Recent Sales', `${sales.length} sales on record`, sales.map(saleCard))}
    ${section('2026 Assessments', `${assessments.length} parcels · sorted by year-over-year change`, sortedAssess.map(assessCard))}
    ${section('Zoning Cases', `${zoningCases.length} cases · last 3 years`, zoningCases.map(zoningCard))}
    ${section('Building Permits', `${permits.length} permits · last 12 months`, permits.map(permitCard))}
  `
}

init()
