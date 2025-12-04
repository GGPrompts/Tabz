# Chrome DevTools Quick Start Guide

## 🖥️ Windows Desktop Shortcut (Easiest!)

### Create a Desktop Shortcut for Chrome Debug Mode

1. **Get the batch file:**
   - The file is located at: `\\wsl$\Ubuntu\home\matt\projects\terminal-tabs\docs\chrome-debug.bat`
   - Or manually copy it to your Windows Desktop from File Explorer

2. **Create a shortcut (on Windows):**
   - Right-click on `chrome-debug.bat` on your Desktop
   - Select "Create shortcut"
   - Rename it to "Chrome (Claude Debug)"
   - (Optional) Change icon: Right-click shortcut → Properties → Change Icon → Browse to Chrome.exe

3. **Use it:**
   - Double-click the shortcut to launch Chrome in debug mode
   - Claude can now control it when you use the skill!

**Alternative:** Right-click Desktop → New → Shortcut → Use this target:
```
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\Temp\chrome-debug
```

---

## 🚀 Quick Start (From WSL2)

### 1. Start Chrome (Anytime)

```bash
chrome-start
```

This closes any existing Chrome and starts a fresh instance that Claude can control.

---

## 2. Use Chrome DevTools Scripts

Navigate to the scripts directory:

```bash
cd .claude/skills/chrome-devtools/scripts
```

Now you can run any of these commands:

### Navigate to a Website

```bash
node navigate.js --url https://example.com --wsEndpoint $(chrome-ws)
```

### Take a Screenshot

```bash
node screenshot.js --url https://github.com --wsEndpoint $(chrome-ws) --output ~/github.png
```

### Fill a Form

```bash
node fill.js --url https://example.com --selector "#search" --value "query" --wsEndpoint $(chrome-ws)
```

### Click a Button

```bash
node click.js --selector "button" --wsEndpoint $(chrome-ws)
```

### Monitor Performance

```bash
node performance.js --url https://example.com --wsEndpoint $(chrome-ws) | jq '.vitals'
```

### Monitor Console Errors

```bash
node console.js --url https://example.com --wsEndpoint $(chrome-ws) --duration 5000
```

### Execute JavaScript

```bash
node evaluate.js --url https://example.com --script "document.title" --wsEndpoint $(chrome-ws)
```

---

## 3. Handy Helper Commands

### Get WebSocket Endpoint

```bash
chrome-ws
```

### List Open Tabs

```bash
powershell.exe -Command "Invoke-WebRequest 'http://localhost:9222/json/list' -UseBasicParsing | Select -ExpandProperty Content" | jq -r '.[] | "\(.title)"'
```

### Check Chrome Version

```bash
powershell.exe -Command "Invoke-WebRequest 'http://localhost:9222/json/version' -UseBasicParsing | Select -ExpandProperty Content" | jq -r '.Browser'
```

---

## 📸 Example: Take a Screenshot Right Now

```bash
cd .claude/skills/chrome-devtools/scripts
node screenshot.js --url https://github.com --wsEndpoint $(chrome-ws) --output ~/github-screenshot.png
```

The screenshot will be saved to your home directory!

---

## 🔧 Common Patterns

### Chain Multiple Commands

```bash
# Keep browser open between commands
node navigate.js --url https://example.com --wsEndpoint $(chrome-ws) --close false
node fill.js --selector "#search" --value "test" --wsEndpoint $(chrome-ws) --close false
node click.js --selector "button" --wsEndpoint $(chrome-ws)
```

### Extract Data from a Page

```bash
node evaluate.js --url https://github.com --script "Array.from(document.querySelectorAll('a')).slice(0,5).map(a => a.href)" --wsEndpoint $(chrome-ws)
```

### Monitor Network Activity

```bash
node network.js --url https://example.com --wsEndpoint $(chrome-ws) | jq '.requests[] | {url: .url, status: .status}'
```

---

## 📚 Documentation

For complete documentation, see:

- `.claude/skills/chrome-devtools/SKILL.md` - Full skill documentation
- `.claude/skills/chrome-devtools/WSL2-QUICK-START.md` - WSL2 quick reference
- `.claude/skills/chrome-devtools/scripts/README.md` - Script details

---

## 🐛 Troubleshooting

### Chrome Won't Start

```bash
# Kill all Chrome processes
taskkill.exe /F /IM chrome.exe /T
sleep 2
chrome-start
```

### Can't Connect to Chrome

```bash
# Verify Chrome is running with debugging
chrome-ws

# Should output: ws://localhost:9222/devtools/browser/...
# If not, restart Chrome:
chrome-start
```

### Module Not Found Error

```bash
cd .claude/skills/chrome-devtools/scripts
npm install
```

---

## 💡 Pro Tips

1. **Always use `$(chrome-ws)`** - This gets the current WebSocket endpoint automatically
2. **Use `--close false`** - Keep browser open to chain multiple commands
3. **Use `jq`** - Parse JSON output easily (install with `sudo apt install jq`)
4. **Check tabs** - Use `chrome-tabs` to see what's open in Chrome
5. **Screenshot debugging** - Take screenshots to verify what Claude sees

---

**Happy Automating!** 🎉
