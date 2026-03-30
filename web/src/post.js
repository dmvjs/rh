import { renderHeader, renderFooter, requireAuth } from './header.js'
import { api, uploadImage } from './api.js'

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  await requireAuth()

  const form   = document.getElementById('post-form')
  const msgEl  = document.getElementById('msg')
  const thumbs = document.getElementById('thumbs')

  document.getElementById('images').addEventListener('change', (e) => {
    thumbs.innerHTML = ''
    for (const file of [...e.target.files].slice(0, 5)) {
      const img = document.createElement('img')
      img.src = URL.createObjectURL(file)
      img.className = 'upload-thumb'
      thumbs.appendChild(img)
    }
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    msgEl.innerHTML = ''

    const btn = form.querySelector('button[type=submit]')
    btn.disabled = true
    btn.textContent = 'Posting…'

    try {
      const files = [...document.getElementById('images').files].slice(0, 5)
      const images = await Promise.all(files.map(uploadImage))

      const priceVal = form.price.value.trim()
      const { id } = await api.post('/api/listings', {
        category:      form.category.value,
        title:         form.title.value.trim(),
        body:          form.body.value.trim(),
        price:         priceVal !== '' ? Number(priceVal) : null,
        images,
        contact_email: form.contact_email.value.trim() || null,
        contact_phone: form.contact_phone.value.trim() || null,
      })

      window.location.href = `/listing/?id=${id}`
    } catch (err) {
      msgEl.innerHTML = `<div class="msg msg-error">${err.message}</div>`
      btn.disabled = false
      btn.textContent = 'Post listing'
    }
  })
}

init()
