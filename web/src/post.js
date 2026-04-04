import { renderHeader, renderFooter, requireAuth } from './header.js'
import { api, imgUrl, uploadImage } from './api.js'

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  await requireAuth()

  const editId = new URLSearchParams(location.search).get('edit')
  const form   = document.getElementById('post-form')
  const msgEl  = document.getElementById('msg')
  const thumbs = document.getElementById('thumbs')

  let existingImages = []

  if (editId) {
    document.querySelector('.auth-title').textContent = 'Edit listing'
    form.querySelector('button[type=submit]').textContent = 'Save changes'

    const listing = await api.get(`/api/listings/${editId}`)
    form.category.value      = listing.category
    form.title.value         = listing.title
    form.body.value          = listing.body
    form.contact_email.value = listing.contact_email ?? ''
    form.contact_phone.value = listing.contact_phone ?? ''
    if (listing.price != null) form.price.value = (listing.price / 100).toFixed(2)

    existingImages = listing.images ?? []
    if (existingImages.length) {
      thumbs.innerHTML = existingImages
        .map(k => `<img src="${imgUrl(k)}" class="upload-thumb" alt="">`)
        .join('')
    }
  }

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
    btn.textContent = editId ? 'Saving…' : 'Posting…'

    try {
      const files = [...document.getElementById('images').files].slice(0, 5)
      const images = files.length
        ? await Promise.all(files.map(uploadImage))
        : existingImages

      const priceVal = form.price.value.trim()
      const payload  = {
        category:      form.category.value,
        title:         form.title.value.trim(),
        body:          form.body.value.trim(),
        price:         priceVal !== '' ? Number(priceVal) : null,
        images,
        contact_email: form.contact_email.value.trim() || null,
        contact_phone: form.contact_phone.value.trim() || null,
      }

      if (editId) {
        await api.patch(`/api/listings/${editId}`, payload)
        window.location.href = `/listing/?id=${editId}`
      } else {
        const { id } = await api.post('/api/listings', payload)
        window.location.href = `/listing/?id=${id}`
      }
    } catch (err) {
      msgEl.innerHTML = `<div class="msg msg-error">${err.message}</div>`
      btn.disabled = false
      btn.textContent = editId ? 'Save changes' : 'Post listing'
    }
  })
}

init()
