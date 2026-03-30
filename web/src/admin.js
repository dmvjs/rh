import { renderHeader, renderFooter, requireAuth } from './header.js'
import { api } from './api.js'

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function roleBadge(role) {
  const map = { admin: 'badge-approved', moderator: 'badge-pending', user: '' }
  return `<span class="badge ${map[role] ?? ''}">${role}</span>`
}

function pendingRow(u) {
  return `
    <tr data-id="${u.id}">
      <td>${escHtml(u.name)}</td>
      <td>${escHtml(u.email)}</td>
      <td>${escHtml(u.address)}</td>
      <td>${escHtml(u.phone)}</td>
      <td>${escHtml(u.note)}</td>
      <td style="white-space:nowrap;display:flex;gap:6px;">
        <button class="btn btn-sm approve-btn">Approve</button>
        <button class="btn btn-sm btn-danger reject-btn">Reject</button>
      </td>
    </tr>
  `
}

function memberRow(u, viewerRole) {
  const isAdmin = viewerRole === 'admin'
  return `
    <tr data-id="${u.id}">
      <td>${escHtml(u.name)}</td>
      <td>${escHtml(u.email)}</td>
      <td>${escHtml(u.address)}</td>
      <td>${roleBadge(u.role)}</td>
      <td style="white-space:nowrap;display:flex;gap:6px;">
        ${isAdmin ? `
          <select class="role-select" style="font-size:13px;padding:3px 6px;">
            <option value="user"      ${u.role === 'user'      ? 'selected' : ''}>user</option>
            <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>moderator</option>
            <option value="admin"     ${u.role === 'admin'     ? 'selected' : ''}>admin</option>
          </select>
          <button class="btn btn-sm role-btn">Save</button>
          <button class="btn btn-sm btn-danger delete-btn">Remove</button>
        ` : ''}
      </td>
    </tr>
  `
}

function tableWrap(cols, rows) {
  if (!rows) return '<p style="color:var(--muted)">None.</p>'
  return `
    <table class="admin-table">
      <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

async function load(viewerRole) {
  const { users } = await api.get('/api/admin/users')
  const pending  = users.filter(u => !u.approved)
  const members  = users.filter(u => u.approved)

  document.getElementById('pending').innerHTML = tableWrap(
    ['Name', 'Email', 'Address', 'Phone', 'Note', ''],
    pending.length ? pending.map(pendingRow).join('') : null
  )

  document.getElementById('all-users').innerHTML = tableWrap(
    ['Name', 'Email', 'Address', 'Role', ''],
    members.length ? members.map(u => memberRow(u, viewerRole)).join('') : null
  )

  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await api.post(`/api/admin/users/${btn.closest('tr').dataset.id}/approve`)
      load(viewerRole)
    })
  })

  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Reject and delete this registration?')) return
      await api.post(`/api/admin/users/${btn.closest('tr').dataset.id}/reject`)
      load(viewerRole)
    })
  })

  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row  = btn.closest('tr')
      const role = row.querySelector('.role-select').value
      await api.post(`/api/admin/users/${row.dataset.id}/role`, { role })
      load(viewerRole)
    })
  })

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this member and all their listings?')) return
      await api.delete(`/api/admin/users/${btn.closest('tr').dataset.id}`)
      load(viewerRole)
    })
  })
}

async function loadTrusted() {
  const { trusted } = await api.get('/api/admin/trusted-emails')
  const el = document.getElementById('trusted-list')

  if (!trusted.length) {
    el.innerHTML = '<p style="color:var(--muted)">None yet.</p>'
    return
  }

  el.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Email</th><th>Address</th><th></th></tr></thead>
      <tbody>
        ${trusted.map(t => `
          <tr data-id="${t.id}">
            <td>${escHtml(t.email)}</td>
            <td>${escHtml(t.address ?? '—')}</td>
            <td><button class="btn btn-sm btn-danger trusted-delete-btn">Remove</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `

  el.querySelectorAll('.trusted-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await api.delete(`/api/admin/trusted-emails/${btn.closest('tr').dataset.id}`)
      loadTrusted()
    })
  })
}

async function loadAds() {
  const { ads } = await api.get('/api/ads/admin')
  const el = document.getElementById('ad-list')

  if (!ads.length) {
    el.innerHTML = '<p style="color:var(--muted)">No ads yet.</p>'
    return
  }

  el.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Name</th><th>Size</th><th>Image</th><th>Click URL</th><th>Status</th><th></th></tr></thead>
      <tbody>
        ${ads.map(a => `
          <tr data-id="${a.id}">
            <td>${escHtml(a.name)}</td>
            <td style="white-space:nowrap;">${escHtml(a.size)}</td>
            <td><img src="${escHtml(a.image_url)}" style="max-height:40px;max-width:80px;object-fit:contain;"></td>
            <td style="font-size:.8rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;">${escHtml(a.click_url)}</td>
            <td><span class="badge ${a.active ? 'badge-approved' : ''}">${a.active ? 'Active' : 'Paused'}</span></td>
            <td style="white-space:nowrap;display:flex;gap:6px;">
              <button class="btn btn-sm ad-toggle-btn">${a.active ? 'Pause' : 'Activate'}</button>
              <button class="btn btn-sm btn-danger ad-delete-btn">Remove</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `

  el.querySelectorAll('.ad-toggle-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await api.post(`/api/ads/admin/${btn.closest('tr').dataset.id}/toggle`)
      loadAds()
    })
  })

  el.querySelectorAll('.ad-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this ad?')) return
      await api.delete(`/api/ads/admin/${btn.closest('tr').dataset.id}`)
      loadAds()
    })
  })
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const user = await requireAuth()
  if (!user || !['moderator', 'admin'].includes(user.role)) {
    window.location.href = '/'
    return
  }

  document.querySelector('main').style.visibility = ''
  await load(user.role)
  await loadAds()
  await loadTrusted()

  document.getElementById('ad-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = e.target.querySelector('button')
    btn.disabled = true
    try {
      await api.post('/api/ads/admin', {
        name:      document.getElementById('ad-name').value.trim(),
        size:      document.getElementById('ad-size').value,
        image_url: document.getElementById('ad-image').value.trim(),
        click_url: document.getElementById('ad-click').value.trim(),
      })
      e.target.reset()
      await loadAds()
    } catch (err) { alert(err.message) }
    btn.disabled = false
  })

  document.getElementById('trusted-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = e.target.querySelector('button')
    btn.disabled = true
    try {
      await api.post('/api/admin/trusted-emails', {
        email:   document.getElementById('trusted-email').value.trim(),
        address: document.getElementById('trusted-address').value.trim() || null,
      })
      e.target.reset()
      await loadTrusted()
    } catch (err) {
      alert(err.message)
    }
    btn.disabled = false
  })
}

init()
