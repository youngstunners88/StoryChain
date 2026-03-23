#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

SERVER_LOG="/tmp/storychain-readiness-server.log"
PID_FILE="/tmp/storychain-readiness.pid"

cleanup() {
  if [[ -f "$PID_FILE" ]]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
}
trap cleanup EXIT

echo "[Readiness] Running typecheck..."
bun run typecheck

echo "[Readiness] Running security audit..."
bun run test:security

echo "[Readiness] Starting server for stress rounds..."
STRESS_TEST_MODE=true bun run src/server.ts > "$SERVER_LOG" 2>&1 &
echo $! > "$PID_FILE"
sleep 3

echo "[Readiness] Running 4-round stress test..."
STRESS_ROUNDS=4 bun run test:stress

echo "[Readiness] All checks completed successfully."
echo "[Readiness] Server log: $SERVER_LOG"
