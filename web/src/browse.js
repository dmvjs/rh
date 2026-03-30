import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

const LABELS = {
  'for-sale':        'For Sale',
  'free':            'Free',
  'services':        'Services',
  'lost-found':      'Lost & Found',
  'events':          'Events',
  'recommendations': 'Recommendations',
}

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtPrice(cents) {
  if (cents == null) return ''
  if (cents === 0) return 'free'
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function init() {
  const category = new URLSearchParams(location.search).get('category')
  const label = LABELS[category] ?? 'All Posts'

  document.title = `${label} — Ridglea Hills`
  document.getElementById('page-title').textContent = label

  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const qs = category ? `?category=${category}&limit=100` : '?limit=100'
  const { listings } = await api.get(`/api/listings${qs}`).catch(() => ({ listings: [] }))

  document.getElementById('listings').innerHTML = listings.length
    ? listings.map(l => `
        <div class="listing-row">
          <span class="listing-time">${fmtDate(l.created_at)}</span>
          <a href="/listing/?id=${l.id}" class="listing-title">${escHtml(l.title)}</a>
          <span class="listing-price">${fmtPrice(l.price)}</span>
        </div>
      `).join('')
    : '<p style="color:var(--muted);padding:20px 0">No posts in this category yet.</p>'
}

init()
