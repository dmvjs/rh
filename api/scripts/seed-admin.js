#!/usr/bin/env node
// Creates or replaces the admin account in D1.
// Usage: ADMIN_EMAIL=you@email.com ADMIN_PASSWORD=yourpass node scripts/seed-admin.js [--local]

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Kirk Elliott', ADMIN_ADDRESS = '3915 Laro Ct' } = process.env
const local = process.argv.includes('--local')

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-admin.js [--local]')
  process.exit(1)
}

const ITERATIONS = 100_000

async function hashPassword(password) {
  const key  = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256)
  const hex  = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${ITERATIONS}:${hex(salt)}:${hex(bits)}`
}

async function hashEmail(email) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.trim().toLowerCase()))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const passwordHash = await hashPassword(ADMIN_PASSWORD)
const emailHash    = await hashEmail(ADMIN_EMAIL)
const esc = (s) => s.replace(/'/g, "''")

const sql = `INSERT OR REPLACE INTO users (name, email_hash, password_hash, address, approved, email_verified, role)`
  + ` VALUES ('${esc(ADMIN_NAME)}', '${esc(emailHash)}', '${esc(passwordHash)}', '${esc(ADMIN_ADDRESS)}', 1, 1, 'admin');`

import { execSync } from 'child_process'

const flag = local ? '--local' : '--remote'
console.log(`Seeding admin (${flag})…`)
execSync(`npx wrangler d1 execute rh ${flag} --command ${JSON.stringify(sql)}`, {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'inherit',
})
console.log('Done.')
