import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function fmtMoney(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1] + ` ${d}, ${y}`
}

function donationRow(d) {
  const name = d.name
    ? d.name.replace(/,\s*/, ', ')  // "SMITH, JOHN" → "Smith, John"
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase())
    : '—'

  const employer = d.employer
    ? `<span style="color:var(--muted);font-size:.8rem;">${escHtml(d.employer)}</span>`
    : ''
  const occ = d.occupation && d.occupation !== d.employer
    ? `<span style="color:var(--muted);font-size:.8rem;">${escHtml(d.occupation)}</span>`
    : ''

  const committee = d.committee ?? '—'
  const candidate = d.candidate ? ` · ${d.candidate}` : ''

  return `
    <div class="prop-card" style="padding:10px 14px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
        <div>
          <p style="margin:0;font-weight:600;font-size:.92rem;">${escHtml(name)}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px;">${employer}${occ ? ` · ${occ}` : ''}</div>
          <p style="margin:4px 0 0;font-size:.8rem;color:var(--muted);">${escHtml(committee)}${escHtml(candidate)}</p>
        </div>
        <div style="text-align:right;white-space:nowrap;">
          <p style="margin:0;font-weight:700;font-size:.95rem;color:var(--text);">${fmtMoney(d.amount)}</p>
          <p style="margin:2px 0 0;font-size:.75rem;color:var(--muted);">${fmtDate(d.date)}</p>
          <p style="margin:2px 0 0;font-size:.72rem;color:var(--muted);">${d.zip ?? ''} · ${d.cycle ?? ''}</p>
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

  const el = document.getElementById('donations-page')
  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Zip code 22031 · Ridglea Hills</p>
      <h1 class="pol-title">Political Donations</h1>
      <p class="pol-subtitle">Federal campaign contributions from area residents, via FEC public records. 2022–2024 election cycles.</p>
    </div>
    <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
    <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
    <div class="skeleton" style="height:80px;margin-bottom:8px;"></div>
  `

  const data = await api.get('/api/donations').catch(() => null)

  if (!data) {
    el.querySelector('.pol-intro').insertAdjacentHTML('afterend', '<p style="color:var(--muted)">Could not load donation data.</p>')
    el.querySelectorAll('.skeleton').forEach(s => s.remove())
    return
  }

  const { donations = [] } = data
  const total  = donations.reduce((s, d) => s + (d.amount || 0), 0)
  const unique = new Set(donations.map(d => d.name)).size

  function renderList(list) {
    if (!list.length) return '<p style="color:var(--muted);padding:12px 0;">No results.</p>'
    return `<div style="display:flex;flex-direction:column;gap:8px;">${list.map(donationRow).join('')}</div>`
  }

  el.innerHTML = `
    <div class="pol-intro">
      <p class="pol-intro-label">Zip code 22031 · Ridglea Hills</p>
      <h1 class="pol-title">Political Donations</h1>
      <p class="pol-subtitle">${donations.length.toLocaleString()} contributions from ${unique.toLocaleString()} donors totaling ${fmtMoney(total)}. FEC public records, 2022–2024.</p>
    </div>
    <input id="don-search" type="search" placeholder="Search by name, employer, committee, candidate…" style="width:100%;box-sizing:border-box;padding:8px 12px;font-size:.9rem;border:1px solid var(--border);border-radius:6px;margin-bottom:16px;background:var(--bg);color:var(--text);">
    <div id="don-list"></div>
  `

  const listEl = document.getElementById('don-list')
  listEl.innerHTML = renderList(donations)

  document.getElementById('don-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim()
    const filtered = q
      ? donations.filter(d =>
          (d.name ?? '').toLowerCase().includes(q) ||
          (d.employer ?? '').toLowerCase().includes(q) ||
          (d.occupation ?? '').toLowerCase().includes(q) ||
          (d.committee ?? '').toLowerCase().includes(q) ||
          (d.candidate ?? '').toLowerCase().includes(q))
      : donations
    listEl.innerHTML = renderList(filtered)
  })
}

init()
