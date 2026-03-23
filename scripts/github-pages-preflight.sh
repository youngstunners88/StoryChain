#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[Preflight] Checking docs assets..."
test -f docs/index.html

if [[ -f docs/CNAME ]]; then
  DOMAIN="$(cat docs/CNAME | tr -d '[:space:]')"
  if [[ -z "$DOMAIN" || "$DOMAIN" == "storychain.yourdomain.com" ]]; then
    echo "[Preflight] ⚠️ docs/CNAME is placeholder/empty."
    echo "[Preflight]    Continuing with default GitHub project Pages URL."
  else
    if [[ "$DOMAIN" == *"github.io"* ]]; then
      echo "[Preflight] ℹ️ Using GitHub-hosted domain: $DOMAIN"
    fi
    echo "[Preflight] Domain set: $DOMAIN"
  fi
else
  echo "[Preflight] ℹ️ docs/CNAME not found; using default GitHub project Pages URL."
fi

echo "[Preflight] Checking workflow..."
test -f .github/workflows/pages.yml

echo "[Preflight] Checking readiness audit..."
bun run typecheck >/dev/null

echo "[Preflight] ✅ GitHub Pages preflight passed."
