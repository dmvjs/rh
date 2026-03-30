#!/usr/bin/env node
// Generates the SQL to create your admin account in D1.
// Usage: ADMIN_EMAIL=you@email.com ADMIN_PASSWORD=yourpass node scripts/seed-admin.js
// Then run the printed wrangler command.

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Kirk Elliott', ADMIN_ADDRESS = '3915 Laro Ct' } = process.env

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-admin.js')
  process.exit(1)
}

const ITERATIONS = 100_000

async function hashPassword(password) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256)
  const hex  = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${ITERATIONS}:${hex(salt)}:${hex(bits)}`
}

const hash = await hashPassword(ADMIN_PASSWORD)
const email = ADMIN_EMAIL.toLowerCase()

const esc = (s) => s.replace(/'/g, "''")
const sql = `INSERT OR REPLACE INTO users (name, email, password_hash, address, approved, role) VALUES ('${esc(ADMIN_NAME)}', '${esc(email)}', '${esc(hash)}', '${esc(ADMIN_ADDRESS)}', 1, 'admin');`

console.log('\nFor PRODUCTION (remote):\n')
console.log(`npx wrangler d1 execute rh --remote --command "${sql}"\n`)
console.log('For local dev:\n')
console.log(`npx wrangler d1 execute rh --local --command "${sql}"\n`)
