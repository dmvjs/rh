#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "→ running remote migrations..."
(cd "$ROOT/api" && npx wrangler d1 migrations apply rh --remote)

echo "→ deploying api..."
(cd "$ROOT/api" && npm run deploy)

echo "→ building web..."
(cd "$ROOT/web" && npm run build)

echo "→ opening dist/ for upload..."
open "$ROOT/web/dist"

echo "✓ done — drag dist/ contents to S3"
