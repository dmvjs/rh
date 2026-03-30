import { renderHeader, renderFooter } from './header.js'

const OFFICIALS = [
  {
    level: 'Federal', title: 'U.S. Senator', name: 'Mark R. Warner', party: 'D',
    district: 'Virginia', term: 'Up for re-election Nov 2026',
    phones: [{ label: 'DC', number: '202-224-2023' }, { label: 'VA', number: '877-676-2759' }],
    website: 'https://www.warner.senate.gov', contact: 'https://www.warner.senate.gov/public/index.cfm/contact',
  },
  {
    level: 'Federal', title: 'U.S. Senator', name: 'Tim Kaine', party: 'D',
    district: 'Virginia', term: 'Term through 2030',
    phones: [{ label: 'DC', number: '202-224-4024' }, { label: 'NoVA', number: '703-361-3192' }],
    website: 'https://www.kaine.senate.gov', contact: 'https://www.kaine.senate.gov/contact',
  },
  {
    level: 'Federal', title: 'U.S. Representative', name: 'James Walkinshaw', party: 'D',
    district: "Virginia's 11th Congressional District", term: 'Up for election Nov 2026',
    phones: [],
    website: 'https://walkinshaw.house.gov', contact: 'https://walkinshaw.house.gov/contact',
  },
  {
    level: 'State', title: 'Governor', name: 'Abigail Spanberger', party: 'D',
    district: 'Virginia', term: 'Sworn in Jan 17, 2026',
    phones: [{ label: 'Office', number: '804-786-2211' }],
    website: 'https://www.governor.virginia.gov', contact: 'https://www.governor.virginia.gov/contact/',
  },
  {
    level: 'State', title: 'Lieutenant Governor', name: 'Ghazala Hashmi', party: 'D',
    district: 'Virginia', term: 'Sworn in Jan 17, 2026',
    phones: [{ label: 'Office', number: '804-593-2897' }],
    website: 'https://www.ltgov.virginia.gov', contact: 'mailto:ltgov43@ltgov.virginia.gov',
  },
  {
    level: 'State', title: 'Attorney General', name: 'Jay Jones', party: 'D',
    district: 'Virginia', term: 'Sworn in Jan 17, 2026',
    phones: [{ label: 'Office', number: '804-786-2071' }, { label: 'Consumer Protection', number: '804-786-2042' }],
    website: 'https://www.oag.state.va.us', contact: 'mailto:mailoag@oag.state.va.us',
  },
  {
    level: 'State', title: 'State Senator', name: 'David Marsden', party: 'D',
    district: 'Senate District 35', term: 'Term through Jan 2028',
    phones: [{ label: 'District', number: '571-249-3037' }, { label: 'Richmond', number: '804-698-7535' }],
    website: 'https://apps.senate.virginia.gov/Senator/memberpage.php?id=S80',
    contact: 'mailto:senatormarsden@senate.virginia.gov',
  },
  {
    level: 'State', title: 'State Delegate', name: 'Vivian E. Watts', party: 'D',
    district: 'House District 14', term: 'Term through Jan 2028',
    phones: [{ label: 'District', number: '703-978-2989' }, { label: 'Richmond', number: '804-698-1014' }],
    website: 'https://vivianwatts.com', contact: 'https://vivianwatts.com/contact/',
  },
  {
    level: 'County', title: 'Board of Supervisors', name: 'Andres F. Jimenez', party: 'D',
    district: 'Mason District', term: 'Term through Dec 2027',
    phones: [{ label: 'Office', number: '703-256-7717' }],
    website: 'https://www.fairfaxcounty.gov/mason/home', contact: 'mailto:Mason@fairfaxcounty.gov',
  },
  {
    level: 'County', title: 'School Board', name: 'Ricardy J. Anderson', party: 'D',
    district: 'Mason District — FCPS', term: 'Term through Dec 2027',
    phones: [{ label: 'Office', number: '571-423-1083' }],
    website: 'https://www.fcps.edu/staff/ricardy-anderson',
    contact: 'https://www.fcps.edu/submit-question-ricardy-anderson',
  },
]

const ELECTIONS = [
  { date: 'Apr 21, 2026', label: 'Special election — VA redistricting referendum' },
  { date: 'Jun 19, 2026', label: 'Early voting opens for August primary' },
  { date: 'Aug 4, 2026',  label: 'Primary — U.S. Senate (Warner) · U.S. House VA-11' },
  { date: 'Oct 23, 2026', label: 'Voter registration deadline for November general' },
  { date: 'Nov 3, 2026',  label: 'General election — U.S. Senate · U.S. House' },
  { date: 'Nov 2027',     label: 'Virginia House of Delegates elections (odd year)' },
]

const RESOURCES = [
  { label: 'Find your polling place',       url: 'https://www.fairfaxcounty.gov/elections/' },
  { label: 'My Neighborhood (Fairfax Co.)', url: 'https://www.fairfaxcounty.gov/myneighborhood' },
  { label: 'Virginia voter registration',   url: 'https://www.elections.virginia.gov/registration/' },
  { label: "Who's My Legislator (VA)",      url: 'https://whosmy.virginiageneralassembly.gov/' },
  { label: 'Virginia Dept. of Elections',   url: 'https://www.elections.virginia.gov/' },
]

const PARTY_LABEL = { D: 'Dem.', R: 'Rep.', I: 'Ind.' }

function officialCard(o) {
  const phonesHtml = (o.phones ?? []).map(p =>
    `<a href="tel:${p.number.replace(/\D/g,'')}" class="pol-phone">${p.label}: ${p.number}</a>`
  ).join('')

  return `
    <div class="pol-card">
      <div class="pol-card-top">
        <div>
          <p class="pol-card-title">${o.title}</p>
          <p class="pol-card-name">${o.name}</p>
          <p class="pol-card-meta">
            <span class="pol-party pol-party-${o.party}">${PARTY_LABEL[o.party]}</span>
            <span class="pol-district">${o.district}</span>
          </p>
        </div>
        <div class="pol-card-actions">
          ${o.contact ? `<a href="${o.contact}" class="pol-btn" ${o.contact.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>Contact</a>` : ''}
          ${o.website ? `<a href="${o.website}" class="pol-btn pol-btn-outline" target="_blank" rel="noopener">Website</a>` : ''}
        </div>
      </div>
      ${o.term || phonesHtml ? `
        <div class="pol-card-bottom">
          ${o.term ? `<span class="pol-term">${o.term}</span>` : ''}
          ${phonesHtml}
        </div>
      ` : ''}
    </div>
  `
}

function section(title, content) {
  return `
    <div class="pol-section">
      <p class="pol-section-title">${title}</p>
      ${content}
    </div>
  `
}

function render() {
  const levels = ['Federal', 'State', 'County']

  const officialsHtml = levels.map(level => {
    const cards = OFFICIALS.filter(o => o.level === level).map(officialCard).join('')
    return section(level, `<div class="pol-cards">${cards}</div>`)
  }).join('')

  const electionsHtml = section('Upcoming Elections', `
    <div class="pol-elections">
      ${ELECTIONS.map(e => `
        <div class="pol-election-row">
          <span class="pol-election-date">${e.date}</span>
          <span class="pol-election-label">${e.label}</span>
        </div>
      `).join('')}
    </div>
  `)

  const resourcesHtml = section('Voter Resources', `
    <div class="pol-resources">
      ${RESOURCES.map(r => `
        <a href="${r.url}" class="pol-resource" target="_blank" rel="noopener">${r.label} →</a>
      `).join('')}
    </div>
  `)

  return `
    <div class="pol-intro">
      <p class="pol-intro-label">Mason District · Fairfax County · Virginia</p>
      <h1 class="pol-title">Local Government</h1>
      <p class="pol-subtitle">Your elected officials, contact info, and upcoming elections.</p>
    </div>
    ${officialsHtml}
    ${electionsHtml}
    ${resourcesHtml}
  `
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])
  document.getElementById('government-page').innerHTML = render()
}

init()
