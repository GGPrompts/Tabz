# Detached Sessions Feature Design

**Created**: November 10, 2025
**Status**: Proposed Design
**Priority**: High (user requested)

---

## Overview

Add ability to **detach tabs** instead of killing tmux sessions, with detached sessions appearing as **grayed-out tabs in all browser windows** that can be clicked to reattach.

### Key Features
1. ⊟ Detach button (keeps session running in background)
2. 👁️ Detached tabs visible in all windows (grayed out)
3. 🔄 Click detached tab to reattach to current window
4. 🆕 Spawn new terminals in detached state
5. 🔍 Auto-discover orphaned tmux sessions

---

## UX Flow

### Detaching a Tab

**Visual:**
```
Active Tab:    [🤖 Claude Code ⊟ ×]    ← Full color, two buttons
               ↓ Click ⊟
Detached Tab:  [🤖 Claude Code ⊟]      ← Grayed out, appears in ALL windows
```

**Behavior:**
1. User clicks ⊟ (detach button) on active tab
2. Backend detaches tmux session (keeps it running)
3. Terminal marked as `isDetached: true`, `windowId: null`
4. WebSocket agent disconnected
5. Tab becomes grayed out and appears in **all browser windows**
6. If this was active tab, switch to next non-detached tab

### Reattaching a Tab

**Visual:**
```
Detached Tab:  [🤖 Claude Code ⊟]      ← Grayed out (any window)
               ↓ Click anywhere on tab
Active Tab:    [🤖 Claude Code ⊟ ×]    ← Full color in current window
```

**Behavior:**
1. User clicks detached tab in any browser window
2. Terminal marked as `isDetached: false`, `windowId: currentWindowId`
3. Reconnection logic automatically connects WebSocket
4. Tab becomes active and full color in current window
5. Tab disappears from other windows (now owned by this window)

### Spawn Detached

**Spawn Menu:**
```
┌─────────────────────────────┐
│ [🤖] Claude Code            │
│ [🐚] Bash                   │
│ ...                         │
│                             │
│ ☐ Spawn detached            │  ← New checkbox
└─────────────────────────────┘
```

**Behavior:**
1. User checks "Spawn detached" in spawn menu
2. Terminal spawns, immediately detaches
3. Appears as grayed-out tab in all windows
4. Can be reattached by clicking from any window

### Auto-Discovery (Orphaned Sessions)

**Scenario:** User manually creates `tmux new -s tt-custom`, or Tabz crashes and loses state

**Behavior:**
1. Background task polls `/api/tmux/sessions` every 30s
2. Finds tmux sessions (`tt-*` prefix) not in terminal store
3. Adds them as detached tabs with ❓ icon
4. User can click to reattach and rename

---

## Data Model Changes

### Terminal Interface

```typescript
// src/stores/simpleTerminalStore.ts

export interface Terminal {
  // ... existing fields
  id: string;
  name: string;
  terminalType: string;
  sessionName?: string;
  agentId?: string;
  windowId?: string;
  status?: 'spawning' | 'active' | 'closed' | 'error';

  // NEW FIELDS for detached sessions
  isDetached?: boolean;           // Is this session detached?
  lastActiveTime?: number;        // Timestamp of last activity (for sorting)
  lastAttachedWindowId?: string;  // Which window last had it (smart default for reattach)
}
```

### Key Insight: windowId = null

**Detached tabs have `windowId: null`** so they pass the visibility filter in **all browser windows**:

```typescript
const visibleTerminals = terminals.filter(t => {
  if (t.isHidden) return false;  // Panes in splits
  if (t.isDetached && !t.windowId) return true;  // ← Detached: show everywhere

  const terminalWindow = t.windowId || 'main';
  return terminalWindow === currentWindowId;  // Active: show in assigned window
});
```

---

## Backend API

### Existing Endpoints (No Changes Needed!)

✅ **GET /api/tmux/sessions**
- Lists all tmux sessions
- Returns: `["tabz", "tt-bash-xyz", "tt-cc-abc", ...]`

✅ **POST /api/tmux/detach/:name**
- Detaches clients from session (keeps session alive)
- Already implemented at `backend/routes/api.js:785`

### Optional Enhancement: Orphaned Sessions

**GET /api/tmux/sessions/orphaned**

Returns tmux sessions not in terminal registry (discovered sessions).

```javascript
// backend/routes/api.js

router.get('/tmux/sessions/orphaned', asyncHandler(async (req, res) => {
  const { execSync } = require('child_process');

  // Get all tmux sessions
  const allSessions = execSync('tmux list-sessions -F "#{session_name}"', { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);

  // Filter to Tabz-managed sessions (tt-* prefix)
  const tabzSessions = allSessions.filter(s => s.startsWith('tt-'));

  // Get sessions from terminal registry
  const registry = require('../modules/terminal-registry');
  const knownSessions = Array.from(registry.getAllTerminals().values())
    .map(t => t.sessionName)
    .filter(Boolean);

  // Orphaned = tmux sessions not in registry
  const orphaned = tabzSessions.filter(s => !knownSessions.includes(s));

  res.json({
    success: true,
    data: {
      orphaned,
      count: orphaned.length,
      all: tabzSessions.length,
      known: knownSessions.length
    }
  });
}));
```

---

## Frontend Implementation

### 1. Tab Filtering (Show Detached in All Windows)

```typescript
// src/SimpleTerminalApp.tsx

const visibleTerminals = useMemo(() => {
  return terminals.filter(t => {
    // Hide panes in splits
    if (t.isHidden) return false;

    // Show detached tabs in ALL windows
    if (t.isDetached && !t.windowId) return true;

    // Show active tabs only in assigned window
    const terminalWindow = t.windowId || 'main';
    return terminalWindow === currentWindowId;
  });
}, [terminals, currentWindowId]);
```

### 2. Tab Styling (Gray Out Detached)

```css
/* src/SimpleTerminalApp.css */

.tab-button.detached {
  opacity: 0.5;
  font-style: italic;
  background: rgba(128, 128, 128, 0.1);
  border: 1px solid rgba(128, 128, 128, 0.3);
  cursor: pointer;
}

.tab-button.detached:hover {
  opacity: 0.7;
  background: rgba(128, 128, 128, 0.2);
}

.tab-button.detached .tab-label::after {
  content: ' ⊟';  /* Minimize icon */
  opacity: 0.6;
  font-size: 0.9em;
}

/* Show relative time for detached tabs */
.tab-button.detached .tab-time {
  font-size: 0.75em;
  opacity: 0.6;
  margin-left: 4px;
}
```

### 3. Detach Handler

```typescript
// src/SimpleTerminalApp.tsx

const handleDetachTab = async (terminalId: string) => {
  const terminal = terminals.find(t => t.id === terminalId);
  if (!terminal?.sessionName) return;

  try {
    // Call backend to detach
    const response = await fetch(`http://localhost:8127/api/tmux/detach/${terminal.sessionName}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to detach session');
    }

    // Update store: mark as detached, clear windowId
    updateTerminal(terminalId, {
      isDetached: true,
      windowId: null,  // Show in all windows
      lastActiveTime: Date.now(),
      lastAttachedWindowId: currentWindowId,
      agentId: undefined  // Clear WebSocket agent
    });

    // Close WebSocket agent if exists
    const agent = webSocketAgents.get(terminal.agentId);
    if (agent?.ws) {
      agent.ws.send(JSON.stringify({
        type: 'disconnect',
        id: terminal.agentId
      }));
    }
    webSocketAgents.delete(terminal.agentId);

    // If this was active tab, switch to another
    if (activeTerminalId === terminalId) {
      const nextTab = visibleTerminals.find(t => t.id !== terminalId && !t.isDetached);
      setActiveTerminal(nextTab?.id || null);
    }

    console.log(`✅ Detached terminal: ${terminal.name} (${terminal.sessionName})`);
  } catch (err) {
    console.error('Failed to detach terminal:', err);
    // Optionally show error toast
  }
};
```

### 4. Reattach Handler

```typescript
// src/SimpleTerminalApp.tsx

const handleReattachTab = async (terminalId: string) => {
  const terminal = terminals.find(t => t.id === terminalId);
  if (!terminal?.sessionName || !terminal.isDetached) return;

  console.log(`🔄 Reattaching terminal: ${terminal.name} (${terminal.sessionName})`);

  // Update store: mark as active, assign to current window
  updateTerminal(terminalId, {
    isDetached: false,
    windowId: currentWindowId,
    status: 'spawning',  // Triggers reconnection logic
    lastActiveTime: Date.now()
  });

  // Set as active tab
  setActiveTerminal(terminalId);

  // Reconnection will happen automatically via useWebSocketManager
  // because status changed to 'spawning' and terminal has sessionName
};

// Tab click handler
const handleTabClick = (terminalId: string) => {
  const terminal = terminals.find(t => t.id === terminalId);

  if (terminal?.isDetached) {
    handleReattachTab(terminalId);
  } else {
    setActiveTerminal(terminalId);
  }
};
```

### 5. Tab Rendering (Detach + Close Buttons)

```tsx
// src/SimpleTerminalApp.tsx

{visibleTerminals.map((terminal) => (
  <button
    key={terminal.id}
    className={`tab-button ${
      terminal.id === activeTerminalId ? 'active' : ''
    } ${terminal.isDetached ? 'detached' : ''}`}
    onClick={() => handleTabClick(terminal.id)}
    title={terminal.isDetached
      ? `Detached session (click to reattach)\nSession: ${terminal.sessionName}\nLast active: ${formatRelativeTime(terminal.lastActiveTime)}`
      : terminal.name
    }
  >
    <span className="tab-icon">{terminal.icon || '🖥️'}</span>
    <span className="tab-label">{terminal.name}</span>

    {terminal.isDetached && (
      <span className="tab-time">
        {formatRelativeTime(terminal.lastActiveTime)}
      </span>
    )}

    {!terminal.isDetached && (
      <>
        {/* Detach button */}
        <button
          className="tab-detach-button"
          onClick={(e) => {
            e.stopPropagation();
            handleDetachTab(terminal.id);
          }}
          title="Detach (keep session running)"
        >
          ⊟
        </button>

        {/* Close button (with modifier for kill) */}
        <button
          className="tab-close-button"
          onClick={(e) => {
            e.stopPropagation();
            if (e.shiftKey) {
              // Shift+click: kill session
              handleKillTab(terminal.id);
            } else {
              // Normal click: detach
              handleDetachTab(terminal.id);
            }
          }}
          title={`Close (shift+click to kill session)`}
        >
          ×
        </button>
      </>
    )}
  </button>
))}
```

### 6. Helper: Format Relative Time

```typescript
// src/utils/formatTime.ts

export function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return 'unknown';

  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
```

### 7. Spawn Detached Option

```tsx
// src/components/SpawnMenu.tsx (or modal)

const [spawnDetached, setSpawnDetached] = useState(false);

const handleSpawn = async (option: SpawnOption) => {
  const newTerminal: Terminal = {
    id: `terminal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: option.label,
    terminalType: option.terminalType,
    command: option.command,
    icon: option.icon,
    theme: option.defaultTheme,
    background: option.defaultBackground,
    fontSize: option.defaultSize?.fontSize || 16,
    isDetached: spawnDetached,
    windowId: spawnDetached ? null : currentWindowId,  // Detached = show everywhere
    status: 'spawning',
    createdAt: Date.now(),
  };

  addTerminal(newTerminal);

  // Spawn via backend
  const response = await fetch('http://localhost:8127/api/spawn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: newTerminal.id,
      command: option.command || option.terminalType,
      terminalType: option.terminalType,
      workingDir: option.workingDir,
      // ... other params
    })
  });

  const data = await response.json();

  if (data.success && spawnDetached && data.sessionName) {
    // Immediately detach after spawn
    await fetch(`http://localhost:8127/api/tmux/detach/${data.sessionName}`, {
      method: 'POST'
    });

    updateTerminal(newTerminal.id, {
      sessionName: data.sessionName,
      agentId: undefined  // No WebSocket agent for detached
    });
  }

  closeMenu();
};

return (
  <div className="spawn-menu">
    {/* ... spawn options ... */}

    <label className="spawn-detached-option">
      <input
        type="checkbox"
        checked={spawnDetached}
        onChange={(e) => setSpawnDetached(e.target.checked)}
      />
      Spawn detached (run in background)
    </label>
  </div>
);
```

### 8. Auto-Discovery (Orphaned Sessions)

```typescript
// src/SimpleTerminalApp.tsx

// Sync orphaned tmux sessions every 30 seconds
useEffect(() => {
  const syncOrphanedSessions = async () => {
    try {
      const response = await fetch('http://localhost:8127/api/tmux/sessions');
      const data = await response.json();

      if (!data.success || !data.data?.sessions) return;

      const tmuxSessions: string[] = data.data.sessions;
      const knownSessions = terminals.map(t => t.sessionName).filter(Boolean);

      // Find Tabz sessions (tt-* prefix) not in store
      const orphaned = tmuxSessions.filter(
        (s: string) => s.startsWith('tt-') && !knownSessions.includes(s)
      );

      if (orphaned.length > 0) {
        console.log(`🔍 Found ${orphaned.length} orphaned session(s):`, orphaned);
      }

      // Add orphaned sessions as detached tabs
      for (const sessionName of orphaned) {
        // Parse session name to guess terminal type
        const terminalType = sessionName.split('-')[1] || 'bash';  // tt-bash-xyz → bash

        const terminal: Terminal = {
          id: `terminal-orphan-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: `Orphaned (${sessionName})`,
          terminalType,
          icon: '❓',
          sessionName,
          isDetached: true,
          windowId: null,  // Show in all windows
          status: 'active',
          createdAt: Date.now(),
          lastActiveTime: Date.now(),
        };

        addTerminal(terminal);
      }
    } catch (err) {
      console.error('Failed to sync orphaned sessions:', err);
    }
  };

  // Run immediately on mount
  syncOrphanedSessions();

  // Poll every 30 seconds
  const interval = setInterval(syncOrphanedSessions, 30000);

  return () => clearInterval(interval);
}, [terminals, addTerminal]);  // Re-run when terminals change
```

---

## UX Variants (Close Button Behavior)

### Option A: Two Separate Buttons (Recommended)

```
Active Tab:  [🤖 Claude Code ⊟ ×]
              Detach ↑      ↑ Kill
```

**Pros:**
- Clear, explicit actions
- No modifier keys needed
- Hard to accidentally kill sessions

**Cons:**
- More UI clutter (two buttons per tab)

### Option B: Smart Close Button

```
Active Tab:  [🤖 Claude Code ×]
              Click = Detach
              Shift+Click = Kill
```

**Pros:**
- Cleaner UI (one button)
- Safe default (detach)

**Cons:**
- Less discoverable (need tooltip/docs)
- Modifier keys harder on mobile

### Option C: Setting-Based

```
Settings:
  ☐ Close button kills sessions
  ☑ Close button detaches sessions (default)

Active Tab:  [🤖 Claude Code ×]
              Behavior depends on setting
```

**Pros:**
- User choice
- Clean UI

**Cons:**
- Hidden preference (might forget setting)
- Right-click menu needed for alternate action

---

## Implementation Checklist

### Phase 1: Core Detach/Reattach
- [ ] Add `isDetached`, `lastActiveTime`, `lastAttachedWindowId` to Terminal interface
- [ ] Update `visibleTerminals` filter to show detached tabs in all windows
- [ ] Add CSS for `.tab-button.detached` styling
- [ ] Implement `handleDetachTab()` function
- [ ] Implement `handleReattachTab()` function
- [ ] Update `handleTabClick()` to handle detached tabs
- [ ] Add detach button (⊟) to tab bar
- [ ] Update close button (×) behavior (detach vs kill)
- [ ] Add `formatRelativeTime()` helper
- [ ] Test multi-window: detach in window 1, reattach in window 2

### Phase 2: Spawn Detached
- [ ] Add "Spawn detached" checkbox to spawn menu
- [ ] Update spawn handler to support detached mode
- [ ] Test spawning detached from different windows

### Phase 3: Auto-Discovery
- [ ] Add `/api/tmux/sessions/orphaned` endpoint (optional)
- [ ] Implement `syncOrphanedSessions()` polling (30s interval)
- [ ] Add ❓ icon for orphaned sessions
- [ ] Test: manually create `tmux new -s tt-test`, verify it appears

### Phase 4: Polish
- [ ] Add tooltip showing last active time for detached tabs
- [ ] Add right-click menu: Detach / Kill / Rename
- [ ] Sort detached tabs by `lastActiveTime` (most recent first)
- [ ] Add "Clean up detached" action (kill old sessions)
- [ ] Update CLAUDE.md with new feature documentation

---

## Testing Scenarios

### 1. Basic Detach/Reattach
```bash
# Window 1:
1. Spawn Claude Code terminal
2. Type some commands
3. Click ⊟ (detach)
4. Verify tab becomes grayed out

# Window 2:
5. Verify same grayed-out tab appears
6. Click grayed-out tab
7. Verify it reattaches and shows in Window 2
8. Verify it disappears from Window 1
```

### 2. Spawn Detached
```bash
1. Right-click → Spawn menu
2. Check "Spawn detached"
3. Select Bash
4. Verify grayed-out tab appears in all windows
5. Click tab in any window to reattach
```

### 3. Auto-Discovery
```bash
1. Manually create: tmux new -s tt-test
2. Wait up to 30 seconds
3. Verify ❓ Orphaned (tt-test) tab appears
4. Click to reattach
5. Rename to something meaningful
```

### 4. Multi-Window Edge Cases
```bash
1. Spawn terminal in Window 1
2. Detach in Window 1
3. Reattach in Window 2
4. Detach in Window 2
5. Reattach in Window 1
6. Verify terminal state is consistent
```

---

## Future Enhancements

### 1. Detached Tab Groups
Group detached tabs by project or type:
```
Detached Sessions (3)
  [🤖 Claude Code ⊟]    2h ago
  [🐚 Bash ⊟]           5h ago
  [📊 TFE ⊟]           1d ago
```

### 2. Session Snapshots
Save terminal state when detaching:
- Working directory
- Last command
- Output preview (last 20 lines)

### 3. Batch Operations
```
Right-click detached section:
  → Reattach all
  → Kill all detached sessions older than 1 day
  → Export session list
```

### 4. Notification Badge
Show count of detached sessions in title/icon:
```
Tabz (3 detached) - Browser title
```

---

## Related Files

**Frontend:**
- `src/stores/simpleTerminalStore.ts` - Add new Terminal fields
- `src/SimpleTerminalApp.tsx` - Tab filtering, handlers, rendering
- `src/SimpleTerminalApp.css` - Detached tab styling
- `src/utils/formatTime.ts` - Helper for relative time

**Backend:**
- `backend/routes/api.js` - Detach endpoint (already exists!)
- `backend/routes/api.js` - Optional orphaned sessions endpoint

**Documentation:**
- `CLAUDE.md` - Update with detached sessions feature
- `TMUX_REFERENCE.md` - Reference tmux detach commands

---

## Questions for User

Before implementing, please confirm:

1. **Close button behavior:** Option A (two buttons), B (smart close), or C (setting-based)?

2. **Auto-discovery:** Should orphaned sessions auto-appear, or require manual "Scan for sessions" action?

3. **Detached tab sorting:** Show at end of tab bar, or group in a separate "Detached" section?

4. **Persistence:** Should detached sessions persist in localStorage? (Currently yes, same as active terminals)

5. **Kill detached:** Add bulk "Kill all detached" action in settings?

---

**End of Design Document**
