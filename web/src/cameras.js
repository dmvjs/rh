import { renderHeader, renderFooter } from './header.js'

const SECTIONS = [
  {
    title: 'Little River Turnpike (VA-236)',
    cams: [
      { name: 'NROCCTVVA236E00041', label: 'VA-236 at I-495',          dir: 'NB' },
      { name: 'NO0473',             label: 'VA-236 near Backlick Rd',   dir: 'EB' },
      { name: 'FairfaxVideo3835',   label: 'VA-236 near Gallows Rd',    dir: 'EB' },
      { name: 'NO0357',             label: 'VA-236 near Seven Corners',  dir: 'WB' },
    ],
  },
  {
    title: 'Capital Beltway (I-495)',
    cams: [
      { name: 'FairfaxVideo1040',   label: 'I-495 at Exit 50 (VA-236)', dir: 'SB' },
      { name: 'FairfaxVideo1069',   label: 'I-495 at Exit 50 (VA-236)', dir: 'SB' },
      { name: 'FairfaxVideo1071',   label: 'I-495 near Exit 52',        dir: 'NB' },
      { name: 'FairfaxVideo1043',   label: 'I-495 near Braddock Rd',    dir: 'NB' },
      { name: 'FairfaxVideo1041',   label: 'I-495 near Braddock Rd',    dir: 'SB' },
      { name: 'FairfaxVideo1032',   label: 'I-495 near Rolling Rd',     dir: 'SB' },
    ],
  },
]

const SNAP = name => `https://snapshot.vdotcameras.com/${name}.png`
const REFRESH_MS = 60_000

function camCard(cam) {
  return `
    <div class="cam-card" data-name="${cam.name}">
      <div class="cam-img-wrap">
        <img class="cam-img" src="${SNAP(cam.name)}?t=${Date.now()}" alt="${cam.label}" loading="lazy">
        <span class="cam-dir">${cam.dir}</span>
      </div>
      <p class="cam-label">${cam.label}</p>
    </div>
  `
}

function render() {
  const sectionsHtml = SECTIONS.map(s => `
    <div class="cam-section">
      <p class="cam-section-title">${s.title}</p>
      <div class="cam-grid">
        ${s.cams.map(camCard).join('')}
      </div>
    </div>
  `).join('')

  return `
    <div class="pol-intro">
      <p class="pol-intro-label">Annandale · Fairfax County</p>
      <h1 class="pol-title">Traffic Cameras</h1>
      <p class="pol-subtitle">VDOT live cameras on nearby roads. Images refresh every minute.</p>
    </div>
    ${sectionsHtml}
  `
}

function refreshImages() {
  document.querySelectorAll('.cam-img').forEach(img => {
    const name = img.closest('.cam-card').dataset.name
    const next = new Image()
    next.onload = () => { img.src = next.src }
    next.src = `${SNAP(name)}?t=${Date.now()}`
  })
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  document.getElementById('cameras-page').innerHTML = render()

  setInterval(refreshImages, REFRESH_MS)
}

init()
