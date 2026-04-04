import { renderHeader, renderFooter } from './header.js'
import { api } from './api.js'

function fmtDate(str) {
  if (!str) return ''
  return new Date(str + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function renderCard(obs) {
  return `
    <a href="${obs.url}" target="_blank" rel="noopener" class="wl-card">
      <img class="wl-card-photo"
           src="${obs.photo_url}"
           alt="${obs.common_name ?? obs.sci_name}"
           loading="lazy">
      <div class="wl-card-body">
        <p class="wl-card-name">${obs.common_name ?? obs.sci_name}</p>
        ${obs.common_name && obs.sci_name
          ? `<p class="wl-card-sci">${obs.sci_name}</p>`
          : ''}
        ${obs.observed_on
          ? `<p class="wl-card-date">${fmtDate(obs.observed_on)}</p>`
          : ''}
      </div>
    </a>
  `
}

function renderSection(group) {
  const label   = group.items.length === 1 ? 'species' : 'species'
  return `
    <section class="wl-section">
      <div class="wl-section-header">
        <span class="wl-section-label">${group.label}</span>
        <span class="wl-section-count">${group.items.length} ${label} documented</span>
      </div>
      <div class="wl-grid">
        ${group.items.map(renderCard).join('')}
      </div>
    </section>
  `
}

function render(data) {
  const updated = new Date(data.updated_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  return `
    <div class="wl-intro">
      <p class="wl-intro-label">Ridgelea Hills</p>
      <h1 class="wl-intro-title">Wildlife & Nature</h1>
      <p class="wl-intro-sub">A living field guide to the plants, birds, and creatures that share our neighborhood. Drawn from verified community sightings within five miles.</p>
      <p class="wl-intro-meta">${data.total} species documented · Updated ${updated}</p>
    </div>
    ${data.groups.map(renderSection).join('')}
    <p class="wl-credit">
      Sightings sourced from <a href="https://www.inaturalist.org" target="_blank" rel="noopener">iNaturalist</a>,
      a joint initiative of the California Academy of Sciences and National Geographic Society.
      Photos © respective contributors under Creative Commons.
    </p>
  `
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const page = document.getElementById('wildlife-page')
  page.innerHTML = `<p style="padding:48px 0;color:var(--muted);">Loading sightings…</p>`

  let data
  try {
    data = await api.get('/api/wildlife')
  } catch {
    page.innerHTML = `<p style="padding:48px 0;color:var(--muted);">Could not load wildlife data. Please try again.</p>`
    return
  }

  page.innerHTML = render(data)
}

init()
