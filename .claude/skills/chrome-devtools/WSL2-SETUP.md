# Chrome DevTools on WSL2 with Windows Chrome

Guide for using the chrome-devtools skill in WSL2 while connecting to Chrome running on Windows.

## Why This Setup?

Running Chrome natively on Windows from WSL2 offers several advantages:
- **Better performance** - Windows Chrome runs at native speed
- **GPU acceleration** - Full graphics acceleration support
- **Real browser testing** - Test with the actual Windows Chrome installation
- **No X11 required** - No need for X server or display configuration in WSL2

## Prerequisites

- Windows 10/11 with WSL2
- Chrome installed on Windows (typically at `C:\Program Files\Google\Chrome\Application\chrome.exe`)
- Node.js installed in WSL2
- Chrome DevTools scripts installed (already in this skill)

## Quick Start

### Option 1: Using Helper Script (Recommended)

Create a helper script to launch Windows Chrome with remote debugging:

```bash
# Create the script
cat > ~/.local/bin/chrome-debug << 'EOF'
#!/bin/bash
# Launch Windows Chrome with remote debugging enabled

CHROME="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
PORT="${1:-9222}"

# Get WSL2 host IP for Chrome to bind to
WSL_HOST=$(ip route show | grep -i default | awk '{print $3}')

echo "Starting Chrome with remote debugging on port $PORT"
echo "Chrome will be accessible at: http://localhost:$PORT"

"$CHROME" \
  --remote-debugging-port=$PORT \
  --remote-debugging-address=0.0.0.0 \
  --user-data-dir="$HOME/.chrome-debug-profile" \
  --no-first-run \
  --no-default-browser-check \
  > /dev/null 2>&1 &

CHROME_PID=$!
echo "Chrome started (PID: $CHROME_PID)"
echo ""
echo "Connect with: --browserUrl http://localhost:$PORT"
echo "Stop with: kill $CHROME_PID"
EOF

chmod +x ~/.local/bin/chrome-debug
```

**Note:** Make sure `~/.local/bin` is in your PATH:
```bash
export PATH="$HOME/.local/bin:$PATH"
# Add to ~/.bashrc or ~/.zshrc to make permanent
```

### Option 2: Manual Launch

Launch Chrome from Windows with remote debugging:

**PowerShell (Windows):**
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --remote-debugging-address=0.0.0.0 `
  --user-data-dir="C:\Temp\chrome-debug-profile"
```

**From WSL2:**
```bash
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0 \
  --user-data-dir="$HOME/.chrome-debug-profile" \
  &
```

## Usage

### 1. Start Chrome with Remote Debugging

**⚠️ IMPORTANT:** Close all existing Chrome windows first! If Chrome is already running, launching with remote debugging will just open a new tab in the existing instance (without debugging enabled).

```bash
# Close existing Chrome instances (if any)
taskkill.exe /F /IM chrome.exe 2>/dev/null || true

# Wait a moment for Chrome to fully close
sleep 2

# Using helper script (if created)
chrome-debug

# Or manually launch from WSL2
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0 \
  --user-data-dir="$HOME/.chrome-debug-profile" \
  &
```

**Verify it's working:**
```bash
# Should return Chrome version info
curl http://localhost:9222/json/version
```

### 2. Connect from DevTools Scripts

All scripts support the `--browserUrl` argument:

```bash
cd .claude/skills/chrome-devtools/scripts

# Navigate to a URL
node navigate.js --url https://example.com --browserUrl http://localhost:9222

# Take a screenshot
node screenshot.js --url https://example.com --browserUrl http://localhost:9222 --output ~/screenshot.png

# Fill a form
node fill.js --url https://example.com --selector "#email" --value "test@example.com" --browserUrl http://localhost:9222

# Analyze performance
node performance.js --url https://example.com --browserUrl http://localhost:9222
```

### 3. Environment Variable (Optional)

Set a default browser URL to avoid repeating `--browserUrl`:

```bash
export PUPPETEER_BROWSER_URL=http://localhost:9222

# Now use scripts without --browserUrl
node navigate.js --url https://example.com
node screenshot.js --url https://example.com --output ~/screenshot.png
```

Add to `~/.bashrc` or `~/.zshrc` to make permanent:
```bash
echo 'export PUPPETEER_BROWSER_URL=http://localhost:9222' >> ~/.bashrc
```

## Configuration Options

### Chrome Flags Explained

- `--remote-debugging-port=9222` - Port for DevTools Protocol (change if needed)
- `--remote-debugging-address=0.0.0.0` - Allow connections from WSL2
- `--user-data-dir=...` - Separate profile for debugging (keeps your main profile clean)
- `--no-first-run` - Skip first-run dialogs
- `--no-default-browser-check` - Skip default browser prompts

### Using Different Ports

If port 9222 is in use, choose another:

```bash
chrome-debug 9223  # Use port 9223 instead

# Connect using that port
node navigate.js --url https://example.com --browserUrl http://localhost:9223
```

### Headless Mode

To run Chrome headless (no window):

```bash
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless \
  --remote-debugging-port=9222 \
  --remote-debugging-address=0.0.0.0 \
  --user-data-dir="$HOME/.chrome-debug-profile" \
  &
```

## Troubleshooting

### Connection Refused

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:9222`

**Solutions:**
1. Ensure Chrome is running with remote debugging:
   ```bash
   ps aux | grep "remote-debugging-port"
   ```

2. Check the port is accessible:
   ```bash
   curl http://localhost:9222/json/version
   ```
   Should return JSON with Chrome version info.

3. Verify Chrome is binding to all interfaces:
   - Make sure `--remote-debugging-address=0.0.0.0` is included
   - Without this, Chrome only listens on localhost

### Port Already in Use

**Error:** Chrome won't start or port conflict

**Solutions:**
1. Find process using the port:
   ```bash
   lsof -i :9222
   # or
   netstat -ano | grep 9222
   ```

2. Kill existing Chrome debug instance:
   ```bash
   pkill -f "remote-debugging-port=9222"
   ```

3. Use a different port:
   ```bash
   chrome-debug 9223
   ```

### Chrome Not Found

**Error:** `chrome.exe: command not found`

**Solutions:**
1. Verify Chrome installation path:
   ```bash
   ls "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
   ```

2. Common alternative locations:
   - `"/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"`
   - `"/mnt/c/Users/$USER/AppData/Local/Google/Chrome/Application/chrome.exe"`

3. Update the path in your script accordingly

### WSL2 Network Issues

If `localhost` doesn't work, try using the Windows host IP:

```bash
# Get Windows host IP
WSL_HOST=$(ip route show | grep -i default | awk '{print $3}')
echo $WSL_HOST  # Usually 172.x.x.x

# Connect using host IP
node navigate.js --url https://example.com --browserUrl http://${WSL_HOST}:9222
```

### Profile Locked

**Error:** `User data directory is already in use`

**Solutions:**
1. Chrome is already running with that profile - close it:
   ```bash
   pkill -f "chrome-debug-profile"
   ```

2. Use a different profile directory:
   ```bash
   --user-data-dir="$HOME/.chrome-debug-profile-2"
   ```

## Advanced Usage

### Multiple Browser Instances

Run multiple Chrome instances on different ports:

```bash
# Instance 1 - Regular browsing
chrome-debug 9222 &

# Instance 2 - Mobile viewport
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --remote-debugging-port=9223 \
  --window-size=375,667 \
  --user-data-dir="$HOME/.chrome-mobile-profile" \
  &

# Connect to specific instance
node screenshot.js --url https://example.com --browserUrl http://localhost:9222
node screenshot.js --url https://example.com --browserUrl http://localhost:9223
```

### Shell Alias for Common Tasks

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Start Chrome debug instance
alias chrome-start='chrome-debug'

# Stop Chrome debug instance
alias chrome-stop='pkill -f "remote-debugging-port=9222"'

# Check if Chrome debug is running
alias chrome-status='curl -s http://localhost:9222/json/version | jq'

# Quick screenshot
alias chrome-shot='node ~/.claude/skills/chrome-devtools/scripts/screenshot.js --browserUrl http://localhost:9222'
```

### Browser Session Management Script

Create `~/.local/bin/chrome-session`:

```bash
#!/bin/bash
# Manage Chrome debug sessions

case "$1" in
  start)
    chrome-debug
    ;;
  stop)
    pkill -f "remote-debugging-port=9222"
    echo "Chrome debug session stopped"
    ;;
  status)
    if curl -s http://localhost:9222/json/version > /dev/null 2>&1; then
      echo "Chrome debug session is running"
      curl -s http://localhost:9222/json/version | jq -r '.Browser'
    else
      echo "Chrome debug session is not running"
    fi
    ;;
  restart)
    $0 stop
    sleep 2
    $0 start
    ;;
  *)
    echo "Usage: chrome-session {start|stop|status|restart}"
    exit 1
    ;;
esac
```

```bash
chmod +x ~/.local/bin/chrome-session

# Use it
chrome-session start
chrome-session status
chrome-session stop
```

## Testing the Setup

Verify everything works:

```bash
# 1. Start Chrome
chrome-debug

# 2. Test connection
curl http://localhost:9222/json/version

# 3. Navigate to a page
cd .claude/skills/chrome-devtools/scripts
node navigate.js --url https://example.com --browserUrl http://localhost:9222

# 4. Take a screenshot
node screenshot.js --url https://example.com --browserUrl http://localhost:9222 --output /tmp/test.png

# 5. View screenshot
explorer.exe /tmp/test.png  # Opens in Windows
```

## Performance Tips

1. **Keep Chrome Running:** Use `--close false` to reuse the browser instance:
   ```bash
   node navigate.js --url https://example.com --browserUrl http://localhost:9222 --close false
   node screenshot.js --url https://example.com --browserUrl http://localhost:9222 --close false
   node evaluate.js --script "document.title" --browserUrl http://localhost:9222
   ```

2. **Disable Extensions:** Add `--disable-extensions` to Chrome launch for faster startup

3. **Reduce Timeout:** For fast networks, reduce timeout:
   ```bash
   node navigate.js --url https://example.com --browserUrl http://localhost:9222 --timeout 10000
   ```

## Security Considerations

⚠️ **Warning:** Remote debugging exposes Chrome's DevTools Protocol

- Only run on trusted networks (localhost is safe)
- Don't expose port 9222 to the internet
- Use a separate profile (`--user-data-dir`) to avoid exposing your main browsing session
- Close the debug instance when not in use: `pkill -f "remote-debugging-port"`

## Next Steps

- See [SKILL.md](./SKILL.md) for complete script documentation
- Check [scripts/README.md](./scripts/README.md) for all available commands
- Review [references/](./references/) for advanced Puppeteer patterns

## Summary

**Setup once:**
```bash
# Create helper script
cat > ~/.local/bin/chrome-debug << 'EOF'
#!/bin/bash
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --remote-debugging-port=${1:-9222} \
  --remote-debugging-address=0.0.0.0 \
  --user-data-dir="$HOME/.chrome-debug-profile" \
  --no-first-run \
  > /dev/null 2>&1 &
echo "Chrome debug started on port ${1:-9222}"
EOF
chmod +x ~/.local/bin/chrome-debug
```

**Daily workflow:**
```bash
# Start Chrome
chrome-debug

# Use scripts
cd .claude/skills/chrome-devtools/scripts
node navigate.js --url https://example.com --browserUrl http://localhost:9222
node screenshot.js --url https://example.com --browserUrl http://localhost:9222 --output ~/shot.png

# Or set environment variable
export PUPPETEER_BROWSER_URL=http://localhost:9222
node navigate.js --url https://example.com  # No --browserUrl needed
```
