# Termux Mobile Control Panel - React UI

**Date**: November 16, 2025
**Status**: Brainstorm / Concept
**Goal**: Build a mobile-optimized React app that provides a better UI for Termux using termux-api

---

## Core Concept

Instead of typing commands in a terminal (which is terrible on mobile), build a **touch-friendly React control panel** that runs in Tabz and uses termux-api commands under the hood.

### **The Problem:**
- Terminal keyboards take up 50% of screen
- Typing commands on mobile is slow and error-prone
- No visual feedback for system status (battery, network, etc.)
- Hard to discover available commands
- Difficult to interact with running processes

### **The Solution:**
React app with:
- **Large touch targets** - Big buttons instead of typed commands
- **Visual status indicators** - Battery, WiFi, location, sensors
- **Native Android dialogs** - via `termux-dialog`
- **Interactive notifications** - Action buttons via `termux-notification`
- **Voice input** - via `termux-speech-to-text`
- **One-tap actions** - Common tasks become buttons

---

## Architecture

### **Stack:**
```
React (Tabz frontend)
    ↓
Backend API endpoint (Node.js)
    ↓
termux-api commands (shell execution)
    ↓
Android system
```

### **How It Works:**

**Frontend (React):**
```typescript
// User taps "Take Photo" button
const takePhoto = async () => {
  const response = await fetch('/api/termux/camera-photo', {
    method: 'POST',
    body: JSON.stringify({ camera: 0 })
  })
  const { path } = await response.json()
  setPhotoPath(path)
}
```

**Backend (Node.js):**
```javascript
// backend/routes/termux-api.js
app.post('/api/termux/camera-photo', async (req, res) => {
  const { camera } = req.body
  const photoPath = `~/photos/${Date.now()}.jpg`

  // Execute termux-api command
  execSync(`termux-camera-photo -c ${camera} ${photoPath}`)

  res.json({ path: photoPath })
})
```

---

## Feature Ideas

### **1. System Status Dashboard**

Visual cards showing real-time info:

```
┌─────────────────────────────────────┐
│ 🔋 Battery: 85% ⚡ Charging          │
│ Progress: ████████░░ 85%            │
│ Temperature: 28.5°C                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📶 WiFi: HomeNetwork                │
│ Signal: -45 dBm (Excellent)         │
│ Speed: 866 Mbps @ 5GHz              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📍 Location: San Francisco, CA      │
│ Lat: 37.7749, Lon: -122.4194        │
│ Accuracy: 20m                       │
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
const [battery, setBattery] = useState({ percentage: 0, charging: false })
const [wifi, setWifi] = useState({ ssid: '', rssi: 0 })

useEffect(() => {
  const interval = setInterval(async () => {
    // Poll battery status
    const batteryRes = await fetch('/api/termux/battery-status')
    setBattery(await batteryRes.json())

    // Poll WiFi info
    const wifiRes = await fetch('/api/termux/wifi-connectioninfo')
    setWifi(await wifiRes.json())
  }, 5000) // Every 5 seconds

  return () => clearInterval(interval)
}, [])
```

---

### **2. Quick Actions Panel**

Large touch-friendly buttons for common tasks:

```
┌─────────────┬─────────────┬─────────────┐
│  📸 Photo   │  🎤 Record  │  📋 Paste   │
│             │             │             │
└─────────────┴─────────────┴─────────────┘

┌─────────────┬─────────────┬─────────────┐
│  🔦 Torch   │  📳 Vibrate │  🔔 Notify  │
│             │             │             │
└─────────────┴─────────────┴─────────────┘

┌─────────────┬─────────────┬─────────────┐
│  🎨 Theme   │  🔆 Bright  │  🔇 Mute    │
│             │             │             │
└─────────────┴─────────────┴─────────────┘
```

**Implementation:**
```typescript
const QuickActions = () => {
  const takePhoto = async () => {
    const res = await fetch('/api/termux/camera-photo', { method: 'POST' })
    const { path } = await res.json()
    toast(`Photo saved: ${path}`)
  }

  const toggleTorch = async () => {
    await fetch('/api/termux/torch', {
      method: 'POST',
      body: JSON.stringify({ state: 'toggle' })
    })
  }

  const showNotification = async () => {
    // Show dialog to customize notification
    const title = await showDialog('Notification Title')
    const content = await showDialog('Notification Content')

    await fetch('/api/termux/notification', {
      method: 'POST',
      body: JSON.stringify({ title, content })
    })
  }

  return (
    <div className="quick-actions">
      <ActionButton icon="📸" label="Photo" onClick={takePhoto} />
      <ActionButton icon="🔦" label="Torch" onClick={toggleTorch} />
      <ActionButton icon="🔔" label="Notify" onClick={showNotification} />
    </div>
  )
}
```

---

### **3. Voice Command Interface**

Big microphone button for hands-free control:

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│              🎤                     │
│                                     │
│         Tap to Speak                │
│                                     │
│                                     │
└─────────────────────────────────────┘

After tap:
┌─────────────────────────────────────┐
│         🎤 Listening...              │
│                                     │
│  "Take a photo with front camera"  │
│                                     │
│         Processing...               │
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
const VoiceCommand = () => {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  const listen = async () => {
    setListening(true)
    const res = await fetch('/api/termux/speech-to-text', { method: 'POST' })
    const { text } = await res.json()
    setTranscript(text)
    setListening(false)

    // Process command
    await processVoiceCommand(text)
  }

  const processVoiceCommand = async (text: string) => {
    if (text.includes('photo') || text.includes('picture')) {
      const camera = text.includes('front') ? 1 : 0
      await fetch('/api/termux/camera-photo', {
        method: 'POST',
        body: JSON.stringify({ camera })
      })
      speak('Photo taken')
    }
    else if (text.includes('torch') || text.includes('flashlight')) {
      await fetch('/api/termux/torch', { method: 'POST' })
      speak('Torch toggled')
    }
    else if (text.includes('battery')) {
      const res = await fetch('/api/termux/battery-status')
      const { percentage } = await res.json()
      speak(`Battery at ${percentage} percent`)
    }
    // ... more commands
  }

  const speak = async (text: string) => {
    await fetch('/api/termux/tts-speak', {
      method: 'POST',
      body: JSON.stringify({ text })
    })
  }

  return (
    <button onClick={listen} className="voice-button">
      {listening ? '🎤 Listening...' : '🎤 Tap to Speak'}
      {transcript && <p>{transcript}</p>}
    </button>
  )
}
```

---

### **4. Notification Builder**

Visual form instead of typing command flags:

```
┌─────────────────────────────────────┐
│ Create Notification                 │
│                                     │
│ Title: [Task Complete ............] │
│                                     │
│ Content: [Your build finished ....] │
│                                     │
│ Priority: ● High  ○ Default  ○ Low │
│                                     │
│ ☑️ Vibrate  ☑️ Sound  ☐ Ongoing     │
│                                     │
│ Button 1: [View PR ...............]  │
│ Action:   [Open GitHub ...........]  │
│                                     │
│ Button 2: [Copy URL ..............]  │
│ Action:   [Copy to clipboard .....]  │
│                                     │
│        [Send Notification]          │
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
const NotificationBuilder = () => {
  const [config, setConfig] = useState({
    title: '',
    content: '',
    priority: 'default',
    vibrate: false,
    sound: false,
    ongoing: false,
    button1: { text: '', action: '' },
    button2: { text: '', action: '' }
  })

  const sendNotification = async () => {
    await fetch('/api/termux/notification', {
      method: 'POST',
      body: JSON.stringify(config)
    })
    toast('Notification sent!')
  }

  return (
    <form onSubmit={sendNotification}>
      <input
        placeholder="Title"
        value={config.title}
        onChange={e => setConfig({...config, title: e.target.value})}
      />
      <textarea
        placeholder="Content"
        value={config.content}
        onChange={e => setConfig({...config, content: e.target.value})}
      />
      <RadioGroup
        options={['high', 'default', 'low']}
        value={config.priority}
        onChange={priority => setConfig({...config, priority})}
      />
      {/* ... more form fields ... */}
      <button type="submit">Send Notification</button>
    </form>
  )
}
```

---

### **5. Automation Builder**

Visual workflow creator instead of writing bash scripts:

```
┌─────────────────────────────────────┐
│ New Automation                      │
│                                     │
│ Name: [Check Battery Hourly ......] │
│                                     │
│ Trigger:                            │
│ ● Every 1 hour                      │
│ ○ At specific time                 │
│ ○ When battery low                 │
│                                     │
│ Conditions:                         │
│ ☑️ Only when charging               │
│ ☑️ Only on WiFi                     │
│ ☐ Only when idle                   │
│                                     │
│ Actions:                            │
│ 1. Get battery status               │
│ 2. If < 20% → Send notification     │
│ 3. If charging → Run sync           │
│                                     │
│        [Save Automation]            │
└─────────────────────────────────────┘
```

**Backend Implementation:**
```javascript
// Save automation as job-scheduler command
app.post('/api/termux/automation', async (req, res) => {
  const { name, schedule, conditions, actions } = req.body

  // Generate bash script
  const scriptPath = `~/automations/${name}.sh`
  const script = generateScript(conditions, actions)
  fs.writeFileSync(scriptPath, script)

  // Schedule with termux-job-scheduler
  execSync(`
    termux-job-scheduler \\
      --script ${scriptPath} \\
      --period-ms ${schedule.interval} \\
      ${conditions.charging ? '--charging' : ''} \\
      ${conditions.wifi ? '--network any' : ''}
  `)

  res.json({ success: true, scriptPath })
})

function generateScript(conditions, actions) {
  return `#!/bin/bash
termux-wake-lock
trap "termux-wake-unlock" EXIT

# Check conditions
${conditions.battery ? `
battery=$(termux-battery-status | jq -r '.percentage')
if [ "$battery" -lt 20 ]; then
  termux-notification --title "Low Battery" --content "$battery%"
fi
` : ''}

# Execute actions
${actions.map(action => generateAction(action)).join('\n')}
`
}
```

---

### **6. File Manager with Visual Previews**

Better than typing `ls` and `cd`:

```
┌─────────────────────────────────────┐
│ 📂 /storage/emulated/0/DCIM/Camera  │
│                                     │
│ [📷 IMG_001.jpg] [📷 IMG_002.jpg]   │
│ [📷 IMG_003.jpg] [🎥 VID_001.mp4]   │
│                                     │
│ Long-press for options:             │
│ • Share                             │
│ • Copy path to clipboard            │
│ • Set as wallpaper                  │
│ • Delete                            │
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
const FileManager = () => {
  const [path, setPath] = useState('/storage/emulated/0')
  const [files, setFiles] = useState([])

  useEffect(() => {
    loadFiles()
  }, [path])

  const loadFiles = async () => {
    const res = await fetch(`/api/termux/files?path=${path}`)
    setFiles(await res.json())
  }

  const handleFileAction = async (file, action) => {
    switch (action) {
      case 'share':
        await fetch('/api/termux/share', {
          method: 'POST',
          body: JSON.stringify({ file: file.path })
        })
        break
      case 'copy':
        await fetch('/api/termux/clipboard-set', {
          method: 'POST',
          body: JSON.stringify({ text: file.path })
        })
        toast('Path copied!')
        break
      case 'wallpaper':
        await fetch('/api/termux/wallpaper', {
          method: 'POST',
          body: JSON.stringify({ file: file.path })
        })
        break
      case 'delete':
        if (confirm('Delete this file?')) {
          await fetch(`/api/termux/files/${file.path}`, { method: 'DELETE' })
          loadFiles()
        }
        break
    }
  }

  return (
    <div className="file-manager">
      <div className="path">{path}</div>
      <div className="files">
        {files.map(file => (
          <FileCard
            key={file.path}
            file={file}
            onAction={handleFileAction}
          />
        ))}
      </div>
    </div>
  )
}
```

---

### **7. Sensor Visualizations**

Real-time graphs instead of JSON output:

```
┌─────────────────────────────────────┐
│ Accelerometer (Shake to test)      │
│                                     │
│ X: ████████░░░░░░░░░░  0.45g        │
│ Y: ░░░░████████░░░░░░ -0.22g        │
│ Z: ░░░░░░░░████████░░  0.98g        │
│                                     │
│ Light Sensor                        │
│ ██████████████████░░  850 lux       │
│                                     │
│ Proximity                           │
│ [Near ●○○○○○○○○○ Far]               │
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
const SensorDashboard = () => {
  const [sensors, setSensors] = useState({
    accelerometer: { x: 0, y: 0, z: 0 },
    light: 0,
    proximity: 0
  })

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8127/sensors')
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setSensors(data)
    }
    return () => ws.close()
  }, [])

  return (
    <div className="sensor-dashboard">
      <SensorBar
        label="Accelerometer X"
        value={sensors.accelerometer.x}
        min={-1}
        max={1}
      />
      {/* ... more sensors ... */}
    </div>
  )
}
```

---

### **8. Task Scheduler UI**

Visual cron/job-scheduler instead of CLI:

```
┌─────────────────────────────────────┐
│ Scheduled Tasks                     │
│                                     │
│ ✅ Sync Projects                    │
│    Every 30 minutes                 │
│    Conditions: WiFi, Charging       │
│    [Edit] [Disable] [Run Now]       │
│                                     │
│ ✅ Backup Photos                    │
│    Daily at 2:00 AM                 │
│    Conditions: Charging             │
│    [Edit] [Disable] [Run Now]       │
│                                     │
│ ⏸️  AI Worker (Paused)              │
│    Every hour                       │
│    Conditions: Battery > 50%        │
│    [Edit] [Enable] [Delete]         │
│                                     │
│        [+ New Task]                 │
└─────────────────────────────────────┘
```

---

## Mobile UX Patterns

### **1. Bottom Sheet Dialogs**

Instead of termux-dialog confirm, use sliding sheets:

```typescript
const useBottomSheet = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({})

  const show = (options) => {
    setConfig(options)
    setIsOpen(true)
    return new Promise((resolve) => {
      // Resolve when user chooses
    })
  }

  return { show, BottomSheet: () => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="bottom-sheet"
        >
          {config.content}
        </motion.div>
      )}
    </AnimatePresence>
  )}
}
```

### **2. Swipe Gestures**

```typescript
const useSwipeGesture = (onSwipeLeft, onSwipeRight) => {
  const handlers = useSwipeable({
    onSwipedLeft: onSwipeLeft,
    onSwipedRight: onSwipeRight,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  })
  return handlers
}

// Usage
const FileCard = ({ file }) => {
  const swipe = useSwipeGesture(
    () => handleAction('delete'),  // Swipe left = delete
    () => handleAction('share')    // Swipe right = share
  )

  return <div {...swipe}>{file.name}</div>
}
```

### **3. Haptic Feedback**

```typescript
const useHaptic = () => {
  const vibrate = async (pattern = 50) => {
    await fetch('/api/termux/vibrate', {
      method: 'POST',
      body: JSON.stringify({ duration: pattern })
    })
  }

  return {
    light: () => vibrate(30),
    medium: () => vibrate(50),
    heavy: () => vibrate(100),
    success: () => vibrate([50, 50, 100]),
    error: () => vibrate([100, 50, 100, 50, 100])
  }
}

// Usage
const Button = ({ onClick }) => {
  const haptic = useHaptic()

  return (
    <button onClick={() => {
      haptic.light()
      onClick()
    }}>
      Click Me
    </button>
  )
}
```

### **4. Pull-to-Refresh**

```typescript
const usePullToRefresh = (onRefresh) => {
  const [pulling, setPulling] = useState(false)
  const [startY, setStartY] = useState(0)

  const onTouchStart = (e) => {
    setStartY(e.touches[0].clientY)
  }

  const onTouchMove = (e) => {
    const pullDistance = e.touches[0].clientY - startY
    if (pullDistance > 100 && !pulling) {
      setPulling(true)
      onRefresh()
    }
  }

  return { onTouchStart, onTouchMove, pulling }
}
```

---

## Backend API Routes

```javascript
// backend/routes/termux-api.js
const express = require('express')
const { execSync } = require('child_process')
const router = express.Router()

// Battery status
router.get('/battery-status', (req, res) => {
  const output = execSync('termux-battery-status').toString()
  res.json(JSON.parse(output))
})

// WiFi info
router.get('/wifi-connectioninfo', (req, res) => {
  const output = execSync('termux-wifi-connectioninfo').toString()
  res.json(JSON.parse(output))
})

// Camera photo
router.post('/camera-photo', (req, res) => {
  const { camera = 0 } = req.body
  const path = `~/photos/${Date.now()}.jpg`
  execSync(`termux-camera-photo -c ${camera} ${path}`)
  res.json({ path })
})

// Notification
router.post('/notification', (req, res) => {
  const { title, content, priority, buttons } = req.body
  let cmd = `termux-notification --title "${title}" --content "${content}"`

  if (priority) cmd += ` --priority ${priority}`
  if (buttons?.button1) {
    cmd += ` --button1 "${buttons.button1.text}"`
    cmd += ` --button1-action "${buttons.button1.action}"`
  }

  execSync(cmd)
  res.json({ success: true })
})

// Speech to text
router.post('/speech-to-text', (req, res) => {
  const output = execSync('termux-speech-to-text').toString()
  res.json({ text: output.trim() })
})

// TTS
router.post('/tts-speak', (req, res) => {
  const { text } = req.body
  execSync(`termux-tts-speak "${text}"`)
  res.json({ success: true })
})

// Torch
router.post('/torch', (req, res) => {
  const { state } = req.body
  execSync(`termux-torch ${state}`)
  res.json({ success: true })
})

// Vibrate
router.post('/vibrate', (req, res) => {
  const { duration = 100 } = req.body
  execSync(`termux-vibrate -d ${duration}`)
  res.json({ success: true })
})

// Clipboard
router.post('/clipboard-set', (req, res) => {
  const { text } = req.body
  execSync(`echo "${text}" | termux-clipboard-set`)
  res.json({ success: true })
})

router.get('/clipboard-get', (req, res) => {
  const text = execSync('termux-clipboard-get').toString()
  res.json({ text })
})

// Location
router.get('/location', (req, res) => {
  const output = execSync('termux-location').toString()
  res.json(JSON.parse(output))
})

// Sensors (WebSocket for real-time)
router.ws('/sensors', (ws) => {
  const interval = setInterval(() => {
    const accel = execSync('termux-sensor -s accelerometer -n 1').toString()
    const light = execSync('termux-sensor -s light -n 1').toString()

    ws.send(JSON.stringify({
      accelerometer: JSON.parse(accel),
      light: JSON.parse(light)
    }))
  }, 1000)

  ws.on('close', () => clearInterval(interval))
})

module.exports = router
```

---

## Component Library

Use mobile-friendly React components:

### **Recommendations:**
- **Radix UI** - Accessible primitives
- **Framer Motion** - Smooth animations
- **React Swipeable** - Touch gestures
- **Recharts** - Sensor visualizations
- **Tailwind CSS** - Utility-first styling

### **Custom Components:**
```typescript
// src/components/mobile/
├── ActionButton.tsx      // Large tap target
├── BottomSheet.tsx       // iOS-style sheets
├── StatusCard.tsx        // System info cards
├── SensorBar.tsx         // Visual sensor data
├── VoiceButton.tsx       // Microphone UI
├── NotificationBuilder.tsx
└── AutomationBuilder.tsx
```

---

## Integration with Tabz

### **Option 1: New Tab Type**

Add "Control Panel" as a spawn option:

```json
{
  "label": "Control Panel",
  "terminalType": "control-panel",
  "icon": "sliders",
  "description": "Mobile-friendly Termux control panel",
  "component": "ControlPanel"  // Custom React component
}
```

### **Option 2: Sidebar Panel**

Show control panel in right sidebar (like info panel idea):

```
┌─────────────────┬─────────────────┐
│ Terminal        │ Control Panel   │
│                 │                 │
│ $ ls            │ 🔋 Battery: 85% │
│ file1.txt       │ 📶 WiFi: Home   │
│ file2.txt       │                 │
│                 │ Quick Actions:  │
│                 │ [📸] [🔦] [🔔]  │
│                 │                 │
│                 │ Automations:    │
│                 │ ✅ Sync (30m)   │
│                 │ ✅ Backup (1d)  │
└─────────────────┴─────────────────┘
```

### **Option 3: Standalone App**

Separate React app at `/control` route:

```
http://localhost:5173/          → Tabz (terminals)
http://localhost:5173/control   → Control Panel
```

---

## Use Cases

### **1. Daily Driver (Replace Termux)**
- Wake up → Check battery/WiFi on dashboard
- Tap "Sync Projects" → Runs git pull on all repos
- Voice: "Take a photo" → Camera opens, saves to ~/photos
- Swipe notification → Quick approve/reject

### **2. Automation Hub**
- Create automation: "Every hour, if battery > 50%, run AI worker"
- Visual progress: See tasks running in real-time
- One-tap disable: "Disable all automations" button

### **3. Media Controller**
- Take photos/videos with visual preview
- Set wallpaper by tapping image
- Share files to other apps with one tap
- Record voice memos with waveform visualization

### **4. Smart Home Dashboard**
- Location-based: "If at home, enable automations"
- Light sensor: "If dark, enable night mode"
- WiFi-based: "If on HomeNetwork, run backups"

---

## Next Steps

### **MVP (Minimal Viable Product):**
1. **System Status Cards** (battery, WiFi, location)
2. **Quick Actions** (5-10 common termux-api commands)
3. **Voice Command** (basic speech-to-text → action mapping)
4. **Notification Builder** (visual form → termux-notification)

### **Phase 2:**
1. **Automation Builder** (visual job-scheduler)
2. **File Manager** (visual file browser with previews)
3. **Sensor Dashboard** (real-time graphs)

### **Phase 3:**
1. **Task Scheduler UI** (manage all job-scheduler tasks)
2. **Widget System** (customizable dashboard)
3. **Themes** (match Tabz terminal themes)

---

## Technical Challenges

### **1. Permissions**
Some termux-api commands need permissions granted:
- Camera, microphone, location, SMS, phone
- Show permission request UI when first accessed
- Gracefully handle denied permissions

### **2. API Response Times**
Some commands are slow (location can take 5-10 seconds):
- Show loading states
- Use optimistic UI updates
- Cache recent results

### **3. Battery Usage**
Constant polling drains battery:
- Only poll visible components
- Increase interval on low battery
- Pause when app in background

### **4. Error Handling**
termux-api commands can fail silently:
- Check exit codes
- Show error toasts
- Provide fallbacks

---

## Inspiration

**Similar Apps:**
- **Tasker** - Android automation (complex, not mobile-friendly)
- **IFTTT** - Automation (cloud-based, limited)
- **Home Assistant** - Smart home dashboard (inspiration for UI)
- **Termux:Widget** - Limited to preset scripts

**Your Advantage:**
- ✅ Full React ecosystem
- ✅ Modern mobile UX patterns
- ✅ Integration with Tabz
- ✅ Voice + touch + keyboard
- ✅ Real-time updates via WebSocket

---

## Conclusion

Building a mobile React UI for Termux would be **significantly better** than using the terminal:

### **Terminal (Current):**
- Type: `termux-notification --title "Test" --content "Hello"`
- 50% screen covered by keyboard
- Hard to discover commands
- No visual feedback

### **Control Panel (Proposed):**
- Tap: "Send Notification" button
- Fill in form with big touch targets
- See preview before sending
- Instant visual feedback

**This could make Termux actually usable on mobile!** 📱✨

The termux-api research doc shows there's a HUGE surface area of functionality to expose. A well-designed React UI could make all of it accessible without typing a single command.

Want to build the MVP when you get to your PC? Start with:
1. Battery status card (polling every 5s)
2. 6 quick action buttons (photo, torch, vibrate, notify, clipboard, toast)
3. One voice command ("take photo")

That would already be more usable than typing commands! 🚀
