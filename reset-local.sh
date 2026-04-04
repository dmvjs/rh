#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpass bash reset-local.sh"
  exit 1
fi

echo "→ wiping local database..."
rm -rf "$ROOT/api/.wrangler/state/v3/d1/"

echo "→ applying all migrations..."
(cd "$ROOT/api" && npx wrangler d1 migrations apply rh --local)

echo "→ seeding admin account..."
ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  node "$ROOT/api/scripts/seed-admin.js" --local

echo "→ copying trusted emails from prod..."
(cd "$ROOT/api" && npx wrangler d1 execute rh --remote --json \
  --command "SELECT email_hash, address FROM trusted_emails ORDER BY id" 2>/dev/null \
  | python3 -c "
import json, sys
data = json.load(sys.stdin)
rows = data[0]['results']
if not rows:
  print('No trusted emails found in prod.')
  exit(0)
vals = ', '.join(f\"('{r[\"email_hash\"]}', '{r[\"address\"].replace(chr(39), chr(39)+chr(39))}')\" for r in rows)
sql = f'INSERT INTO trusted_emails (email_hash, address) VALUES {vals};'
print(f'Inserting {len(rows)} trusted email(s)...')
import subprocess, tempfile, os
with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as f:
  f.write(sql)
  fname = f.name
subprocess.run(['npx', 'wrangler', 'd1', 'execute', 'rh', '--local', f'--file={fname}'], check=True)
os.unlink(fname)
print(f'Done.')
")

echo "✓ local db ready — run 'npm run dev' to start"
