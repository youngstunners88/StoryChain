#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

failures=0

check_file() {
  local path="$1"
  if [[ -f "$path" ]]; then
    printf '✅ file: %s\n' "$path"
  else
    printf '❌ missing file: %s\n' "$path"
    failures=$((failures + 1))
  fi
}

check_dir() {
  local path="$1"
  if [[ -d "$path" ]]; then
    printf '✅ dir:  %s\n' "$path"
  else
    printf '❌ missing dir:  %s\n' "$path"
    failures=$((failures + 1))
  fi
}

printf 'StoryChain repository sanity check\n'
printf 'Root: %s\n\n' "$ROOT_DIR"

# Core project reality checks
check_file "package.json"
check_file "README.md"
check_file ".env.example"
check_file "src/server.ts"
check_file "scripts/hackathon-readiness.sh"
check_file "scripts/github-pages-preflight.sh"
check_file ".github/workflows/pages.yml"

check_dir "src"
check_dir "tests"
check_dir "docs"
check_dir "scripts"
check_dir ".github/workflows"

printf '\n'
if [[ $failures -eq 0 ]]; then
  printf '✅ Repository sanity check passed.\n'
  exit 0
else
  printf '❌ Repository sanity check failed with %d issue(s).\n' "$failures"
  exit 1
fi
