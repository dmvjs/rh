// PBKDF2 via Web Crypto — runs in Workers and Node 18+

const ITERATIONS = 100_000

export async function hashPassword(password) {
  const key = await importKey(password)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const bits = await crypto.subtle.deriveBits(pbkdf2Params(salt), key, 256)
  return `pbkdf2:${ITERATIONS}:${hex(salt)}:${hex(new Uint8Array(bits))}`
}

export async function verifyPassword(password, stored) {
  const [, iters, saltHex, hashHex] = stored.split(':')
  const key = await importKey(password)
  const bits = await crypto.subtle.deriveBits(pbkdf2Params(unhex(saltHex), Number(iters)), key, 256)
  return hex(new Uint8Array(bits)) === hashHex
}

function importKey(password) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
}

function pbkdf2Params(salt, iterations = ITERATIONS) {
  return { name: 'PBKDF2', hash: 'SHA-256', salt, iterations }
}

export async function hashEmail(email) {
  const normalized = email.trim().toLowerCase()
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  return hex(new Uint8Array(buf))
}

const hex    = (buf) => Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('')
const unhex  = (s)   => new Uint8Array(s.match(/.{2}/g).map(b => parseInt(b, 16)))
