import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'
import { renderAd } from './ads.js'

const WMO_EMOJI = {
  0:'☀️',1:'🌤',2:'⛅️',3:'☁️',45:'🌫',48:'🌫',
  51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',
  71:'🌨',73:'🌨',75:'🌨',77:'🌨',80:'🌦',81:'🌧',82:'🌧',
  85:'🌨',86:'🌨',95:'⛈',96:'⛈',99:'⛈',
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function badge(a) {
  return a.local ? `<span class="news-badge">Ridgelea Hills</span>` : ''
}

function meta(a) {
  return `<p class="news-meta">${a.domain ? `<span class="news-domain">${esc(a.domain)}</span> &middot; ` : ''}${timeAgo(a.publishedAt)}</p>`
}

function renderHero(a) {
  const img = a.video
    ? `<video src="${esc(a.video)}" class="news-hero-img" controls muted playsinline></video>`
    : a.image
      ? `<img src="${esc(a.image)}" alt="" class="news-hero-img" loading="lazy">`
      : ''
  return `
    <a href="${esc(a.url)}" target="_blank" rel="noopener" class="news-hero">
      ${img}
      <div class="news-hero-body">
        ${badge(a)}
        <p class="news-hero-title">${esc(a.title)}</p>
        ${a.snippet ? `<p class="news-hero-snippet">${esc(a.snippet)}…</p>` : ''}
        ${meta(a)}
      </div>
    </a>
  `
}

function renderCard(a) {
  const thumb = a.video
    ? `<video src="${esc(a.video)}" class="news-thumb" muted playsinline></video>`
    : a.image
      ? `<img src="${esc(a.image)}" alt="" class="news-thumb" loading="lazy">`
      : ''
  return `
    <a href="${esc(a.url)}" target="_blank" rel="noopener" class="news-card">
      <div class="news-card-body">
        ${badge(a)}
        <p class="news-title">${esc(a.title)}</p>
        ${a.snippet ? `<p class="news-snippet">${esc(a.snippet)}…</p>` : ''}
        ${meta(a)}
      </div>
      ${thumb ? `<div class="news-thumb-wrap">${thumb}</div>` : ''}
    </a>
  `
}

function fmtIncidentType(raw) {
  const sub = raw.includes(' - ') ? raw.split(' - ').slice(1).join(' - ') : raw
  return sub.replace(/\//g, ' & ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function fmtAddress(raw) {
  return raw.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function fmtIncidentDate(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1]
  const [h, min] = timeStr.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12  = h % 12 || 12
  return `${month} ${d} · ${h12}:${String(min).padStart(2,'0')} ${ampm}`
}

function hoaMeetingNotice() {
  const now = new Date()
  const MONTHS = [1, 4, 7, 10] // Feb, May, Aug, Nov (0-indexed)

  function thirdThursday(year, month) {
    const d = new Date(year, month, 1)
    const offset = (4 - d.getDay() + 7) % 7
    return new Date(year, month, 1 + offset + 14)
  }

  for (let y = now.getFullYear(); y <= now.getFullYear() + 1; y++) {
    for (const m of MONTHS) {
      const day  = thirdThursday(y, m)
      const end  = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 20, 30)
      const from = new Date(day.getTime() - 7 * 24 * 60 * 60 * 1000)
      if (now >= from && now < end) {
        const MO = ['January','February','March','April','May','June','July','August','September','October','November','December']
        const isToday = day.toDateString() === now.toDateString()
        return { label: `${MO[day.getMonth()]} ${day.getDate()}`, isToday }
      }
    }
  }
  return null
}

function renderNeighborhood(local, police) {
  const hoa = hoaMeetingNotice()
  if (!local.length && !police.length && !hoa) return ''

  const hoaHtml = hoa ? `
    <p class="nbhd-section-label">HOA Board Meeting</p>
    <div class="nbhd-incident">
      <p class="nbhd-incident-type">${hoa.isToday ? 'Tonight · 7:00 – 8:30 PM' : `${hoa.label} · 7:00 – 8:30 PM`}</p>
    </div>
  ` : ''

  const policeHtml = police.length ? `
    <p class="nbhd-section-label">Fairfax County Police</p>
    ${police.map(p => `
      <div class="nbhd-incident">
        <p class="nbhd-incident-type">${esc(fmtIncidentType(p.type))}</p>
        <p class="nbhd-incident-meta">${esc(fmtAddress(p.address))} · ${esc(fmtIncidentDate(p.date, p.time))}</p>
      </div>
    `).join('')}
  ` : ''

  const localHtml = local.map(a => `
    <a href="${esc(a.url)}" target="_blank" rel="noopener" class="nbhd-article">
      <p class="nbhd-article-title">${esc(a.title)}</p>
      ${a.snippet ? `<p class="nbhd-article-snippet">${esc(a.snippet)}…</p>` : ''}
      <p class="nbhd-article-meta">${a.domain ? `<span>${esc(a.domain)}</span> · ` : ''}${timeAgo(a.publishedAt)}</p>
    </a>
  `).join('')

  return hoaHtml + policeHtml + localHtml
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const grid = document.getElementById('news-grid')
  grid.innerHTML = `
    <div class="news-sk-hero">
      <div class="skeleton news-sk-img"></div>
      <div class="news-sk-lines">
        <div class="skeleton news-sk-badge"></div>
        <div class="skeleton news-sk-t1"></div>
        <div class="skeleton news-sk-t2"></div>
        <div class="skeleton news-sk-meta"></div>
      </div>
    </div>
    ${[92, 78, 85].map(() => `
      <div class="news-sk-card">
        <div class="news-sk-lines">
          <div class="skeleton news-sk-t1"></div>
          <div class="skeleton news-sk-t2"></div>
          <div class="skeleton news-sk-meta"></div>
        </div>
        <div class="skeleton news-sk-thumb"></div>
      </div>
    `).join('')}
  `

  renderAd(document.getElementById('ad-leaderboard'),   '970x66')
  renderAd(document.getElementById('ad-skyscraper'),    '160x600')
  renderAd(document.getElementById('ad-mobile-banner'), '320x50')
  renderAd(document.getElementById('ad-mobile-rect'),   '300x250')

  // Kick off all fetches simultaneously but render news as soon as it arrives
  const newsPromise  = api.get('/api/news').catch(() => ({ articles: [] }))
  const localPromise = api.get('/api/news/local').catch(() => ({ local: [], police: [] }))
  const wxPromise    = api.get('/api/weather').catch(() => null)
  const alertsPromise = api.get('/api/alerts').catch(() => null)

  // Render main feed immediately when news resolves
  const { articles } = await newsPromise
  if (!articles.length) {
    grid.innerHTML = '<p style="color:var(--muted);padding:32px 0;">No stories right now.</p>'
  } else {
    const [first, ...rest] = articles
    grid.innerHTML = renderHero(first) + rest.map(renderCard).join('')
  }

  // Fill in sidebar and weather as the remaining requests finish
  const [{ local = [], police = [] }, wx, alertsRes] = await Promise.all([
    localPromise, wxPromise, alertsPromise,
  ])

  // Weather widget
  const widgetEl = document.getElementById('weather-widget')
  if (wx && widgetEl) {
    const c    = wx.current
    const emoji = WMO_EMOJI[c.code] ?? '🌡'
    const aqi   = wx.aqi?.aqi
    const aqiStr = aqi != null ? ` · AQI ${aqi}` : ''
    widgetEl.innerHTML = `
      <span class="wx-widget-temp">${c.temp}°</span>
      <span class="wx-widget-emoji">${emoji}</span>
      <span class="wx-widget-info">
        <span class="wx-widget-cond">${esc(c.condition)}</span>
        <span class="wx-widget-sub">Feels ${c.feelsLike}°${aqiStr}</span>
      </span>
      <span class="wx-widget-arrow">→</span>
    `
  } else if (widgetEl) {
    widgetEl.style.display = 'none'
  }

  // County alerts
  const alertsEl = document.getElementById('alerts-section')
  if (alertsRes?.alerts?.length && alertsEl) {
    alertsEl.style.display = 'block'
    alertsEl.innerHTML = `
      <div class="county-alerts">
        <p class="county-alerts-label">Fairfax County</p>
        ${alertsRes.alerts.map(a => `
          <div class="county-alert-item">
            <p class="county-alert-title">${a.url
              ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.title)}</a>`
              : esc(a.title)}</p>
            ${a.snippet ? `<p class="county-alert-snippet">${esc(a.snippet)}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `
  }

  // Neighborhood sidebar
  const nbhdSection = document.getElementById('neighborhood-section')
  const nbhdList    = document.getElementById('neighborhood-list')
  const nbhdContent = renderNeighborhood(local, police)
  if (nbhdContent && nbhdSection && nbhdList) {
    nbhdSection.style.display = 'block'
    nbhdList.innerHTML = nbhdContent
  }
}

init()
