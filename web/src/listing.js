import { renderHeader, renderFooter, getUser } from './header.js'
import { api, imgUrl } from './api.js'

const LABELS = {
  'for-sale':        'For Sale',
  'free':            'Free',
  'services':        'Services',
  'lost-found':      'Lost & Found',
  'events':          'Events',
  'recommendations': 'Recommendations',
}

function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtPrice(cents) {
  if (cents == null) return null
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function init() {
  const id = new URLSearchParams(location.search).get('id')
  if (!id) { window.location.href = '/'; return }

  const [listing, user] = await Promise.all([
    api.get(`/api/listings/${id}`),
    getUser(),
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  document.title = `${listing.title} — Ridglea Hills`

  const price = fmtPrice(listing.price)
  const canDelete = user && (user.id === listing.user_id || user.admin)

  document.getElementById('listing-content').innerHTML = `
    <div class="listing-detail">
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">
        <a href="/">&larr; home</a> &nbsp;&middot;&nbsp;
        <a href="/community/?category=${listing.category}">${LABELS[listing.category] ?? listing.category}</a>
      </p>
      <h1 class="detail-title">${escHtml(listing.title)}</h1>
      ${price ? `<p class="detail-price">${price}</p>` : ''}
      <div class="detail-meta">
        <span>Posted by ${escHtml(listing.author)}</span>
        <span>${fmtDate(listing.created_at)}</span>
      </div>
      ${listing.images.length ? `
        <div class="detail-images">
          ${listing.images.map(k => `<img src="${imgUrl(k)}" alt="">`).join('')}
        </div>
      ` : ''}
      <p class="detail-body">${escHtml(listing.body)}</p>
      ${listing.author_email ? `
        <p style="margin-top:20px;font-size:13px;color:var(--muted)">
          <a href="mailto:${escHtml(listing.author_email)}" style="color:var(--muted)">email the poster</a>
        </p>
      ` : ''}
      ${listing.contact_email || listing.contact_phone ? `
        <div class="contact-box">
          <h3>Contact</h3>
          ${listing.contact_email ? `<p><a href="mailto:${escHtml(listing.contact_email)}">${escHtml(listing.contact_email)}</a></p>` : ''}
          ${listing.contact_phone ? `<p>${escHtml(listing.contact_phone)}</p>` : ''}
        </div>
      ` : ''}
      ${canDelete ? `
        <div style="margin-top:24px">
          <button id="delete-btn" class="btn btn-danger btn-sm">Remove listing</button>
        </div>
      ` : ''}
    </div>
  `

  document.getElementById('delete-btn')?.addEventListener('click', async () => {
    if (!confirm('Remove this listing?')) return
    await api.delete(`/api/listings/${id}`)
    window.location.href = '/'
  })
}

init()
