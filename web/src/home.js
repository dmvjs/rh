import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

const CATEGORIES = [
  { slug: 'for-sale',         label: 'For Sale' },
  { slug: 'free',             label: 'Free' },
  { slug: 'services',         label: 'Services' },
  { slug: 'lost-found',       label: 'Lost & Found' },
  { slug: 'events',           label: 'Events' },
  { slug: 'recommendations',  label: 'Recommendations' },
]

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtPrice(cents) {
  if (cents == null) return ''
  if (cents === 0) return 'free'
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const { listings } = await api.get('/api/listings?limit=40').catch(() => ({ listings: [] }))

  const counts = {}
  for (const l of listings) counts[l.category] = (counts[l.category] ?? 0) + 1

  document.getElementById('categories').innerHTML = CATEGORIES.map(({ slug, label }) => `
    <a href="/community/?category=${slug}" class="category-link">
      ${label}
      <span class="category-count">${counts[slug] ?? 0}</span>
    </a>
  `).join('')

  document.getElementById('recent-listings').innerHTML = listings.length
    ? listings.map(l => `
        <div class="listing-row">
          <span class="listing-time">${fmtDate(l.created_at)}</span>
          <a href="/listing/?id=${l.id}" class="listing-title">${escHtml(l.title)}</a>
          <span class="listing-price">${fmtPrice(l.price)}</span>
        </div>
      `).join('')
    : '<p style="color:var(--muted);padding:20px 0">No posts yet — be the first!</p>'
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

init()
