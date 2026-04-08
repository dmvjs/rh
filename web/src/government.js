import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function initials(name) {
  return name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

const PARTY_LABEL  = { D: 'Dem.', R: 'Rep.', I: 'Ind.' }
const PARTY_COLOR  = { D: '#1d4ed8', R: '#b91c1c', I: '#6b6b65' }
const PARTY_BG     = { D: '#dbeafe', R: '#fee2e2', I: '#f0f0ee' }
const PARTY_BORDER = { D: '#93c5fd', R: '#fca5a5', I: '#e2e2de' }

function photoEl(o) {
  const color  = PARTY_COLOR[o.party]  ?? PARTY_COLOR.I
  const bg     = PARTY_BG[o.party]    ?? PARTY_BG.I
  const border = PARTY_BORDER[o.party] ?? PARTY_BORDER.I
  const inits  = esc(initials(o.name))

  const fallback = `<div class="gov-photo-init" style="background:${bg};color:${color};">${inits}</div>`
  if (!o.photo) {
    return `<div class="gov-photo" style="border-color:${border};">${fallback}</div>`
  }
  return `
    <div class="gov-photo" style="border-color:${border};">
      <img src="${esc(o.photo)}" alt="${esc(o.name)}" class="gov-photo-img"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="gov-photo-init" style="background:${bg};color:${color};display:none;">${inits}</div>
    </div>
  `
}

function officialCard(o) {
  const accentColor = PARTY_COLOR[o.party] ?? PARTY_COLOR.I
  const bgColor     = PARTY_BG[o.party]    ?? PARTY_BG.I

  const contactHtml = o.contact
    ? `<a href="${esc(o.contact)}" class="gov-btn"
         ${o.contact.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>Contact</a>`
    : ''

  const websiteHtml = o.website && o.website !== o.contact
    ? `<a href="${esc(o.website)}" class="gov-btn gov-btn-ghost" target="_blank" rel="noopener">Website</a>`
    : ''

  const primaryPhone = o.phones?.[0]
  const phoneHtml = primaryPhone
    ? `<a href="tel:${esc(primaryPhone.number.replace(/\D/g,''))}" class="gov-phone-link">${esc(primaryPhone.number)}</a>`
    : ''

  const footerItems = [contactHtml, websiteHtml, phoneHtml].filter(Boolean)

  return `
    <div class="gov-card">
      ${photoEl(o)}
      <span class="gov-card-role">${esc(o.title)}</span>
      <p class="gov-card-name">${esc(o.name)}</p>
      <div class="gov-card-meta">
        <span class="gov-party-badge" style="background:${bgColor};color:${accentColor};">${PARTY_LABEL[o.party] ?? o.party}</span>
        ${o.district ? `<span class="gov-card-district">${esc(o.district)}</span>` : ''}
      </div>
      ${o.term ? `<p class="gov-card-term">${esc(o.term)}</p>` : ''}
      ${footerItems.length ? `<div class="gov-card-footer">${footerItems.join('')}</div>` : ''}
    </div>
  `
}

function nextElectionCard(elections) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const upcoming = elections
    .filter(e => e.iso)
    .map(e => ({ ...e, d: new Date(e.iso + 'T00:00:00') }))
    .filter(e => e.d >= today)
    .sort((a, b) => a.d - b.d)

  if (!upcoming.length) return ''
  const next = upcoming[0]
  const days = Math.ceil((next.d - today) / 86400000)
  const badge = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`

  return `
    <div class="gov-next-card">
      <div class="gov-next-inner">
        <span class="gov-next-eyebrow">Next Election</span>
        <p class="gov-next-date">${esc(next.date)}</p>
        <p class="gov-next-label">${esc(next.label)}</p>
      </div>
      <div class="gov-next-badge">${esc(badge)}</div>
    </div>
  `
}

function levelSection(label, cards) {
  if (!cards.length) return ''
  return `
    <div class="pol-section">
      <p class="pol-section-title">${esc(label)}</p>
      <div class="gov-grid">${cards.map(officialCard).join('')}</div>
    </div>
  `
}

function electionsSection(elections) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const rows = elections.map(e => {
    const d = e.iso ? new Date(e.iso + 'T00:00:00') : null
    const past = d && d < today
    return `
      <div class="gov-tl-row${past ? ' gov-tl-past' : ''}">
        <div class="gov-tl-dot"></div>
        <div class="gov-tl-content">
          <span class="gov-tl-date">${esc(e.date)}</span>
          <span class="gov-tl-label">${esc(e.label)}</span>
        </div>
      </div>
    `
  }).join('')
  return `
    <div class="pol-section">
      <p class="pol-section-title">Upcoming Elections</p>
      <div class="gov-timeline">${rows}</div>
    </div>
  `
}

function resourcesSection(resources) {
  return `
    <div class="pol-section">
      <p class="pol-section-title">Voter Resources</p>
      <div class="pol-resources">
        ${resources.map(r =>
          `<a href="${esc(r.url)}" class="pol-resource" target="_blank" rel="noopener">${esc(r.label)} →</a>`
        ).join('')}
      </div>
    </div>
  `
}

function render(data) {
  const { officials = [], elections = [], resources = [], source, fetchedAt } = data

  const LEVELS = ['Federal', 'State', 'County']
  const sectionsHtml = LEVELS.map(lvl =>
    levelSection(lvl, officials.filter(o => o.level === lvl))
  ).join('')

  const otherLevels = [...new Set(
    officials.filter(o => !LEVELS.includes(o.level)).map(o => o.level)
  )]
  const otherHtml = otherLevels.map(lvl =>
    levelSection(lvl, officials.filter(o => o.level === lvl))
  ).join('')

  const sourceTag = source === 'google'
    ? `<span class="pol-source">via Google Civic</span>`
    : `<span class="pol-source">static data</span>`

  const updated = fetchedAt
    ? `<p class="pol-updated">Officials ${sourceTag} · Updated ${new Date(fetchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>`
    : ''

  return `
    <div class="pol-intro">
      <p class="pol-intro-label">Mason District · Fairfax County · Virginia</p>
      <h1 class="pol-title">Your Government</h1>
      <p class="pol-subtitle">Your elected officials, upcoming elections, and resources to stay engaged.</p>
    </div>
    ${nextElectionCard(elections)}
    ${sectionsHtml}
    ${otherHtml}
    ${electionsSection(elections)}
    ${resourcesSection(resources)}
    ${updated}
  `
}

function skeletonGrid() {
  const card = `<div class="skeleton" style="height:108px;border-radius:4px;"></div>`
  return `<div class="gov-grid">${card}${card}</div>`
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const el = document.getElementById('government-page')

  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Mason District · Fairfax County · Virginia</p>
      <h1 class="pol-title">Your Government</h1>
      <p class="pol-subtitle">Your elected officials, upcoming elections, and resources to stay engaged.</p>
    </div>
    <div class="skeleton" style="height:78px;margin-top:24px;border-radius:6px;"></div>
    <div class="pol-section"><p class="pol-section-title">Federal</p>${skeletonGrid()}</div>
    <div class="pol-section"><p class="pol-section-title">State</p>${skeletonGrid()}</div>
    <div class="pol-section"><p class="pol-section-title">County</p>${skeletonGrid()}</div>
  `

  const data = await api.get('/api/government').catch(() => null)
  if (!data) {
    el.innerHTML = '<p style="color:var(--muted);padding:40px 0">Could not load government data.</p>'
    return
  }
  el.innerHTML = render(data)
}

init()
