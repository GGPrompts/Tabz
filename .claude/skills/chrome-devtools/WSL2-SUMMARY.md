# WSL2 Chrome DevTools - Summary

## What We Discovered

✓ Chrome is running on Windows with remote debugging enabled on port 9222
✓ PowerShell can access Chrome's DevTools Protocol from WSL2
✓ The chrome-devtools scripts work with `--wsEndpoint` parameter

## Quick Setup (Already Done for You)

Helper functions have been added to `~/.bashrc`:

- `chrome-start` - Start Chrome with remote debugging
- `chrome-check` - Verify Chrome debugging is working
- `chrome-ws` - Get WebSocket endpoint for Puppeteer
- `chrome-tabs` - List all open Chrome tabs

## Usage

### Start a New Shell

```bash
# Load the new functions
exec bash
# or just: source ~/.bashrc
```

### Basic Commands

```bash
# Check if Chrome debugging is available
chrome-check

# List all open tabs
chrome-tabs

# Get WebSocket endpoint
chrome-ws
```

### Using with DevTools Scripts

```bash
cd .claude/skills/chrome-devtools/scripts

# Navigate to a URL
node navigate.js --url https://example.com --wsEndpoint $(chrome-ws)

# Take a screenshot
node screenshot.js --url https://github.com --wsEndpoint $(chrome-ws) --output ~/screenshot.png

# Analyze performance
node performance.js --url https://example.com --wsEndpoint $(chrome-ws) | jq '.vitals'

# Monitor console
node console.js --url https://example.com --wsEndpoint $(chrome-ws) --duration 5000

# Click an element
node click.js --url https://example.com --selector "button" --wsEndpoint $(chrome-ws)
```

### Testing Right Now

Your Chrome is already running with debugging. Try this:

```bash
# In a new terminal (to load the functions)
exec bash

# Test the connection
chrome-check

# Navigate to a site
cd /home/matt/projects/claudekit-skills/.claude/skills/chrome-devtools/scripts
WS_ENDPOINT=$(powershell.exe -Command "(Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing | ConvertFrom-Json).webSocketDebuggerUrl" | tr -d '\r')
node navigate.js --url https://example.com --wsEndpoint "$WS_ENDPOINT"
```

## How It Works

1. **Chrome runs on Windows** with `--remote-debugging-port=9222`
2. **PowerShell bridges WSL2 → Windows** for accessing `http://localhost:9222`
3. **WebSocket endpoint** is retrieved via PowerShell
4. **Puppeteer connects** to Chrome using the WebSocket URL

## Files Created

- `~/.bashrc` - Added Chrome helper functions
- `.claude/skills/chrome-devtools/WSL2-QUICK-START.md` - Quick start guide
- `.claude/skills/chrome-devtools/WSL2-SETUP.md` - Comprehensive setup guide
- `.claude/skills/chrome-devtools/WSL2-SUMMARY.md` - This file
- `.claude/skills/chrome-devtools/scripts/lib/browser.js` - Updated to support `PUPPETEER_BROWSER_URL` env var

## Next Steps

1. **Start a new shell** to load the helper functions:
   ```bash
   exec bash
   ```

2. **Test the connection**:
   ```bash
   chrome-check
   chrome-tabs
   ```

3. **Run a DevTools script**:
   ```bash
   cd .claude/skills/chrome-devtools/scripts
   node navigate.js --url https://example.com --wsEndpoint $(chrome-ws)
   ```

## Documentation

- **Quick Start:** [WSL2-QUICK-START.md](./WSL2-QUICK-START.md)
- **Full Guide:** [WSL2-SETUP.md](./WSL2-SETUP.md)
- **All Scripts:** [SKILL.md](./SKILL.md)
- **Script Reference:** [scripts/README.md](./scripts/README.md)

## Troubleshooting

If `chrome-check` fails:
```bash
# Restart Chrome with debugging
chrome-start
```

If WebSocket connection fails:
```bash
# Get the endpoint manually
powershell.exe -Command "(Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing | ConvertFrom-Json).webSocketDebuggerUrl"
```
