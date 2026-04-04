import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

const CENTER = [38.8398, -77.2504]

const TYPE_LABEL = {
  park:               'Park',
  playground:         'Playground',
  recreation_ground:  'Recreation Area',
  sports_centre:      'Sports Centre',
  pitch:              'Sports Field',
  golf_course:        'Golf Course',
  garden:             'Garden',
}

function distKm(lat1, lng1, lat2, lng2) {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmtHours(h) {
  if (!h) return null
  return h
    .replace(/sunrise-sunset/gi, 'Sunrise to sunset')
    .replace(/dawn-dusk/gi,      'Dawn to dusk')
    .replace(/24\/7/g,           'Open 24/7')
}

function fmtSport(s) {
  if (!s) return null
  return s.split(';').map(x => x.trim()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
  ).join(', ')
}

function badges(p) {
  const tags = p._tags
  const out  = []
  if (tags.dog === 'yes')          out.push('Dogs welcome')
  if (tags.dog === 'leashed')      out.push('Dogs on leash')
  if (tags.fee === 'yes')          out.push('Fee required')
  if (tags.wheelchair === 'yes')   out.push('Accessible')
  if (tags.lit === 'yes')          out.push('Lit at night')
  if (tags.playground)             out.push('Playground equipment')
  return out
}

function mapsUrl(lat, lng) {
  const dest  = `${lat},${lng}`
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return isIOS
    ? `https://maps.apple.com/?daddr=${dest}`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}`
}

async function fetchParks() {
  const { parks } = await api.get('/api/parks')

  const mapped = parks.map(p => ({
    ...p,
    dist:  distKm(CENTER[0], CENTER[1], p.lat, p.lng),
    hours: fmtHours(p.hours),
    sport: fmtSport(p.sport),
    desc:  p.description,
    _tags: p,
  }))

  mapped.sort((a, b) => a.dist - b.dist)

  const seen = new Set()
  return mapped.filter(p => {
    if (seen.has(p.name)) return false
    seen.add(p.name)
    return true
  })
}

function initMap(parks) {
  const map = L.map('park-map', { zoomControl: true }).setView(CENTER, 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  parks.forEach((p, i) => {
    const icon = L.divIcon({
      className:   '',
      html:        `<div class="rst-marker">${i + 1}</div>`,
      iconSize:    [28, 28],
      iconAnchor:  [14, 14],
      popupAnchor: [0, -16],
    })

    const detailBadges = badges(p)
    const popup = `
      <div class="rst-popup">
        <div class="rst-popup-body">
          <p class="rst-popup-name">${p.website ? `<a href="${p.website}" target="_blank" rel="noopener">${p.name}</a>` : p.name}</p>
          <p class="rst-popup-meta">${TYPE_LABEL[p.type] ?? p.type}${p.sport ? ` · ${p.sport}` : ''} · ${(p.dist * 0.621371).toFixed(1)} mi</p>
          ${p.hours ? `<p class="rst-popup-hours">${p.hours}</p>` : ''}
          ${detailBadges.length ? `<p class="rst-popup-hours">${detailBadges.join(' · ')}</p>` : ''}
          <div class="rst-popup-actions">
            <a href="${mapsUrl(p.lat, p.lng)}" target="_blank" rel="noopener" class="rst-popup-btn">Directions</a>
            ${p.website ? `<a href="${p.website}" target="_blank" rel="noopener" class="rst-popup-btn rst-popup-btn-outline">Website</a>` : ''}
          </div>
        </div>
      </div>
    `

    L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(popup, { maxWidth: 280 })
  })
}

function render(parks) {
  const items = parks.map((p, i) => {
    const detailBadges = badges(p)
    const miAway = (p.dist * 0.621371).toFixed(1)
    return `
      <div class="rst-item">
        <span class="rst-num">${String(i + 1).padStart(2, '0')}</span>
        <div class="rst-body">
          <div class="rst-header">
            ${p.website
              ? `<a class="rst-name" href="${p.website}" target="_blank" rel="noopener">${p.name}</a>`
              : `<span class="rst-name">${p.name}</span>`
            }
            <span class="rst-meta">
              <span class="rst-tag">${TYPE_LABEL[p.type] ?? p.type}</span>
              ${p.sport ? `<span class="rst-area">${p.sport}</span>` : ''}
              <span class="rst-area">${miAway} mi</span>
            </span>
          </div>
          ${p.desc ? `<p class="rst-note">${p.desc}</p>` : ''}
          ${p.hours || detailBadges.length ? `
            <p class="rst-details">
              ${[p.hours, ...detailBadges].filter(Boolean).join(' · ')}
            </p>
          ` : ''}
          <div class="rst-actions">
            <a href="${mapsUrl(p.lat, p.lng)}" target="_blank" rel="noopener" class="rst-popup-btn rst-popup-btn-outline">Directions</a>
            ${p.website ? `<a href="${p.website}" target="_blank" rel="noopener" class="rst-popup-btn rst-popup-btn-outline">Website</a>` : ''}
          </div>
        </div>
      </div>
    `
  }).join('')

  return `
    <div class="rst-intro">
      <p class="rst-intro-label">Ridgelea Hills</p>
      <h1 class="rst-title">Local Parks</h1>
      <p class="rst-subtitle">${parks.length} parks and green spaces within 2.5 miles.</p>
    </div>
    <div id="park-map"></div>
    <div class="rst-list">${items}</div>
  `
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const page = document.getElementById('parks-page')
  page.innerHTML = '<p style="padding:40px 0;color:var(--muted);">Loading parks…</p>'

  let parks
  try {
    parks = await fetchParks()
  } catch {
    page.innerHTML = '<p style="padding:40px 0;color:var(--muted);">Could not load parks right now. Please try again.</p>'
    return
  }

  if (!parks.length) {
    page.innerHTML = '<p style="padding:40px 0;color:var(--muted);">No parks found nearby.</p>'
    return
  }

  page.innerHTML = render(parks)
  initMap(parks)
}

init()
