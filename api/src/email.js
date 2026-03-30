import { ADDRESS_SET_LOWER } from './db/addresses.js'

const SUFFIXES = { court: 'ct', drive: 'dr', road: 'rd', lane: 'ln', circle: 'cir', place: 'pl', way: 'way' }
function normalizeAddress(addr) {
  return addr.toLowerCase().trim().replace(/\b(\w+)$/, w => SUFFIXES[w] ?? w)
}

export async function notifyNewRegistration(user, env) {
  if (!env.FORMSPREE_URL) return

  const adminUrl  = `${env.WEB_ORIGIN ?? 'https://ridgeleahills.com'}/admin.html`
  const known     = ADDRESS_SET_LOWER.has(normalizeAddress(user.address))
  const flag      = known ? '' : ' ⚠️ ADDRESS NOT RECOGNIZED'
  const subject   = `New registration: ${user.name}${flag}`

  await fetch(env.FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      subject,
      name:    user.name,
      email:   user.email,
      address: `${user.address}${flag}`,
      phone:   user.phone ?? '—',
      note:    user.note  ?? '—',
      message: `${user.name} (${user.email}) at ${user.address} has requested access.${flag}\n\nNote: ${user.note ?? 'none'}\n\nApprove: ${adminUrl}`,
    }),
  })
}
