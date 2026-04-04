import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const token = new URLSearchParams(location.search).get('token')
  const msgEl = document.getElementById('msg')
  const form  = document.getElementById('reset-form')

  if (!token) {
    form.style.display = 'none'
    msgEl.innerHTML = `<div class="msg msg-error">Invalid reset link.</div>`
    return
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = form.querySelector('button[type=submit]')
    btn.disabled = true

    try {
      await api.post('/api/auth/reset', {
        token,
        password: form.password.value,
      })
      form.style.display = 'none'
      msgEl.innerHTML = `<div class="msg msg-success">Password updated. <a href="/login/">Sign in</a></div>`
    } catch (err) {
      msgEl.innerHTML = `<div class="msg msg-error">${err.message}</div>`
      btn.disabled = false
    }
  })
}

init()
