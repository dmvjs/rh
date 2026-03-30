import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const form  = document.getElementById('login-form')
  const msgEl = document.getElementById('msg')
  const next  = new URLSearchParams(location.search).get('next') ?? '/'

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    msgEl.innerHTML = ''

    const btn = form.querySelector('button[type=submit]')
    btn.disabled = true

    try {
      const data = await api.post('/api/auth/login', {
        email:    form.email.value.trim(),
        password: form.password.value,
      })
      localStorage.setItem('token', data.token)
      window.location.href = next
    } catch (err) {
      msgEl.innerHTML = `<div class="msg msg-error">${err.message}</div>`
      btn.disabled = false
    }
  })
}

init()
