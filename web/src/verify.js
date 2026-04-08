import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const token = new URLSearchParams(location.search).get('token')
  const el    = document.getElementById('msg')

  if (!token) {
    el.innerHTML = `<div class="msg msg-error">No verification token found.</div>`
    return
  }

  try {
    await api.get(`/api/auth/verify?token=${encodeURIComponent(token)}`)

    el.innerHTML = `
      <h1 class="auth-title">Email confirmed</h1>
      <p style="color:var(--muted);margin-bottom:24px;line-height:1.6;">Your email is verified. Your registration will be reviewed and you'll be able to sign in once approved.</p>
      <a href="/" class="btn">Back to home</a>
    `
  } catch (err) {
    el.innerHTML = `
      <h1 class="auth-title">Link invalid</h1>
      <p style="color:var(--muted);margin-bottom:24px;line-height:1.6;">${err.message ?? 'This verification link is invalid or has expired.'}</p>
      <a href="/register/" class="btn">Register again</a>
    `
  }
}

init()
