import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const form  = document.getElementById('forgot-form')
  const msgEl = document.getElementById('msg')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = form.querySelector('button[type=submit]')
    btn.disabled = true

    try {
      const { message } = await api.post('/api/auth/reset-request', {
        email: form.email.value.trim(),
      })
      msgEl.innerHTML = `<div class="msg msg-success">${message}</div>`
      form.reset()
    } catch (err) {
      msgEl.innerHTML = `<div class="msg msg-error">${err.message}</div>`
      btn.disabled = false
    }
  })
}

init()
