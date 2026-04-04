#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Apply any pending migrations locally before starting
echo "→ applying local migrations..."
(cd "$ROOT/api" && npx wrangler d1 migrations apply rh --local)

echo "→ starting api (port 8787) and web (port 5173)..."
echo "   open http://localhost:5173"
echo ""

# Run both dev servers in parallel; kill both when either exits or Ctrl-C is pressed
trap 'kill 0' EXIT INT TERM

(cd "$ROOT/api" && npx wrangler dev) &
(cd "$ROOT/web" && npm run dev) &

wait
