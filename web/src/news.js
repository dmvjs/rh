import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'
import { renderAd } from './ads.js'

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const el = document.getElementById('news-grid')
  el.innerHTML = `
    <div class="skeleton" style="height:120px;margin-bottom:12px;"></div>
    <div class="skeleton" style="height:120px;margin-bottom:12px;"></div>
    <div class="skeleton" style="height:120px;margin-bottom:12px;"></div>
  `

  const WMO_EMOJI = {
    0:'☀️',1:'🌤',2:'⛅️',3:'☁️',45:'🌫',48:'🌫',
    51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',
    71:'🌨',73:'🌨',75:'🌨',77:'🌨',80:'🌦',81:'🌧',82:'🌧',
    85:'🌨',86:'🌨',95:'⛈',96:'⛈',99:'⛈',
  }

  renderAd(document.getElementById('ad-leaderboard'), '970x66')
  renderAd(document.getElementById('ad-skyscraper'),  '160x600')

  const [{ articles }, { local = [], police = [] }, wx, alertsRes] = await Promise.all([
    api.get('/api/news').catch(() => ({ articles: [] })),
    api.get('/api/news/local').catch(() => ({ local: [], police: [] })),
    api.get('/api/weather').catch(() => null),
    api.get('/api/alerts').catch(() => null),
  ])

  const alertsEl = document.getElementById('alerts-section')
  if (alertsRes?.alerts?.length && alertsEl) {
    alertsEl.style.display = 'block'
    alertsEl.innerHTML = `
      <div class="county-alerts">
        <p class="county-alerts-label">Fairfax County</p>
        ${alertsRes.alerts.map(a => `
          <div class="county-alert-item">
            <p class="county-alert-title">${a.url
              ? `<a href="${escHtml(a.url)}" target="_blank" rel="noopener">${escHtml(a.title)}</a>`
              : escHtml(a.title)}</p>
            ${a.snippet ? `<p class="county-alert-snippet">${escHtml(a.snippet)}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `
  }

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
        <span class="wx-widget-cond">${escHtml(c.condition)}</span>
        <span class="wx-widget-sub">Feels ${c.feelsLike}°${aqiStr}</span>
      </span>
      <span class="wx-widget-arrow">→</span>
    `
  } else if (widgetEl) {
    widgetEl.style.display = 'none'
  }

  function fmtIncidentType(raw) {
    // Strip category prefix ("SERVICE - ", "LARCENY - ", etc.) and title-case
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

  // Neighborhood section — only show if there is genuinely local content
  if (local.length || police.length) {
    document.getElementById('neighborhood-section').style.display = 'block'

    const policeHtml = police.length ? `
      <p style="font-size:.7rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:0 0 6px;">Fairfax County Police</p>
      ${police.map(p => `
        <div style="border-bottom:1px solid var(--border);padding:9px 0;">
          <p style="margin:0 0 2px;font-size:.85rem;font-weight:500;line-height:1.4;color:var(--text);">${escHtml(fmtIncidentType(p.type))}</p>
          <p style="margin:0;font-size:.75rem;color:var(--muted);">${escHtml(fmtAddress(p.address))} &middot; ${escHtml(fmtIncidentDate(p.date, p.time))}</p>
        </div>
      `).join('')}
    ` : ''

    const localHtml = local.map(a => `
      <div style="border-bottom:1px solid var(--border);padding:12px 0;">
        <a href="${escHtml(a.url)}" target="_blank" rel="noopener" class="news-title-link">
          <p style="margin:0 0 4px;font-weight:500;line-height:1.4;">${escHtml(a.title)}</p>
        </a>
        ${a.snippet ? `<p style="margin:0 0 4px;font-size:.85rem;color:var(--muted);">${escHtml(a.snippet)}…</p>` : ''}
        <p style="margin:0;font-size:.8rem;color:var(--muted);">${a.domain ? `<span>${escHtml(a.domain)}</span> &middot; ` : ''}${timeAgo(a.publishedAt)}</p>
      </div>
    `).join('')

    document.getElementById('neighborhood-list').innerHTML = policeHtml + localHtml
  }

  // General news
  if (!articles.length) {
    el.innerHTML = '<p style="color:var(--muted)">No stories right now.</p>'
    return
  }

  el.innerHTML = articles.map(a => `
    <div class="news-card">
      ${a.video
        ? `<video src="${escHtml(a.video)}" class="news-img" controls muted playsinline></video>`
        : a.image
          ? `<img src="${escHtml(a.image)}" alt="" class="news-img">`
          : '<div class="news-img news-img-placeholder"></div>'
      }
      <div class="news-body">
        <a href="${escHtml(a.url)}" target="_blank" rel="noopener" class="news-title-link">
          <p class="news-title">${escHtml(a.title)}</p>
        </a>
        ${a.snippet ? `<p class="news-snippet">${escHtml(a.snippet)}…</p>` : ''}
        <p class="news-meta">${a.domain ? `<span class="news-domain">${escHtml(a.domain)}</span> &middot; ` : ''}${a.author ? escHtml(a.author) + ' &middot; ' : ''}${timeAgo(a.publishedAt)}</p>
      </div>
    </div>
  `).join('')
}

init()
