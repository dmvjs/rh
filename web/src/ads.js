// Ad slots — only rendered for non-members (no valid token)
import { api } from './api.js'

let _ads = null

async function fetchAds() {
  if (_ads) return _ads
  try {
    _ads = await api.get('/api/ads')
  } catch { _ads = {} }
  return _ads
}

function pick(arr) {
  return arr?.[Math.floor(Math.random() * arr.length)] ?? null
}

function isLoggedIn() {
  return !!localStorage.getItem('token')
}

// Render an ad into el for the given size ('728x90', '300x250', '160x600')
// No-ops if user is logged in or no ad available for that size
export async function renderAd(el, size) {
  if (!el || isLoggedIn()) return
  const ads = await fetchAds()
  const ad = pick(ads[size])
  if (!ad) return
  const [w, h] = size.split('x').map(Number)
  el.style.display = 'block'
  el.innerHTML = `
    <a href="${ad.click_url}" target="_blank" rel="noopener sponsored"
       style="display:block;line-height:0;">
      <img src="${ad.image_url}" width="${w}" height="${h}" alt=""
           style="max-width:100%;height:auto;display:block;border:0;">
    </a>
  `
}
