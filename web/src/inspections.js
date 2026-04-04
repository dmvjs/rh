import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function amenityLabel(a) {
  return { restaurant: 'Restaurant', fast_food: 'Fast Food', cafe: 'Café', bar: 'Bar', food_court: 'Food Court' }[a] ?? a
}

function establishmentCard(e) {
  const cuisine = e.cuisine ? `<span style="color:var(--muted);font-size:.78rem;">${escHtml(e.cuisine)}</span>` : ''
  const type    = `<span style="font-size:.78rem;color:var(--muted);">${amenityLabel(e.amenity)}</span>`
  const addr    = e.address ? `<p style="margin:2px 0 0;font-size:.8rem;color:var(--muted);">${escHtml(e.address)}${e.city ? `, ${escHtml(e.city)}` : ''}</p>` : ''
  const permit  = e.permitUrl
    ? `<a href="${escHtml(e.permitUrl)}" class="prop-btn" target="_blank" rel="noopener" style="font-size:.75rem;">Inspection ↗</a>`
    : ''

  return `
    <div class="prop-card" style="padding:10px 14px;">
      <div class="prop-card-top">
        <div>
          <p style="margin:0;font-weight:600;font-size:.95rem;">${escHtml(e.name)}</p>
          <div style="display:flex;gap:6px;align-items:center;margin-top:2px;">${type}${cuisine ? ` · ${cuisine}` : ''}</div>
          ${addr}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
          ${permit}
        </div>
      </div>
    </div>
  `
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const el = document.getElementById('inspections-page')
  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Annandale · Falls Church · Bailey's Crossroads</p>
      <h1 class="pol-title">Food Establishments</h1>
      <p class="pol-subtitle">Restaurants, cafés, and bars in the area. Click "Inspection" for Fairfax County health records.</p>
    </div>
    <div class="skeleton" style="height:70px;margin-bottom:8px;"></div>
    <div class="skeleton" style="height:70px;margin-bottom:8px;"></div>
    <div class="skeleton" style="height:70px;margin-bottom:8px;"></div>
  `

  const data = await api.get('/api/inspections').catch(() => null)

  if (!data) {
    el.innerHTML += '<p style="color:var(--muted)">Could not load data.</p>'
    return
  }

  const { establishments = [], totalPermits = 0 } = data
  const useful = establishments.filter(e => e.permitUrl)
  const withPermit = useful.filter(e => e.permitUrl).length
  const order = ['restaurant', 'fast_food', 'cafe', 'bar', 'food_court']

  function renderList(list) {
    if (!list.length) return '<p style="color:var(--muted);padding:12px 0;">No results.</p>'
    const byType = {}
    for (const e of list) {
      const k = e.amenity ?? 'other'
      if (!byType[k]) byType[k] = []
      byType[k].push(e)
    }
    return [...order, ...Object.keys(byType).filter(k => !order.includes(k))]
      .filter(k => byType[k]?.length)
      .map(k => `
        <div class="prop-section">
          <div class="prop-section-header">
            <p class="prop-section-title">${amenityLabel(k)}s</p>
            <p class="prop-section-sub">${byType[k].length} locations</p>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">${byType[k].map(establishmentCard).join('')}</div>
        </div>
      `).join('')
  }

  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Annandale · Falls Church · Bailey's Crossroads</p>
      <h1 class="pol-title">Food Establishments</h1>
      <p class="pol-subtitle">${useful.length} places · ${withPermit} with Fairfax County inspection records linked · ${totalPermits} total active food permits in area.</p>
    </div>
    <input id="food-search" type="search" placeholder="Search by name, cuisine, address…" style="width:100%;box-sizing:border-box;padding:8px 12px;font-size:.9rem;border:1px solid var(--border);border-radius:6px;margin-bottom:16px;background:var(--bg);color:var(--text);">
    <div id="food-list"></div>
  `

  const listEl = document.getElementById('food-list')
  listEl.innerHTML = renderList(useful)

  document.getElementById('food-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim()
    const filtered = q
      ? useful.filter(x =>
          (x.name ?? '').toLowerCase().includes(q) ||
          (x.cuisine ?? '').toLowerCase().includes(q) ||
          (x.address ?? '').toLowerCase().includes(q) ||
          (x.city ?? '').toLowerCase().includes(q))
      : useful
    listEl.innerHTML = renderList(filtered)
  })
}

init()
