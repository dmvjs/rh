import { renderHeader, renderFooter } from './header.js'

const PICKS = [
  {
    name: 'Bonchon',
    cuisine: 'Korean Fried Chicken',
    area: 'West Fairfax',
    price: '$$',
    address: '11060-A Lee Hwy West, West Fairfax, VA 22030',
    hours: 'Mon–Tue 11am–10pm · Wed–Sat 11am–11pm · Sun 11am–10pm',
    phone: '(703) 293-4769',
    note: 'Korean fried chicken with soy garlic and spicy sauce options. Strips here are batter-style.',
    url: 'https://restaurants.bonchon.com/locations/va/west-fairfax/11060-a-lee-highway-west',
    lat: 38.8528218, lng: -77.3273049,
    photo: '',
  },
  {
    name: 'Bonchon',
    cuisine: 'Korean Fried Chicken',
    area: 'Annandale',
    price: '$$',
    address: '7133-B Columbia Pike, Annandale, VA',
    hours: 'Mon–Thu 11am–11pm · Fri–Sat 11am–12am · Sun 12pm–11pm',
    phone: '(703) 940-3023',
    note: 'Newly reopened after the previous location on Columbia Pike closed in 2023. Strips here are tender-style rather than batter.',
    url: 'https://restaurants.bonchon.com/locations/va/annandale/7133-b-columbia-pike',
    lat: 38.8320, lng: -77.1919,
    photo: '',
  },
  {
    name: 'Blue Ocean Sushi',
    cuisine: 'Sushi',
    area: 'Fairfax',
    price: '$$',
    address: '9440 Main St, Fairfax, VA 22031',
    hours: 'Closed Mon · Tue–Sun 11:30am–2:30pm, 5–9pm',
    phone: '(703) 425-7555',
    note: 'Japanese-owned and operated sushi restaurant. The nigiri sampler includes premium selections such as amaebi, ikura, and fatty tuna. Fish quality is consistently high. Rolls and katsudon are also available. Reservations recommended on weekends.',
    url: 'https://www.blueoceanizakaya.com',
    lat: 38.8423, lng: -77.2702,
    photo: '',
  },
  {
    name: 'Taco Bell / KFC',
    cuisine: 'Fast Food',
    area: 'Annandale',
    price: '$',
    address: '7450 Little River Tpke, Annandale, VA 22003',
    hours: 'Daily 10:30am–1am',
    phone: '(703) 256-2086',
    note: 'Combined Taco Bell and KFC location. Not listed in the Taco Bell app and does not support all app-based ordering. Fresh shells are reported to arrive on Tuesdays.',
    url: 'https://locations.tacobell.com/va/annandale/7450-little-river-turnpike.html',
    lat: 38.8320, lng: -77.2031,
    photo: '',
  },
  {
    name: 'Honey Pig Korean BBQ',
    cuisine: 'Korean BBQ',
    area: 'Annandale',
    price: '$$$',
    address: '7220-C Columbia Pike, Annandale, VA',
    hours: 'Mon–Thu 11:30am–11pm · Fri–Sat 11:30am–12am · Sun 11:30am–11pm',
    phone: '(703) 256-5229',
    note: 'Korean BBQ restaurant with tabletop grills. All-you-can-eat service is offered periodically. Spicy pork belly is a frequently ordered item.',
    url: 'https://www.honeypigbbq.com',
    lat: 38.8316, lng: -77.1942,
    photo: '',
  },
  {
    name: 'K-Wings Korean Style Chicken',
    cuisine: 'Korean Fried Chicken',
    area: 'Fairfax',
    price: '$$',
    address: '9528 Lee Hwy, Fairfax, VA 22031',
    hours: 'Mon–Thu 11am–10:30pm · Fri–Sat 11am–12am · Sun 11am–10:30pm',
    phone: '(703) 772-0072',
    note: 'Formerly operating as CM Choong Man Chicken at this address. Korean fried chicken with a variety of sauce options. Garlic Soy and Garlic Spicy are recommended. Snow Onion topping is available and worth requesting. Note that spice levels tend to run warm across the menu.',
    url: 'https://lovekwings.com',
    lat: 38.8659, lng: -77.2747,
    photo: '',
  },
  {
    name: 'Pho Duong',
    cuisine: 'Vietnamese',
    area: 'Fairfax',
    price: '$',
    address: '9412 Main St, Fairfax, VA 22031',
    hours: 'Daily 10am–9pm',
    phone: '(703) 426-2827',
    note: 'Vietnamese restaurant offering pho, vermicelli dishes, and bánh mì sandwiches. Broth quality is notably good. Three locations in the area; this is the Fairfax location.',
    url: 'https://phoduongrestaurant.com',
    lat: 38.8409, lng: -77.2708,
    photo: '',
  },
  {
    name: "Freddy's Frozen Custard & Steakburgers",
    cuisine: 'Burgers',
    area: 'Fairfax',
    price: '$',
    address: '10030 Fairfax Blvd, Fairfax, VA 22030',
    hours: 'Mon–Thu 10:30am–10pm · Fri–Sat 10:30am–11pm · Sun 10:30am–10pm',
    phone: '(703) 293-2900',
    note: 'Smash-style burgers with shoestring fries and frozen custard. Cheese sauce is available on the side upon request. Turtle sundae is recommended. Specify burger toppings when ordering.',
    url: 'https://www.freddys.com/location/fairfax-va',
    lat: 38.8633, lng: -77.2913,
    photo: '',
  },
  {
    name: "Dave's Hot Chicken",
    cuisine: 'Hot Chicken',
    area: 'Fairfax',
    price: '$',
    address: '9670 Main St, Fairfax, VA 22031',
    hours: 'Sun–Thu 10:30am–10pm · Fri–Sat 10:30am–11pm',
    phone: '(571) 295-4500',
    note: 'Nashville-style hot chicken tenders and sliders served at multiple heat levels. The Hot level is recommended for those with a tolerance for spice; Medium also carries noticeable heat. The Reaper level is not recommended for most diners.',
    url: 'https://restaurants.daveshotchicken.com/va/fairfax/best-spicy-hot-chicken-in-fairfax-va-main-st-fair-city-mall/',
    lat: 38.8419, lng: -77.2759,
    photo: '',
  },
  {
    name: 'Potbelly',
    cuisine: 'Sandwiches',
    area: 'Fairfax',
    price: '$',
    address: '9668 Main St, Fairfax, VA 22031',
    hours: 'Daily 10am–9pm',
    phone: '(703) 896-4125',
    note: "Sandwich shop located adjacent to Dave's Hot Chicken. The Wreck and the BLTA are recommended menu items. Jalapeño chips and fountain beverages are available.",
    url: 'https://www.potbelly.com/locations/virginia/fair-city-mall',
    lat: 38.8419, lng: -77.2759,
    photo: '',
  },
  {
    name: 'Lost Dog Cafe',
    cuisine: 'Pizza & Craft Beer',
    area: 'Dunn Loring',
    price: '$$',
    address: '2729-A Merrilee Dr, Fairfax, VA 22031',
    hours: 'Sun–Thu 11am–10pm · Fri–Sat 11am–11pm',
    phone: '(703) 205-9001',
    note: 'Excellent pizza and one of the best craft beer selections in the area. Pete\'s Pie is a crowd pleaser. The Pitbull is recommended for those who prefer spice.',
    url: 'https://www.lostdogcafe.com',
    lat: 38.8788, lng: -77.2303,
    photo: '',
  },
  {
    name: 'Old Peking Restaurant',
    cuisine: 'Chinese',
    area: 'Oakton',
    price: '$$',
    address: '2952 Chain Bridge Rd, Ste C, Oakton, VA 22124',
    hours: 'Mon–Sat 11:30am–9pm · Sun 12pm–9pm',
    phone: '(703) 255-9444',
    note: 'Worth the drive for good Chinese food.',
    url: 'https://www.oldpekingoakton.com',
    lat: 38.8812, lng: -77.3029,
    photo: '',
  },
  {
    name: 'Chick-fil-A',
    cuisine: 'Fast Food',
    area: 'Fairfax',
    price: '$',
    address: '9509 Fairfax Blvd, Fairfax, VA 22031',
    hours: 'Mon–Sat 6am–10pm · Closed Sun',
    phone: '(703) 934-2150',
    note: 'Consistent quality. Closed on Sundays.',
    url: 'https://www.chick-fil-a.com/locations/va/fairfax-circle',
    lat: 38.8644, lng: -77.2733,
    photo: '',
  },
  {
    name: 'Five Guys',
    cuisine: 'Burgers',
    area: 'Merrifield',
    price: '$$',
    address: '8130 Arlington Blvd, Falls Church, VA 22042',
    hours: 'Mon–Thu 10am–10pm · Fri–Sun 10am–11pm',
    phone: '(703) 635-2829',
    note: 'Located in Yorktown Shopping Center at Gallows and Arlington Blvd.',
    url: 'https://restaurants.fiveguys.com/8130-arlington-blvd',
    lat: 38.8668, lng: -77.2270,
    photo: '',
  },
]

function fmtHours(hours) {
  return hours.split(' · ').join('<br>')
}

function mapsUrl(r) {
  const dest = `${r.lat},${r.lng}`
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return isIOS
    ? `https://maps.apple.com/?daddr=${dest}`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}`
}

function actionButtons(r, { outline = false } = {}) {
  const secondary = outline ? ' rst-popup-btn-outline' : ''
  return `
    ${r.phone ? `<a href="tel:${r.phone.replace(/\D/g,'')}" class="rst-popup-btn">Call</a>` : ''}
    <a href="${mapsUrl(r)}" target="_blank" rel="noopener" class="rst-popup-btn${secondary}">Directions</a>
    ${r.url ? `<a href="${r.url}" target="_blank" rel="noopener" class="rst-popup-btn${secondary}">Website</a>` : ''}
  `
}

function initMap() {
  const map = L.map('rst-map', { zoomControl: true }).setView([38.855, -77.235], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  PICKS.forEach((r, i) => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="rst-marker">${i + 1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16],
    })

    const popup = `
      <div class="rst-popup">
        ${r.photo ? `<img src="${r.photo}" class="rst-popup-img" alt="${r.name}">` : ''}
        <div class="rst-popup-body">
          <p class="rst-popup-name">${r.url ? `<a href="${r.url}" target="_blank" rel="noopener">${r.name}</a>` : r.name}</p>
          <p class="rst-popup-meta">${r.cuisine} · ${r.area} · ${r.price}</p>
          <p class="rst-popup-addr">${r.address}</p>
          ${r.hours ? `<p class="rst-popup-hours">${fmtHours(r.hours)}</p>` : ''}
          <div class="rst-popup-actions">${actionButtons(r)}</div>
        </div>
      </div>
    `

    L.marker([r.lat, r.lng], { icon }).addTo(map).bindPopup(popup, { maxWidth: 280 })
  })
}

function render() {
  const items = PICKS.map((r, i) => `
    <div class="rst-item">
      <span class="rst-num">${String(i + 1).padStart(2, '0')}</span>
      <div class="rst-body">
        <div class="rst-header">
          ${r.url
            ? `<a class="rst-name" href="${r.url}" target="_blank" rel="noopener">${r.name}</a>`
            : `<span class="rst-name">${r.name}</span>`
          }
          <span class="rst-meta">
            ${r.cuisine ? `<span class="rst-tag">${r.cuisine}</span>` : ''}
            ${r.area ? `<span class="rst-area">${r.area}</span>` : ''}
            ${r.price ? `<span class="rst-price">${r.price}</span>` : ''}
          </span>
        </div>
        ${r.note ? `<p class="rst-note">${r.note}</p>` : ''}
        ${r.address || r.hours ? `
          <p class="rst-details">
            ${r.address ? `<span class="rst-address">${r.address}</span>` : ''}
            ${r.address && r.hours ? ' · ' : ''}
            ${r.hours ? `<span class="rst-hours">${r.hours}</span>` : ''}
          </p>
        ` : ''}
        <div class="rst-actions">${actionButtons(r, { outline: true })}</div>
      </div>
    </div>
  `).join('')

  return `
    <div class="rst-intro">
      <p class="rst-intro-label">A neighborhood guide</p>
      <h1 class="rst-title">Our Favorite Restaurants</h1>
      <p class="rst-subtitle">${PICKS.length} places worth the drive.</p>
    </div>
    <div id="rst-map"></div>
    <div class="rst-list">${items}</div>
  `
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  document.getElementById('restaurants-page').innerHTML = render()
  initMap()
}

init()
