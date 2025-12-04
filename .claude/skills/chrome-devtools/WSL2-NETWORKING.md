# WSL2 Networking with Chrome DevTools

## Network Architecture

### WSL2 Network Isolation

WSL2 runs in a lightweight VM with its own network namespace:
- WSL2 has its own IP (typically `172.x.x.x`)
- Windows host is the default gateway (typically `172.x.x.1`)
- WSL2 cannot directly access Windows `localhost` (127.0.0.1)

### The Chrome DevTools Challenge

When Chrome runs on Windows with `--remote-debugging-port=9222`:
```
Chrome binds to: 127.0.0.1:9222 (Windows localhost)
WSL2 tries to connect: 172.x.x.x → 127.0.0.1:9222 ❌ FAILS
```

### Why Direct Connection Fails

```bash
# From WSL2
curl http://localhost:9222  # ❌ Connects to WSL2 localhost, not Windows
curl http://172.29.192.1:9222  # ❌ Windows not listening on external IPs
```

## Our Solution: PowerShell Bridge

PowerShell runs as a Windows process and can access Windows localhost:

```
WSL2 → powershell.exe → Windows localhost → Chrome
```

### How It Works

```bash
# PowerShell accesses Windows localhost directly
powershell.exe -Command "Invoke-WebRequest 'http://localhost:9222/json/version'"

# Get WebSocket endpoint
WS_URL=$(powershell.exe -Command "(Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing | ConvertFrom-Json).webSocketDebuggerUrl")

# Puppeteer connects via WebSocket
node navigate.js --wsEndpoint "$WS_URL"
```

## Network Configurations

### Standard WSL2

```
┌─────────────────┐
│   Windows Host  │
│  172.29.192.1   │
│                 │
│  Chrome:9222    │ (binds to 127.0.0.1)
└────────┬────────┘
         │
    ┌────▼──────┐
    │   WSL2    │
    │172.29.x.x │
    │           │
    │PowerShell │─────► Windows localhost
    └───────────┘
```

### With Tailscale

```
┌─────────────────┐
│   Windows Host  │
│  172.29.192.1   │
│  100.95.x.x     │ (Tailscale)
│                 │
│  Chrome:9222    │ (still binds to 127.0.0.1)
└────────┬────────┘
         │
    ┌────▼──────┐
    │   WSL2    │
    │172.29.x.x │ (eth0)
    │100.77.x.x │ (tailscale0)
    │           │
    │PowerShell │─────► Windows localhost ✓
    └───────────┘
```

**Key Point:** Tailscale adds interfaces but doesn't affect PowerShell → Windows localhost path.

## Checking Your Network

### View Interfaces

```bash
ip addr show

# Look for:
# - eth0: WSL2 primary interface (172.x.x.x)
# - tailscale0: Tailscale VPN (100.x.x.x) if installed
```

### View Routes

```bash
ip route show

# Should show:
# default via 172.x.x.1 dev eth0
```

### Test Chrome Connection

```bash
# This works because PowerShell accesses Windows localhost
powershell.exe -Command "Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing"

# This fails (WSL2 localhost != Windows localhost)
curl http://localhost:9222

# This fails (Chrome not listening on external IPs)
curl http://172.29.192.1:9222
```

## Tailscale Integration

### Compatibility

✓ **Fully compatible** - PowerShell bridge works with Tailscale active

### Why It Works

1. Tailscale creates a virtual network interface (`tailscale0`)
2. Tailscale routes traffic for its subnet (100.x.x.x)
3. Default route still goes through `eth0` → Windows host
4. PowerShell runs on Windows, unaffected by WSL2 networking

### Verification

```bash
# Check Tailscale status
tailscale status

# Verify default route unchanged
ip route show | grep default

# Test Chrome connection (should work)
powershell.exe -Command "Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing"
```

### Your Configuration

```bash
# WSL2 interfaces
172.29.204.199/20  # eth0 (primary)
100.77.48.15/32    # tailscale0 (VPN)

# Default gateway
172.29.192.1       # Windows host via eth0

# Tailscale network
100.x.x.x          # Tailscale mesh network
```

## Alternative Solutions (Not Used)

### 1. Port Forwarding with netsh (Complex)

```powershell
# Requires admin, must be redone after each reboot
netsh interface portproxy add v4tov4 `
  listenaddress=172.29.192.1 `
  listenport=9222 `
  connectaddress=127.0.0.1 `
  connectport=9222
```

**Issues:**
- Requires administrator privileges
- Not persistent across reboots
- More complex to manage

### 2. WSL2 Mirror Mode (Windows 11 only)

```ini
# .wslconfig
[wsl2]
networkingMode=mirrored
```

**Issues:**
- Only available in Windows 11 22H2+
- Still experimental
- May have compatibility issues

### 3. Chrome with 0.0.0.0 Binding (Security Risk)

```bash
chrome.exe --remote-debugging-address=0.0.0.0 --remote-debugging-port=9222
```

**Issues:**
- ❌ Exposes Chrome debugging to network
- ❌ Security vulnerability
- ❌ Not recommended

## Our Solution Benefits

✓ **Simple** - Just use PowerShell
✓ **Secure** - Chrome only accessible from localhost
✓ **Compatible** - Works with Tailscale, VPNs, etc.
✓ **No admin** - No elevated privileges needed
✓ **Persistent** - No configuration to maintain
✓ **Fast** - Direct WebSocket connection

## Troubleshooting Network Issues

### Test 1: PowerShell Access to Windows Localhost

```bash
powershell.exe -Command "Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing"
```

**Expected:** JSON response with Chrome version
**If fails:** Chrome not running with debugging

### Test 2: Get WebSocket URL

```bash
powershell.exe -Command "(Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing | ConvertFrom-Json).webSocketDebuggerUrl"
```

**Expected:** `ws://localhost:9222/devtools/browser/...`
**If fails:** Chrome debugging not responding

### Test 3: Puppeteer Connection

```bash
cd .claude/skills/chrome-devtools/scripts
WS=$(powershell.exe -Command "(Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing | ConvertFrom-Json).webSocketDebuggerUrl" | tr -d '\r')
node navigate.js --url https://example.com --wsEndpoint "$WS"
```

**Expected:** `{"success": true, ...}`
**If fails:** Check Puppeteer installation

## Summary

- WSL2 and Windows have separate network namespaces
- Chrome binds to Windows localhost (127.0.0.1)
- PowerShell bridges WSL2 → Windows localhost
- This works regardless of VPNs like Tailscale
- No port forwarding or network configuration needed

## See Also

- [WSL2 Quick Start](./WSL2-QUICK-START.md) - Quick setup guide
- [WSL2 Setup](./WSL2-SETUP.md) - Complete documentation
- [WSL2 Summary](./WSL2-SUMMARY.md) - What's configured
