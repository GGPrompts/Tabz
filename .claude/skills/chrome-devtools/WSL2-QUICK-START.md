# WSL2 Chrome DevTools - Quick Start Guide

**TL;DR:** Use PowerShell to start Chrome with debugging, then connect Puppeteer to WebSocket endpoint.

## The WSL2 Challenge

Chrome on Windows binds to `127.0.0.1` which is separate from WSL2's network namespace. Direct connections from WSL2 to Windows localhost don't work.

## Working Solution

### Step 1: Start Chrome with Remote Debugging

**Option A: PowerShell Script (Recommended)**

Create `~/Start-ChromeDebug.ps1` on Windows:

```powershell
# Start-ChromeDebug.ps1
param([int]$Port = 9222)

# Close existing Chrome
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Chrome with debugging
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
    --remote-debugging-port=$Port `
    --user-data-dir="$env:TEMP\chrome-debug" `
    --no-first-run

Start-Sleep -Seconds 2

# Show connection info
try {
    $v = (Invoke-WebRequest "http://localhost:$Port/json/version" -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "✓ Chrome debugging enabled on port $Port" -ForegroundColor Green
    Write-Host "  $($v.Browser)"
} catch {
    Write-Host "✗ Failed to start Chrome" -ForegroundColor Red
}
```

**Run from WSL2:**
```bash
powershell.exe -File ~/Start-ChromeDebug.ps1
```

**Option B: From WSL2 Bash**

```bash
# Close existing Chrome
taskkill.exe /F /IM chrome.exe 2>/dev/null
sleep 2

# Start Chrome
powershell.exe -Command "Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--remote-debugging-port=9222','--user-data-dir=C:\Temp\chrome-debug','--no-first-run'"
sleep 3
```

### Step 2: Get WebSocket Endpoint

Chrome's WebSocket endpoint can be accessed via PowerShell from WSL2:

```bash
# Get the WebSocket debugger URL
WS_URL=$(powershell.exe -Command "(Invoke-WebRequest -Uri 'http://localhost:9222/json/version' -UseBasicParsing | ConvertFrom-Json).webSocketDebuggerUrl")

echo "WebSocket URL: $WS_URL"
```

### Step 3: Connect Puppeteer

**Using WebSocket Endpoint:**

```bash
cd .claude/skills/chrome-devtools/scripts

# Get WS endpoint
WS_URL=$(powershell.exe -Command "(Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing | ConvertFrom-Json).webSocketDebuggerUrl" | tr -d '\r')

# Connect to Chrome
node navigate.js --url https://example.com --wsEndpoint "$WS_URL"
```

**Helper Script:**

Create `~/bin/chrome-ws`:

```bash
#!/bin/bash
# Get Chrome WebSocket endpoint for Puppeteer
powershell.exe -Command "(Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing | ConvertFrom-Json).webSocketDebuggerUrl" | tr -d '\r'
```

```bash
chmod +x ~/bin/chrome-ws

# Usage
node navigate.js --url https://example.com --wsEndpoint $(chrome-ws)
```

## Quick Test

```bash
# 1. Start Chrome (from WSL2)
powershell.exe -Command "Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--remote-debugging-port=9222','--user-data-dir=C:\Temp\chrome-debug','--no-first-run'"
sleep 3

# 2. Test connection
powershell.exe -Command "Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing | Select -ExpandProperty Content" | jq -r '.Browser'

# 3. List open tabs
powershell.exe -Command "Invoke-WebRequest 'http://localhost:9222/json/list' -UseBasicParsing | Select -ExpandProperty Content" | jq -r '.[] | "\(.title) - \(.url)"'

# 4. Run Puppeteer script
cd .claude/skills/chrome-devtools/scripts
WS=$(powershell.exe -Command "(Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing | ConvertFrom-Json).webSocketDebuggerUrl" | tr -d '\r')
node navigate.js --url https://example.com --wsEndpoint "$WS"
```

## Environment Setup (Optional)

Add to `~/.bashrc`:

```bash
# Chrome DevTools helpers
export CHROME_DEBUG_PORT=9222

# Start Chrome with debugging
chrome-start() {
    taskkill.exe /F /IM chrome.exe 2>/dev/null
    sleep 2
    powershell.exe -Command "Start-Process 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--remote-debugging-port=$CHROME_DEBUG_PORT','--user-data-dir=C:\Temp\chrome-debug','--no-first-run'"
    sleep 3
    chrome-check
}

# Check Chrome debugging status
chrome-check() {
    if powershell.exe -Command "Invoke-WebRequest 'http://localhost:$CHROME_DEBUG_PORT/json/version' -UseBasicParsing" >/dev/null 2>&1; then
        powershell.exe -Command "Invoke-WebRequest 'http://localhost:$CHROME_DEBUG_PORT/json/version' -UseBasicParsing | Select -ExpandProperty Content" | jq -r '"\(.Browser)"'
        echo "✓ Chrome debugging ready on port $CHROME_DEBUG_PORT"
    else
        echo "✗ Chrome debugging not available"
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
```

## Usage Examples

```bash
# Start Chrome
chrome-start

# Check status
chrome-check

# List tabs
chrome-tabs

# Run DevTools script
cd .claude/skills/chrome-devtools/scripts
node screenshot.js --url https://example.com --wsEndpoint $(chrome-ws) --output /tmp/screenshot.png

# Navigate
node navigate.js --url https://github.com --wsEndpoint $(chrome-ws)

# Performance test
node performance.js --url https://example.com --wsEndpoint $(chrome-ws) | jq '.vitals'
```

## Troubleshooting

### Chrome Won't Start

**Error:** Process exists but debugging not available

**Solution:**
```bash
# Force kill all Chrome processes
taskkill.exe /F /IM chrome.exe /T
sleep 3
chrome-start
```

### WebSocket Connection Failed

**Error:** `connect ECONNREFUSED`

**Check:**
1. Is Chrome running with debugging?
   ```bash
   powershell.exe -Command "Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing"
   ```

2. Is the WebSocket URL correct?
   ```bash
   chrome-ws
   # Should output: ws://127.0.0.1:9222/devtools/browser/...
   ```

3. Try restarting Chrome:
   ```bash
   chrome-start
   ```

### Permission Denied

**Error:** PowerShell execution policy

**Solution:**
```powershell
# Run in Windows PowerShell (as Admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Why This Works

1. **Chrome runs natively on Windows** with full GPU acceleration
2. **PowerShell bridges WSL2 ↔ Windows** for HTTP requests
3. **WebSocket endpoint** uses `127.0.0.1` which PowerShell can access
4. **Puppeteer connects** via WebSocket from WSL2

This solution is faster and more reliable than:
- Running Chrome in WSL2 (requires X server, slow)
- Port forwarding with `netsh` (complex, requires admin)
- SSH tunneling (unnecessary overhead)

### Tailscale Compatibility

✓ **This solution works with Tailscale!**

Since we use PowerShell to access Windows localhost (not direct IP networking), Tailscale VPN interfaces don't interfere. PowerShell runs as a Windows process and accesses `127.0.0.1` on Windows, independent of WSL2's network configuration.

Verified working with:
- Tailscale VPN active in WSL2 (`tailscale0` interface)
- Default route unchanged
- No conflicts with Tailscale's IP ranges (100.x.x.x)

## See Also

- [Full WSL2 Setup Guide](./WSL2-SETUP.md) - Comprehensive documentation
- [SKILL.md](./SKILL.md) - All available DevTools scripts
- [scripts/README.md](./scripts/README.md) - Script reference