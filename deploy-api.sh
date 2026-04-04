#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "→ running remote migrations..."
(cd "$ROOT/api" && npx wrangler d1 migrations apply rh --remote)

echo "→ deploying api..."
(cd "$ROOT/api" && npm run deploy)

echo "✓ api deployed"
