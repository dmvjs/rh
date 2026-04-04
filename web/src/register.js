import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'
import { ADDRESSES } from './addresses.js'

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  document.getElementById('address-list').innerHTML =
    ADDRESSES.map(a => `<option value="${a.display}">`).join('')

  const form  = document.getElementById('register-form')
  const msgEl = document.getElementById('msg')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    msgEl.innerHTML = ''

    const btn = form.querySelector('button[type=submit]')
    btn.disabled = true

    try {
      const { message } = await api.post('/api/auth/register', {
        name:     form.name.value.trim(),
        email:    form.email.value.trim(),
        password: form.password.value,
        address:  form.address.value.trim(),
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
