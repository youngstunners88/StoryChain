#!/bin/bash
# Self-Healing Check Script
# Runs every 15 minutes via cron

GATEWAY_URL="http://localhost:8402"
LOG_FILE="/var/log/swarm-health.log"

log() {
    echo "[$(date -Iseconds)] $1" >> "$LOG_FILE"
}

check_gateway() {
    if curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/health" 2>/dev/null | grep -q "200"; then
        log "Gateway healthy"
        return 0
    else
        log "Gateway down - attempting restart"
        openclaw gateway restart 2>/dev/null || true
        sleep 5
        if curl -s -o /dev/null -w "%{http_code}" "$GATEWAY_URL/health" 2>/dev/null | grep -q "200"; then
            log "Gateway restarted successfully"
            return 0
        else
            log "Gateway restart failed"
            return 1
        fi
    fi
}

check_last_task() {
    LAST_TASK_STATUS=$(cat /tmp/last_task_status 2>/dev/null || echo "success")
    if [ "$LAST_TASK_STATUS" = "failed" ]; then
        CONSECUTIVE_FAILURES=$(cat /tmp/consecutive_failures 2>/dev/null || echo "0")
        CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
        echo "$CONSECUTIVE_FAILURES" > /tmp/consecutive_failures
        
        log "Task failed ($CONSECUTIVE_FAILURES consecutive)"
        
        if [ $CONSECUTIVE_FAILURES -ge 3 ]; then
            log "3 consecutive failures - spawning fresh session"
            spawn_fresh_session
        fi
    else
        echo "0" > /tmp/consecutive_failures
    fi
}

spawn_fresh_session() {
    log "Clearing context and retrying with minimal prompt"
    pkill -f "openclaw agent" 2>/dev/null || true
    log "Fresh session spawned"
}

check_gateway
check_last_task
