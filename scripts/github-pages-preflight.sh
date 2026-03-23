#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[Preflight] Checking docs assets..."
test -f docs/index.html

test -f docs/CNAME
DOMAIN="$(cat docs/CNAME | tr -d '[:space:]')"
if [[ -z "$DOMAIN" || "$DOMAIN" == "storychain.yourdomain.com" ]]; then
  echo "[Preflight] ❌ docs/CNAME still uses placeholder domain: $DOMAIN"
  echo "[Preflight]    Set your real domain in docs/CNAME before publish."
  exit 2
fi

echo "[Preflight] Domain set: $DOMAIN"

echo "[Preflight] Checking workflow..."
test -f .github/workflows/pages.yml

echo "[Preflight] Checking readiness audit..."
bun run typecheck >/dev/null

echo "[Preflight] ✅ GitHub Pages preflight passed."
