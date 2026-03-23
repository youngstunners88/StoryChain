#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${1:-https://github.com/youngstunners88/StoryChain.git}"

if git remote get-url origin >/dev/null 2>&1; then
  CURRENT="$(git remote get-url origin)"
  echo "[Remote] origin already configured: $CURRENT"
else
  git remote add origin "$REPO_URL"
  echo "[Remote] Added origin -> $REPO_URL"
fi

echo "[Remote] Remotes:"
git remote -v

echo "[Next] To push branch: git push -u origin $(git branch --show-current)"
