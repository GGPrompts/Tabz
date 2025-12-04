#!/bin/bash
# Chrome DevTools Helper Functions for WSL2
# Source this file in your ~/.bashrc: source ~/projects/terminal-tabs/.claude/skills/chrome-devtools/chrome-helpers.sh

export CHROME_DEBUG_PORT=9222
export CHROME_VIEWPORT_WIDTH=3440
export CHROME_VIEWPORT_HEIGHT=1440

# Start Chrome with debugging
chrome-start() {
    echo "Stopping existing Chrome instances..."
    taskkill.exe /F /IM chrome.exe 2>/dev/null
    sleep 2

    echo "Starting Chrome with remote debugging on port $CHROME_DEBUG_PORT..."
    powershell.exe -Command "Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--remote-debugging-port=$CHROME_DEBUG_PORT','--user-data-dir=C:\Temp\chrome-debug','--no-first-run'"
    sleep 3

    chrome-check
}

# Check Chrome debugging status
chrome-check() {
    if powershell.exe -Command "Invoke-WebRequest 'http://localhost:$CHROME_DEBUG_PORT/json/version' -UseBasicParsing" >/dev/null 2>&1; then
        local info=$(powershell.exe -Command "Invoke-WebRequest 'http://localhost:$CHROME_DEBUG_PORT/json/version' -UseBasicParsing | Select -ExpandProperty Content" | jq -r '.Browser')
        echo "✓ Chrome debugging ready on port $CHROME_DEBUG_PORT"
        echo "  $info"
        return 0
    else
        echo "✗ Chrome debugging not available"
        echo "  Run 'chrome-start' to launch Chrome with debugging"
        return 1
    fi
}

# Get WebSocket endpoint
chrome-ws() {
    powershell.exe -Command "(Invoke-WebRequest 'http://localhost:$CHROME_DEBUG_PORT/json/version' -UseBasicParsing | ConvertFrom-Json).webSocketDebuggerUrl" | tr -d '\r'
}

# List Chrome tabs
chrome-tabs() {
    powershell.exe -Command "Invoke-WebRequest 'http://localhost:$CHROME_DEBUG_PORT/json/list' -UseBasicParsing | Select -ExpandProperty Content" | jq -r '.[] | "\(.title)\n  \(.url)\n"'
}

# Stop Chrome debugging instance
chrome-stop() {
    echo "Stopping Chrome debugging instance..."
    taskkill.exe /F /IM chrome.exe 2>/dev/null
    echo "✓ Chrome stopped"
}

# Quick screenshot helper
chrome-shot() {
    local url="${1:-about:blank}"
    local output="${2:-/tmp/screenshot.png}"
    local ws=$(chrome-ws)

    if [ -z "$ws" ]; then
        echo "Error: Chrome debugging not available. Run 'chrome-start' first."
        return 1
    fi

    cd ~/projects/terminal-tabs/.claude/skills/chrome-devtools/scripts
    node screenshot.js --url "$url" --wsEndpoint "$ws" --output "$output" \
        --viewport-width "$CHROME_VIEWPORT_WIDTH" --viewport-height "$CHROME_VIEWPORT_HEIGHT"
}

# Navigate Chrome to URL
chrome-nav() {
    local url="$1"
    local ws=$(chrome-ws)

    if [ -z "$ws" ]; then
        echo "Error: Chrome debugging not available. Run 'chrome-start' first."
        return 1
    fi

    if [ -z "$url" ]; then
        echo "Usage: chrome-nav <url>"
        return 1
    fi

    cd ~/projects/terminal-tabs/.claude/skills/chrome-devtools/scripts
    node navigate.js --url "$url" --wsEndpoint "$ws" \
        --viewport-width "$CHROME_VIEWPORT_WIDTH" --viewport-height "$CHROME_VIEWPORT_HEIGHT"
}

# Run performance test
chrome-perf() {
    local url="$1"
    local ws=$(chrome-ws)

    if [ -z "$ws" ]; then
        echo "Error: Chrome debugging not available. Run 'chrome-start' first."
        return 1
    fi

    if [ -z "$url" ]; then
        echo "Usage: chrome-perf <url>"
        return 1
    fi

    cd ~/projects/terminal-tabs/.claude/skills/chrome-devtools/scripts
    node performance.js --url "$url" --wsEndpoint "$ws" \
        --viewport-width "$CHROME_VIEWPORT_WIDTH" --viewport-height "$CHROME_VIEWPORT_HEIGHT" | jq '.vitals'
}

# Show help
chrome-help() {
    cat <<EOF
Chrome DevTools Helper Functions (WSL2)

Available commands:
  chrome-start      Start Chrome with remote debugging
  chrome-stop       Stop Chrome debugging instance
  chrome-check      Check if Chrome debugging is active
  chrome-ws         Get WebSocket endpoint URL
  chrome-tabs       List all open Chrome tabs
  chrome-shot URL [OUTPUT]   Take screenshot (default: /tmp/screenshot.png)
  chrome-nav URL    Navigate to URL
  chrome-perf URL   Run performance test and show Core Web Vitals
  chrome-help       Show this help

Environment:
  CHROME_DEBUG_PORT=$CHROME_DEBUG_PORT
  CHROME_VIEWPORT_WIDTH=$CHROME_VIEWPORT_WIDTH
  CHROME_VIEWPORT_HEIGHT=$CHROME_VIEWPORT_HEIGHT

Examples:
  chrome-start
  chrome-check
  chrome-tabs
  chrome-shot https://example.com ~/screenshot.png
  chrome-nav https://github.com
  chrome-perf https://example.com

For more info, see:
  ~/projects/terminal-tabs/.claude/skills/chrome-devtools/WSL2-QUICK-START.md
EOF
}

# Show status on source
if [ "${BASH_SOURCE[0]}" != "${0}" ]; then
    echo "Chrome DevTools helpers loaded. Type 'chrome-help' for usage."
    chrome-check 2>/dev/null || echo "  Run 'chrome-start' to enable debugging."
fi
