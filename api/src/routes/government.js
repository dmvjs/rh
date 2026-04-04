import { Hono } from 'hono'
import { authenticate } from '../middleware/auth.js'

const router = new Hono()

// Update after each election cycle
const OFFICIALS = [
  {
    level: 'Federal', title: 'U.S. Senator', name: 'Mark R. Warner', party: 'D',
    district: 'Virginia', term: 'Term through Jan 2027',
    phones: [{ label: 'DC Office', number: '202-224-2023' }],
    website: 'https://www.warner.senate.gov',
    contact: 'https://www.warner.senate.gov/public/index.cfm/contact',
  },
  {
    level: 'Federal', title: 'U.S. Senator', name: 'Tim Kaine', party: 'D',
    district: 'Virginia', term: 'Term through Jan 2031',
    phones: [{ label: 'DC Office', number: '202-224-4024' }],
    website: 'https://www.kaine.senate.gov',
    contact: 'https://www.kaine.senate.gov/contact',
  },
  {
    level: 'Federal', title: 'U.S. Representative', name: 'Don Beyer', party: 'D',
    district: "Virginia's 8th Congressional District", term: 'Term through Jan 2027',
    phones: [{ label: 'DC Office', number: '202-225-4376' }],
    website: 'https://beyer.house.gov',
    contact: 'https://beyer.house.gov/contact/',
  },
  {
    level: 'State', title: 'Governor', name: 'Glenn Youngkin', party: 'R',
    district: 'Virginia', term: 'Term through Jan 2026',
    phones: [{ label: 'Office', number: '804-786-2211' }],
    website: 'https://www.governor.virginia.gov',
    contact: 'https://www.governor.virginia.gov/contact-us/',
  },
  {
    level: 'State', title: 'State Senator', name: 'Scott Surovell', party: 'D',
    district: '36th Senate District', term: 'Term through Jan 2028',
    phones: [{ label: 'Office', number: '703-647-7900' }],
    website: 'https://www.scottsurovell.com',
    contact: 'https://www.scottsurovell.com/contact/',
  },
  {
    level: 'State', title: 'Delegate', name: 'Mark Sickles', party: 'D',
    district: '43rd House District', term: 'Term through Jan 2026',
    phones: [{ label: 'Office', number: '703-922-6440' }],
    website: 'https://www.marksickles.com',
    contact: 'https://virginiageneralassembly.gov/house/members/members.xhtml',
  },
  {
    level: 'County', title: 'Board of Supervisors', name: 'Penny Gross', party: 'D',
    district: 'Mason District', term: 'Term through Dec 2027',
    phones: [{ label: 'Office', number: '703-256-7717' }],
    website: 'https://www.fairfaxcounty.gov/mason/',
    contact: 'https://www.fairfaxcounty.gov/mason/contact-mason-district',
  },
  {
    level: 'County', title: 'School Board', name: 'Ricardy J. Anderson', party: 'D',
    district: 'Mason District — FCPS', term: 'Term through Dec 2027',
    phones: [{ label: 'Office', number: '571-423-1083' }],
    website: 'https://www.fcps.edu/staff/ricardy-anderson',
    contact: 'https://www.fcps.edu/submit-question-ricardy-anderson',
  },
]

router.get('/', authenticate, async (c) => {
  const kv = c.env.CACHE
  const CACHE_KEY = 'government:officials:v3'
  const TTL = 60 * 60 * 12

  if (kv) {
    const cached = await kv.get(CACHE_KEY)
    if (cached) return c.json(JSON.parse(cached))
  }

  const result = { officials: OFFICIALS, fetchedAt: new Date().toISOString() }

  if (kv) await kv.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: TTL })

  return c.json(result)
})

export default router
