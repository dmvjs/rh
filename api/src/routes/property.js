import { Hono } from 'hono'

const router = new Hono()

const SALES_URL    = 'https://www.fairfaxcounty.gov/mercator/rest/services/GIS/ParcelPlusSales/MapServer/0/query'
const PERMITS_URL  = 'https://www.fairfaxcounty.gov/mercator/rest/services/LDS/DevelopmentTracker/FeatureServer/4/query'
const ADDRESS_URL  = 'https://www.fairfaxcounty.gov/mercator/rest/services/GIS/AddressesRoadwaysQuery/MapServer/0/query'
const ASSESS_URL   = 'https://services1.arcgis.com/ioennV6PpG5Xodq0/ArcGIS/rest/services/OpenData_A6/FeatureServer/2/query'
const ZONING_URL   = 'https://www.fairfaxcounty.gov/gisint1/rest/services/PLUS/ZoningMap/MapServer/8/query'

// Ridgelea Hills / Mantua subdivision streets — exact STREET_NAME values from address layer
const STREET_NAMES = [
  'ACOSTA', 'ALBA PL', 'ALBION', 'AMBERLEY', 'AUTUMN LEAF', 'BARBARA LN', 'BARKLEY',
  'BENTWOOD', 'BLAIRMORE', 'BOSWORTH', 'BRIARBUSH', 'BRIARY', 'BROOKINGS', 'CEDAR LN',
  'CHANTAL', 'CHAPEL HILL', 'CHICHESTER', 'CHRISTOPHER ST', 'COLCHESTER BROOK', 'COLESBURY',
  'CONVENTO', 'COPELAND POND', 'CORDOVA PL', 'CORONADO', 'COURTLEY', 'CRANLEIGH', 'CRESTVIEW',
  'DELBURNE', 'DENISE LN', 'DORADO', 'DUVALL', 'EAKIN PARK', 'EDENVALE', 'GLADE HILL',
  'GLENBROOK', 'GOODVIEW', 'GROSVENOR', 'GUINEA', 'GUYSBOROUGH', 'HAMILTON DR', 'HILLSIDE PL',
  'HORNER', 'KAREN DR', 'KILMARNOCK', 'KIRKWOOD', 'KITTERY', 'LANDON CT', 'LARO',
  'LATROBE', 'LAUREL LEAF', 'LEGHORN', 'LEMINGTON', 'LIDO PL', 'LOTHBURY',
  'LYNN REGIS', 'LYNNHURST', 'MANTUA', 'MATHY', 'MAYWOOD', 'MIDLAND RD', 'MILL SPRINGS',
  'MILLBANK', 'MORNINGSIDE', 'MOSS BROOKE', 'NUTLEY', 'OKLA', 'OLLEY', 'OVERBROOK',
  'PARKSIDE', 'PEMBRIDGE', 'PENTLAND', 'PERSIMMON', 'PETROS', 'PIXIE', 'PONCE PL',
  'PRADO PL', 'PRINCE WILLIAM DR', 'READSBOROUGH', 'RIDGELEA', 'ROCKY MOUNT', 'SANDALWOOD',
  'SANDY RIDGE', 'SANTAYANA', 'SKYVIEW', 'SOUTHLEA', 'SOUTHWICK', 'STONEHURST', 'STONELEIGH',
  'SWINBURNE', 'TAYLOR DR', 'TOVITO', 'WHITE CLOVER', 'WYNFORD',
]

// Block-restricted streets — only match within address number ranges
const BLOCK_RULES = [
  { re: /PINELAND/i,     min: 3800, max: 3921 },
  { re: /LEROY/i,        min: 8700, max: 8799 },
  { re: /LITTLE RIVER/i, min: 3921, max: 3921 },
  { re: /LITTLE RIVER/i, min: 8600, max: 9400 },
  { re: /PROSPERITY/i,   min: 3000, max: 3900 },
  { re: /ARLINGTON BLVD|ARLINGTON BOULEVARD/i, min: 8500, max: 9400 },
  { re: /PICKETT/i,      min: 3000, max: 3900 },
]

function passesBlockRule(addr) {
  const m = /^(\d+)\s+/.exec(addr.trim())
  if (!m) return false
  const num = parseInt(m[1])
  return BLOCK_RULES.some(r => r.re.test(addr) && num >= r.min && num <= r.max)
}

const STREET_IN   = STREET_NAMES.map(s => `'${s}'`).join(',')
const STREET_WHERE = `STREET_NAME IN (${STREET_IN})`

// Block-rule streets — fetched with IN, validated by address number client-side
const BLOCK_NAMES  = ['PINELAND', 'LEROY', 'LITTLE RIVER TPKE', 'PROSPERITY AVE', 'ARLINGTON BLVD', 'PICKETT RD']
const BLOCK_IN     = BLOCK_NAMES.map(s => `'${s}'`).join(',')
const BLOCK_WHERE  = `STREET_NAME IN (${BLOCK_IN})`

// Permit types to skip
const BORING = new Set([
  'Residential Electrical', 'Residential Plumbing', 'Residential Mechanical',
  'Commercial Electrical', 'Commercial Plumbing', 'Commercial Mechanical',
  'Elevator Maintenance Permit', 'Elevator Equipment',
])

// Step 1: get all neighborhood PINs from address layer by street name
async function fetchNeighborhoodPins() {
  const where = `SUPERVISOR_DISTRICT = 'MASON' AND ((${STREET_WHERE}) OR (${BLOCK_WHERE}))`
  const params = new URLSearchParams({
    where,
    outFields:      'PARCEL_PIN,ADDRESS_1',
    returnGeometry: 'false',
    resultRecordCount: '2000',
    f:              'json',
  })
  const res = await fetch(`${ADDRESS_URL}?${params}`)
  if (!res.ok) return { pins: [], blockAddrs: {} }
  const data = await res.json()

  const pins = []
  const blockAddrs = {} // PIN -> ADDRESS_1 for block-rule streets

  for (const f of (data.features ?? [])) {
    const a = f.attributes
    const pin  = a.PARCEL_PIN?.trim()
    const addr = a.ADDRESS_1?.trim()
    if (!pin) continue

    // For block-rule streets, validate number range
    if (/PINELAND|LEROY|LITTLE RIVER|PROSPERITY|ARLINGTON BLVD|PICKETT/i.test(addr ?? '')) {
      if (passesBlockRule(addr)) {
        pins.push(pin)
        blockAddrs[pin] = addr
      }
    } else {
      pins.push(pin)
    }
  }
  return { pins: [...new Set(pins)], blockAddrs }
}

// Step 2: query sales for specific PINs in chunks
async function fetchSalesByPins(pins) {
  if (!pins.length) return []
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const CHUNK  = 50
  const all    = []

  for (let i = 0; i < pins.length; i += CHUNK) {
    const chunk = pins.slice(i, i + CHUNK)
    const list  = chunk.map(p => `'${p.replace(/'/g, "''")}'`).join(',')
    const params = new URLSearchParams({
      where:             `PIN IN (${list}) AND PRICE > 50000 AND SALEDT >= DATE '${cutoff}'`,
      outFields:         'PIN,PRICE,SALEDT,SALEVAL_DESC,CPAN_URL',
      orderByFields:     'SALEDT DESC',
      resultRecordCount: '500',
      returnGeometry:    'false',
      f:                 'json',
    })
    const res = await fetch(`${SALES_URL}?${params}`)
    if (!res.ok) continue
    const data = await res.json()
    for (const f of (data.features ?? [])) {
      const a = f.attributes
      all.push({
        pin:      a.PIN?.trim() ?? null,
        price:    a.PRICE,
        date:     a.SALEDT ? new Date(a.SALEDT).toISOString().slice(0, 10) : null,
        validity: a.SALEVAL_DESC ?? null,
        deedUrl:  a.CPAN_URL ?? null,
        address:  null,
      })
    }
  }
  return all
}

// Step 3: fetch permits by PARCEL_ID matching neighborhood PINs
async function fetchPermits(pins) {
  if (!pins.length) return []
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const CHUNK  = 50
  const all    = []

  for (let i = 0; i < pins.length; i += CHUNK) {
    const chunk = pins.slice(i, i + CHUNK)
    const list  = chunk.map(p => `'${p.replace(/'/g, "''")}'`).join(',')
    const params = new URLSearchParams({
      where:             `PARCEL_ID IN (${list}) AND ISSUED_DATE >= DATE '${cutoff}'`,
      outFields:         'RECORDID,APPTYPEALIAS,ADDRESS_1,CITY,SUPERVISOR_DISTRICT,RECORD_STATUS,ISSUED_DATE,ESTIMATED_COST,LINK_URL',
      orderByFields:     'ISSUED_DATE DESC',
      resultRecordCount: '200',
      returnGeometry:    'false',
      f:                 'json',
    })
    const res = await fetch(`${PERMITS_URL}?${params}`)
    if (!res.ok) continue
    const data = await res.json()
    for (const f of (data.features ?? [])) {
      const a = f.attributes
      if (BORING.has(a.APPTYPEALIAS)) continue
      all.push({
        id:         a.RECORDID,
        type:       a.APPTYPEALIAS,
        address:    [a.ADDRESS_1, a.CITY].filter(Boolean).join(', '),
        district:   a.SUPERVISOR_DISTRICT,
        status:     a.RECORD_STATUS,
        issuedDate: a.ISSUED_DATE ? new Date(a.ISSUED_DATE).toISOString().slice(0, 10) : null,
        cost:       a.ESTIMATED_COST || null,
        url:        a.LINK_URL ?? null,
      })
    }
  }
  return all.sort((a, b) => (b.issuedDate ?? '').localeCompare(a.issuedDate ?? ''))
}


async function fetchAssessments(pins) {
  if (!pins.length) return []
  const CHUNK = 50
  const all   = []
  for (let i = 0; i < pins.length; i += CHUNK) {
    const chunk = pins.slice(i, i + CHUNK)
    const list  = chunk.map(p => `'${p.replace(/'/g, "''")}'`).join(',')
    const params = new URLSearchParams({
      where:             `PARID IN (${list})`,
      outFields:         'PARID,APRTOT,PRITOT,FLAG4_DESC',
      resultRecordCount: '500',
      returnGeometry:    'false',
      f:                 'json',
    })
    const res = await fetch(`${ASSESS_URL}?${params}`).catch(() => null)
    if (!res?.ok) continue
    const data = await res.json()
    for (const f of (data.features ?? [])) {
      const a = f.attributes
      if (!a.APRTOT) continue
      all.push({
        pin:       a.PARID?.trim(),
        assessed:  a.APRTOT,
        prior:     a.PRITOT,
        exemption: a.FLAG4_DESC && a.FLAG4_DESC !== 'No Exemption' ? a.FLAG4_DESC : null,
      })
    }
  }
  return all
}

async function fetchZoningCases(pins) {
  if (!pins.length) return []
  const CHUNK = 50
  const all   = []
  const cutoff = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  for (let i = 0; i < pins.length; i += CHUNK) {
    const chunk = pins.slice(i, i + CHUNK)
    // ZoningMap layer 8 uses parcel geometry — query by PARCEL_NUM which maps to PIN
    const list  = chunk.map(p => `'${p.replace(/'/g, "''")}'`).join(',')
    const params = new URLSearchParams({
      where:             `PARCEL_NUM IN (${list}) AND SUBMITTED_DATE >= DATE '${cutoff}'`,
      outFields:         'RECORDID,APPTYPEALIAS,APPLICANT,RECORD_STATUS,WORK_DESCRIPTION,SUBMITTED_DATE,LINK_URL,PARCEL_NUM',
      orderByFields:     'SUBMITTED_DATE DESC',
      resultRecordCount: '200',
      returnGeometry:    'false',
      f:                 'json',
    })
    const res = await fetch(`${ZONING_URL}?${params}`).catch(() => null)
    if (!res?.ok) continue
    const data = await res.json()
    for (const f of (data.features ?? [])) {
      const a = f.attributes
      all.push({
        id:          a.RECORDID,
        type:        a.APPTYPEALIAS,
        applicant:   a.APPLICANT ?? null,
        status:      a.RECORD_STATUS,
        description: a.WORK_DESCRIPTION ?? null,
        date:        a.SUBMITTED_DATE ? new Date(a.SUBMITTED_DATE).toISOString().slice(0, 10) : null,
        url:         a.LINK_URL ?? null,
        pin:         a.PARCEL_NUM?.trim() ?? null,
      })
    }
  }
  return all.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}

router.get('/', async (c) => {
  const kv = c.env.CACHE
  const CACHE_KEY = 'property:v13'
  const TTL = 60 * 60

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const { pins } = await fetchNeighborhoodPins().catch(() => ({ pins: [] }))

  const [sales, permits, assessments, zoningCases] = await Promise.all([
    fetchSalesByPins(pins).catch(() => []),
    fetchPermits(pins).catch(() => []),
    fetchAssessments(pins).catch(() => []),
    fetchZoningCases(pins).catch(() => []),
  ])

  // Enrich sales with addresses from the address layer (already have them from PIN lookup)
  // Re-fetch addresses for matched PINs
  const pinAddrs = {}
  if (pins.length) {
    const CHUNK = 50
    for (let i = 0; i < pins.length; i += CHUNK) {
      const chunk = pins.slice(i, i + CHUNK)
      const list  = chunk.map(p => `'${p.replace(/'/g, "''")}'`).join(',')
      const params = new URLSearchParams({
        where:          `PARCEL_PIN IN (${list})`,
        outFields:      'PARCEL_PIN,ADDRESS_1',
        returnGeometry: 'false',
        f:              'json',
      })
      const res = await fetch(`${ADDRESS_URL}?${params}`).catch(() => null)
      if (!res?.ok) continue
      const data = await res.json()
      for (const f of (data.features ?? [])) {
        const pin  = f.attributes.PARCEL_PIN?.trim()
        const addr = f.attributes.ADDRESS_1?.trim()
        if (pin && addr) pinAddrs[pin] = addr
      }
    }
  }

  for (const s of sales) {
    s.address = pinAddrs[s.pin] ?? null
  }

  // Enrich assessments with addresses
  for (const a of assessments) {
    a.address = pinAddrs[a.pin] ?? null
  }
  // Enrich zoning cases with addresses
  for (const z of zoningCases) {
    z.address = pinAddrs[z.pin] ?? null
  }

  const result = { sales, permits, assessments, zoningCases, fetchedAt: new Date().toISOString() }
  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })
  return c.json(result)
})

export default router
