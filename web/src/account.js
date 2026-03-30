import { renderHeader, renderFooter, requireAuth } from './header.js'
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

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function load() {
  const { listings } = await api.get('/api/listings/mine')
  const el = document.getElementById('my-listings')

  if (!listings.length) {
    el.innerHTML = '<p style="color:var(--muted)">No posts yet. <a href="/post/">Post something</a></p>'
    return
  }

  el.innerHTML = listings.map(l => `
    <div class="listing-row" data-id="${l.id}">
      <span class="listing-time">${fmtDate(l.created_at)}</span>
      <a href="/listing/?id=${l.id}" class="listing-title">${escHtml(l.title)}</a>
      <span class="listing-cat">${LABELS[l.category] ?? l.category}</span>
      <button class="btn btn-sm btn-danger delete-btn" style="margin-left:8px">Remove</button>
    </div>
  `).join('')

  el.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('[data-id]').dataset.id
      if (!confirm('Remove this listing?')) return
      await api.delete(`/api/listings/${id}`)
      load()
    })
  })
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])
  await requireAuth()
  await load()
}

init()
