#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "→ building web..."
(cd "$ROOT/web" && npm run build)

echo "→ uploading to S3..."
aws s3 sync "$ROOT/web/dist/" s3://ridgeleahills.com --delete

echo "→ invalidating CloudFront..."
aws cloudfront create-invalidation --distribution-id EYPFNA3VEPPWI --paths '/*'

echo "✓ web deployed"
