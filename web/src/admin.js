import { renderHeader, renderFooter, requireAuth } from './header.js'
import { api } from './api.js'

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function roleBadge(role) {
  const map = { admin: 'badge-approved', moderator: 'badge-pending', user: '' }
  return `<span class="badge ${map[role] ?? ''}">${role}</span>`
}

function pendingRow(u) {
  return `
    <tr data-id="${u.id}">
      <td>${escHtml(u.name)}</td>
      <td style="white-space:nowrap;">${escHtml(u.address)}</td>
      <td>${escHtml(u.note)}</td>
      <td><span class="badge ${u.email_verified ? 'badge-approved' : ''}">${u.email_verified ? 'verified' : 'unverified'}</span></td>
      <td style="white-space:nowrap;">
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm approve-btn">Approve</button>
          <button class="btn btn-sm btn-danger reject-btn">Reject</button>
        </div>
      </td>
    </tr>
  `
}

function memberRow(u, viewerRole, viewerId) {
  const isAdmin  = viewerRole === 'admin'
  const isSelf   = u.id === viewerId
  return `
    <tr data-id="${u.id}">
      <td style="white-space:nowrap;font-size:.85rem;">${escHtml(u.name)}</td>
      <td style="white-space:nowrap;font-size:.85rem;">${escHtml(u.address)}</td>
      <td>
        ${isAdmin ? `
          <div style="display:flex;gap:6px;">
            <select class="role-select" style="font-size:13px;padding:3px 6px;max-width:110px;">
              <option value="user"      ${u.role === 'user'      ? 'selected' : ''}>user</option>
              <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>moderator</option>
              <option value="admin"     ${u.role === 'admin'     ? 'selected' : ''}>admin</option>
            </select>
            <button class="btn btn-sm role-btn">Save</button>
          </div>` : roleBadge(u.role)}
      </td>
      <td>${isAdmin && !isSelf ? `<button class="btn btn-sm btn-danger delete-btn">Remove</button>` : ''}</td>
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

async function load(viewerRole, viewerId) {
  const { users } = await api.get('/api/admin/users')
  const pending  = users.filter(u => !u.approved)
  const members  = users.filter(u => u.approved)

  document.getElementById('pending').innerHTML = tableWrap(
    ['Name', 'Address', 'Note', 'Email', ''],
    pending.length ? pending.map(pendingRow).join('') : null
  )

  document.getElementById('all-users').innerHTML = tableWrap(
    ['Name', 'Address', 'Role', ''],
    members.length ? members.map(u => memberRow(u, viewerRole, viewerId)).join('') : null
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
            <td style="white-space:nowrap;">
              <div style="display:flex;gap:6px;">
                <button class="btn btn-sm ad-toggle-btn">${a.active ? 'Pause' : 'Activate'}</button>
                <button class="btn btn-sm btn-danger ad-delete-btn">Remove</button>
              </div>
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
  await load(user.role, user.id)
  await loadAds()

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


}

init()
