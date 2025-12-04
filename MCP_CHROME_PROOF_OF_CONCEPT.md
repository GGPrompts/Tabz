# MCP + Chrome Extension Proof of Concept

**What this enables**: Claude Code can control both your terminal AND browser through a unified MCP interface.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Code                              │
│  "Open localhost:3000 and check for console errors"         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   MCP Server (Node.js/Go)     │
         │  - Terminal tools              │
         │  - Browser tools               │
         └───────┬───────────────┬────────┘
                 │               │
      Terminal   │               │   Browser
      ───────────▼               ▼──────────
   ┌──────────────┐    ┌─────────────────────┐
   │ Tabz Backend │    │ Native Messaging    │
   │ localhost:   │    │ Host (stdio)        │
   │ 8127         │    └──────────┬──────────┘
   └──────────────┘               │
                                  ▼
                    ┌─────────────────────────┐
                    │  Chrome Extension       │
                    │  - Background worker    │
                    │  - Content scripts      │
                    │  - DevTools integration │
                    └─────────────────────────┘
```

---

## Part 1: Chrome Extension (Fix & Extend)

First, let's fix your `feat/chrome-extension` branch and add Native Messaging support.

### Extension Structure

```
extension/
├── manifest.json               # Updated with nativeMessaging permission
├── background/
│   └── background.ts          # Service worker + Native Messaging
├── content/
│   └── content.ts             # Page interaction
└── native-messaging/
    └── host.json              # Native Messaging manifest
```

### manifest.json (Add Native Messaging)

```json
{
  "manifest_version": 3,
  "name": "Tabz Chrome Bridge",
  "version": "1.0.0",
  "permissions": [
    "tabs",
    "debugger",
    "scripting",
    "nativeMessaging"  // ← Key permission!
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background/background.js",
    "type": "module"
  }
}
```

### background.ts (Service Worker)

```typescript
// extension/background/background.ts

// Connect to Native Messaging host
let nativePort: chrome.runtime.Port | null = null

function connectNative() {
  nativePort = chrome.runtime.connectNative('com.tabz.mcp')

  nativePort.onMessage.addListener(async (message) => {
    console.log('[Background] Received from MCP:', message)

    const response = await handleMCPRequest(message)
    nativePort?.postMessage(response)
  })

  nativePort.onDisconnect.addListener(() => {
    console.error('[Background] Disconnected from MCP')
    nativePort = null
    // Auto-reconnect
    setTimeout(connectNative, 1000)
  })
}

// Handle requests from MCP server
async function handleMCPRequest(message: any) {
  switch (message.type) {
    case 'CREATE_TAB':
      return await createTab(message.url)

    case 'GET_TABS':
      return await getTabs()

    case 'GET_CONSOLE':
      return await getConsoleLogs(message.tabId)

    case 'GET_NETWORK':
      return await getNetworkRequests(message.tabId)

    case 'EXECUTE_SCRIPT':
      return await executeScript(message.tabId, message.code)

    case 'TAKE_SCREENSHOT':
      return await takeScreenshot(message.tabId)

    default:
      return { error: 'Unknown command' }
  }
}

// Tool implementations
async function createTab(url: string) {
  const tab = await chrome.tabs.create({ url })
  return {
    success: true,
    tabId: tab.id,
    url: tab.url
  }
}

async function getTabs() {
  const tabs = await chrome.tabs.query({})
  return {
    tabs: tabs.map(t => ({
      id: t.id,
      url: t.url,
      title: t.title,
      active: t.active
    }))
  }
}

async function getConsoleLogs(tabId: number) {
  // Inject content script to capture console
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      // @ts-ignore
      return window.__consoleLogs || []
    }
  })

  return { logs: result[0].result }
}

async function getNetworkRequests(tabId: number) {
  // Use debugger API to get network activity
  await chrome.debugger.attach({ tabId }, '1.3')
  await chrome.debugger.sendCommand({ tabId }, 'Network.enable')

  // Get HAR data
  const har = await chrome.debugger.sendCommand(
    { tabId },
    'Network.getResponseBody',
    {}
  )

  await chrome.debugger.detach({ tabId })

  return { requests: har }
}

async function executeScript(tabId: number, code: string) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    func: new Function('return ' + code)
  })

  return { result: result[0].result }
}

async function takeScreenshot(tabId: number) {
  const dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: 'png'
  })

  return { screenshot: dataUrl }
}

// Connect on startup
connectNative()
```

### content.ts (Capture Console Logs)

```typescript
// extension/content/content.ts

// Intercept console logs
const consoleLogs: any[] = []

const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

console.log = (...args) => {
  consoleLogs.push({ level: 'log', args, timestamp: Date.now() })
  originalLog.apply(console, args)
}

console.error = (...args) => {
  consoleLogs.push({ level: 'error', args, timestamp: Date.now() })
  originalError.apply(console, args)
}

console.warn = (...args) => {
  consoleLogs.push({ level: 'warn', args, timestamp: Date.now() })
  originalWarn.apply(console, args)
}

// Expose to background script
// @ts-ignore
window.__consoleLogs = consoleLogs
```

---

## Part 2: Native Messaging Host

This is the bridge between the Chrome extension and your MCP server.

### host.js (Node.js)

```javascript
#!/usr/bin/env node
// ~/.local/bin/tabz-chrome-host.js

// Native Messaging uses stdin/stdout for communication
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

// Read message from Chrome (4-byte length prefix + JSON)
function readMessage() {
  return new Promise((resolve) => {
    process.stdin.once('readable', () => {
      const lengthBuffer = process.stdin.read(4)
      if (!lengthBuffer) return

      const length = lengthBuffer.readUInt32LE(0)
      const message = process.stdin.read(length)

      resolve(JSON.parse(message.toString()))
    })
  })
}

// Send message to Chrome (4-byte length prefix + JSON)
function sendMessage(message) {
  const json = JSON.stringify(message)
  const length = Buffer.byteLength(json)

  const lengthBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32LE(length, 0)

  process.stdout.write(lengthBuffer)
  process.stdout.write(json)
}

// Forward to MCP server via HTTP
async function forwardToMCP(message) {
  const response = await fetch('http://localhost:9999/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  })

  return await response.json()
}

// Main loop
async function main() {
  while (true) {
    const message = await readMessage()
    const response = await forwardToMCP(message)
    sendMessage(response)
  }
}

main().catch(err => {
  console.error('Host error:', err)
  process.exit(1)
})
```

### Native Messaging Manifest

```json
// ~/.config/google-chrome/NativeMessagingHosts/com.tabz.mcp.json
{
  "name": "com.tabz.mcp",
  "description": "Tabz MCP Chrome Bridge",
  "path": "/home/matt/.local/bin/tabz-chrome-host.js",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID/"
  ]
}
```

---

## Part 3: MCP Server

This is what Claude Code talks to directly.

### server.ts (MCP Server with Browser + Terminal Tools)

```typescript
// ~/projects/tabz-mcp-server/server.ts

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import express from 'express'

// MCP Server for Claude
const server = new Server({
  name: 'tabz-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
})

// HTTP endpoint for Native Messaging host
const app = express()
app.use(express.json())

let latestChromeMessage: any = null

app.post('/mcp', (req, res) => {
  // Receive from Chrome via Native Messaging
  latestChromeMessage = req.body
  res.json({ received: true })
})

app.listen(9999, () => {
  console.log('[MCP] HTTP bridge listening on :9999')
})

// Helper to send to Chrome
async function sendToChrome(message: any) {
  // This gets picked up by the Native Messaging host
  const response = await fetch('http://localhost:9999/chrome', {
    method: 'POST',
    body: JSON.stringify(message)
  })
  return await response.json()
}

// ===== TERMINAL TOOLS =====

server.setRequestHandler('tools/list', async () => ({
  tools: [
    // Terminal operations
    {
      name: 'create_terminal',
      description: 'Create a new terminal in Tabz',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['bash', 'claude-code', 'tui-tool']
          },
          workingDir: { type: 'string' }
        },
        required: ['type']
      }
    },

    // Browser operations
    {
      name: 'open_tab',
      description: 'Open a URL in Chrome',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' }
        },
        required: ['url']
      }
    },
    {
      name: 'get_tabs',
      description: 'List all open Chrome tabs',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    {
      name: 'get_console_logs',
      description: 'Get console logs from active tab',
      inputSchema: {
        type: 'object',
        properties: {
          tabId: { type: 'number' }
        }
      }
    },
    {
      name: 'take_screenshot',
      description: 'Take screenshot of tab',
      inputSchema: {
        type: 'object',
        properties: {
          tabId: { type: 'number' }
        },
        required: ['tabId']
      }
    }
  ]
}))

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params

  switch (name) {
    // Terminal operations
    case 'create_terminal': {
      const response = await fetch('http://localhost:8127/api/terminals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: args.type,
          workingDir: args.workingDir
        })
      })

      const data = await response.json()
      return {
        content: [{
          type: 'text',
          text: `Created terminal: ${data.sessionName}`
        }]
      }
    }

    // Browser operations
    case 'open_tab': {
      const result = await sendToChrome({
        type: 'CREATE_TAB',
        url: args.url
      })

      return {
        content: [{
          type: 'text',
          text: `Opened tab ${result.tabId}: ${args.url}`
        }]
      }
    }

    case 'get_tabs': {
      const result = await sendToChrome({ type: 'GET_TABS' })

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result.tabs, null, 2)
        }]
      }
    }

    case 'get_console_logs': {
      const result = await sendToChrome({
        type: 'GET_CONSOLE',
        tabId: args.tabId
      })

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result.logs, null, 2)
        }]
      }
    }

    case 'take_screenshot': {
      const result = await sendToChrome({
        type: 'TAKE_SCREENSHOT',
        tabId: args.tabId
      })

      return {
        content: [{
          type: 'image',
          data: result.screenshot.split(',')[1], // Remove data:image/png;base64,
          mimeType: 'image/png'
        }]
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
})

// Start MCP server
const transport = new StdioServerTransport()
await server.connect(transport)
console.log('[MCP] Server started')
```

---

## Part 4: What Claude Can Do

Once everything is hooked up, Claude Code can do things like:

### Example 1: Full-Stack Development

```
You: "Start the dev server and open it in the browser"

Claude:
1. create_terminal({ type: 'bash', workingDir: '~/projects/my-app' })
2. (sends to terminal) npm run dev
3. (waits 3 seconds)
4. open_tab({ url: 'http://localhost:5173' })
5. get_console_logs()
6. "Development server started. No console errors detected."
```

### Example 2: Bug Investigation

```
You: "Check what's wrong with the profile page"

Claude:
1. open_tab({ url: 'http://localhost:3000/profile' })
2. get_console_logs()
3. "Found error: TypeError: Cannot read property 'name' of undefined"
4. create_terminal({ type: 'bash' })
5. (searches codebase) grep -r "profile.*name" src/
6. "The error is in ProfileCard.tsx line 42"
7. (opens file in terminal) nvim src/ProfileCard.tsx +42
```

### Example 3: Screenshot Documentation

```
You: "Take screenshots of all pages for the design review"

Claude:
1. get_tabs()  // Get all open tabs
2. For each tab:
   - take_screenshot({ tabId })
   - Saves to filesystem via terminal
3. Creates markdown report with embedded screenshots
```

---

## Getting Started: Minimal Setup

### Step 1: Install Extension
```bash
cd ~/projects/terminal-tabs-extension
# Fix build issues first
# Load unpacked extension in Chrome
```

### Step 2: Set Up Native Messaging
```bash
# Install host script
chmod +x ~/.local/bin/tabz-chrome-host.js

# Install manifest
mkdir -p ~/.config/google-chrome/NativeMessagingHosts/
cp native-messaging/host.json ~/.config/google-chrome/NativeMessagingHosts/com.tabz.mcp.json
```

### Step 3: Start MCP Server
```bash
cd ~/projects/tabz-mcp-server
npm install
node server.js
```

### Step 4: Configure Claude Code
```json
// ~/.config/claude-code/mcp_settings.json
{
  "mcpServers": {
    "tabz": {
      "command": "node",
      "args": ["/home/matt/projects/tabz-mcp-server/server.js"]
    }
  }
}
```

### Step 5: Test It!
```
In Claude Code:

"Create a bash terminal and open google.com in the browser"

Claude will:
1. Call create_terminal({ type: 'bash' })
2. Call open_tab({ url: 'https://google.com' })
```

---

## Security Considerations

**Whitelist operations** in the MCP server:

```typescript
const ALLOWED_OPERATIONS = {
  tabs: {
    create: true,     // ✅ Can open tabs
    close: false,     // ❌ Can't close tabs
    update: true      // ✅ Can navigate
  },
  debugger: {
    'Network.enable': true,  // ✅ Can inspect network
    'Runtime.evaluate': false // ❌ Can't execute arbitrary JS
  },
  filesystem: {
    read: true,       // ✅ Can read files
    write: false      // ❌ Can't write files
  }
}
```

---

## Next Steps

1. **Fix chrome-extension build** (create icons, fix config)
2. **Build Native Messaging host** (the bridge)
3. **Create simple MCP server** (with 2-3 tools to start)
4. **Test end-to-end** (Claude → MCP → Chrome)
5. **Iterate** (add more tools as needed)

---

## Cool Use Cases to Explore

- **Web scraping** (browser extracts data, terminal processes it)
- **Testing** (run tests in terminal, check results in browser)
- **Performance profiling** (DevTools metrics + terminal analysis)
- **Documentation** (screenshot generation + markdown creation)
- **Multi-service monitoring** (browser health checks + terminal logs)

---

**This is genuinely powerful tech!** Want to start building it? 🚀
