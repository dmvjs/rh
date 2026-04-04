#!/usr/bin/env node
// One-off: hash existing raw emails in the users table.
// Run AFTER applying migration 0008_email_hash.sql.
// Usage: node scripts/migrate-email-hash.js

import { execSync } from 'child_process'
import { createHash } from 'crypto'

const DB = 'rh'
const WRANGLER = 'npx wrangler'

function hashEmail(email) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

function d1(sql) {
  const result = execSync(
    `${WRANGLER} d1 execute ${DB} --remote --json --command=${JSON.stringify(sql)}`,
    { cwd: new URL('../api', import.meta.url).pathname }
  )
  return JSON.parse(result.toString())
}

const rows = d1('SELECT id, email_hash FROM users').at(-1).results

const needsUpdate = rows.filter(r => r.email_hash?.includes('@'))
if (!needsUpdate.length) {
  console.log('No raw emails found — nothing to do.')
  process.exit(0)
}

console.log(`Hashing ${needsUpdate.length} user(s)…`)

for (const { id, email_hash: rawEmail } of needsUpdate) {
  const hash = hashEmail(rawEmail)
  d1(`UPDATE users SET email_hash = '${hash}' WHERE id = ${id}`)
  console.log(`  user ${id}: ${rawEmail} → ${hash.slice(0, 8)}…`)
}

console.log('Done.')
