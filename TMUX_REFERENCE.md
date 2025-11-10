# Tmux API Reference for Tabz Integration

**Last Updated**: November 10, 2025
**Purpose**: Reference guide for tmux features that could be incorporated into Tabz

---

## Table of Contents

1. [Session Management](#session-management)
2. [Window Management](#window-management)
3. [Pane Management](#pane-management)
4. [Copy Mode](#copy-mode)
5. [Control Mode (Programmatic API)](#control-mode-programmatic-api)
6. [Implementation Recommendations](#implementation-recommendations)

---

## Session Management

| Feature | Hotkey | Command | Tabz Status | Priority |
|---------|--------|---------|-------------|----------|
| **Create session** | — | `tmux new -s <name>` | ✅ Implemented | — |
| **List sessions** | `Ctrl+b s` | `tmux ls` | ✅ Implemented | — |
| **Attach to session** | — | `tmux attach -t <name>` | ✅ Implemented | — |
| **Detach from session** | `Ctrl+b d` | — | ✅ Auto-managed | — |
| **Rename session** | `Ctrl+b $` | `:rename-session <name>` | ❌ Not implemented | 🟡 Medium |
| **Kill session** | — | `tmux kill-session -t <name>` | ✅ Implemented | — |
| **Previous session** | `Ctrl+b (` | `:switch-client -p` | ❌ Not implemented | 🟢 Low |
| **Next session** | `Ctrl+b )` | `:switch-client -n` | ❌ Not implemented | 🟢 Low |
| **Session preview** | `Ctrl+b w` | — | ❌ Not implemented | 🟡 Medium |

### Implementation Notes
- **Session preview** (`Ctrl+b w`): Could add a visual picker showing all active sessions with terminal previews
- **Rename session**: Useful for organizing long-running sessions (e.g., project names)
- Session switching less relevant since Tabz uses browser tabs

---

## Window Management

| Feature | Hotkey | Command | Tabz Status | Priority |
|---------|--------|---------|-------------|----------|
| **Create window** | `Ctrl+b c` | `tmux new-window` | ✅ Spawn menu | — |
| **List windows** | `Ctrl+b w` | `tmux list-windows` | ✅ Tab bar | — |
| **Rename window** | `Ctrl+b ,` | `tmux rename-window <name>` | ✅ Implemented | — |
| **Close window** | `Ctrl+b &` | `tmux kill-window` | ✅ Close tab | — |
| **Previous window** | `Ctrl+b p` | `:previous-window` | ❌ No shortcut | 🔴 High |
| **Next window** | `Ctrl+b n` | `:next-window` | ❌ No shortcut | 🔴 High |
| **Select window by number** | `Ctrl+b 0-9` | `:select-window -t <n>` | ❌ No shortcut | 🔴 High |
| **Toggle last window** | `Ctrl+b l` | `:last-window` | ❌ Not implemented | 🟡 Medium |
| **Swap windows** | — | `:swap-window -s 2 -t 1` | ❌ Not implemented | 🟡 Medium |
| **Move window** | — | `:move-window -s <src> -t <target>` | ✅ Multi-window | — |
| **Reorder windows** | — | `:move-window -r` | ❌ Not implemented | 🟡 Medium |

### Implementation Notes
- **Keyboard shortcuts**: `Ctrl+Tab` / `Ctrl+Shift+Tab` for next/previous
- **Number shortcuts**: `Alt+1-9` for direct tab selection (browser-style)
- **Reorder windows**: Drag-to-reorder tabs (currently only drag-to-split)
- **Swap windows**: Right-click menu option to swap tab positions

---

## Pane Management

| Feature | Hotkey | Command | Tabz Status | Priority |
|---------|--------|---------|-------------|----------|
| **Split vertical** | `Ctrl+b %` | `:split-window -h` | ✅ Split button | — |
| **Split horizontal** | `Ctrl+b "` | `:split-window -v` | ✅ Split button | — |
| **Navigate panes** | `Ctrl+b ↑↓←→` | `:select-pane -<U\|D\|L\|R>` | ❌ Mouse only | 🔴 High |
| **Toggle last pane** | `Ctrl+b ;` | `:last-pane` | ❌ Not implemented | 🟡 Medium |
| **Move pane left** | `Ctrl+b {` | `:swap-pane -U` | ❌ Not implemented | 🟢 Low |
| **Move pane right** | `Ctrl+b }` | `:swap-pane -D` | ❌ Not implemented | 🟢 Low |
| **Cycle layouts** | `Ctrl+b Space` | `:next-layout` | ❌ Not implemented | 🟡 Medium |
| **Switch to next pane** | `Ctrl+b o` | `:select-pane -t :.+` | ❌ Not implemented | 🟡 Medium |
| **Show pane numbers** | `Ctrl+b q` | `:display-panes` | ❌ Not implemented | 🟢 Low |
| **Zoom pane** | `Ctrl+b z` | `:resize-pane -Z` | ❌ Not implemented | 🔴 High |
| **Break pane to window** | `Ctrl+b !` | `:break-pane` | ✅ Pop-out button | — |
| **Resize pane** | `Ctrl+b Ctrl+↑↓←→` | `:resize-pane -<U\|D\|L\|R>` | ✅ Drag divider | — |
| **Close pane** | `Ctrl+b x` | `:kill-pane` | ✅ Close button | — |
| **Join panes** | — | `:join-pane -s 2 -t 1` | ❌ Not implemented | 🟡 Medium |
| **Synchronize panes** | — | `:setw synchronize-panes` | ❌ Not implemented | 🟡 Medium |

### Implementation Notes
- **Zoom pane** (`Ctrl+b z`): Toggle focused pane to full screen (hide other panes temporarily)
- **Keyboard navigation**: Arrow keys to switch between panes (currently mouse-only)
- **Cycle layouts**: Preset layouts like even-horizontal, even-vertical, main-vertical, tiled
- **Synchronize panes**: Send input to all panes at once (useful for multi-server commands)
- **Join panes**: Merge panes from different tabs into one split view

---

## Copy Mode

| Feature | Hotkey | Command | Tabz Status | Priority |
|---------|--------|---------|-------------|----------|
| **Enter copy mode** | `Ctrl+b [` | `:copy-mode` | ❌ Not implemented | 🟡 Medium |
| **Scroll page up** | `Ctrl+b PgUp` | `:copy-mode -u` | ❌ Not implemented | 🟡 Medium |
| **Vi-style movement** | `hjkl` | — | ❌ Not implemented | 🟢 Low |
| **Search forward/back** | `/` or `?` | — | ❌ Not implemented | 🟡 Medium |
| **Start selection** | `Space` | — | ❌ Not implemented | 🟡 Medium |
| **Copy selection** | `Enter` | — | ❌ Not implemented | 🟡 Medium |
| **Paste buffer** | `Ctrl+b ]` | `:paste-buffer` | ❌ Not implemented | 🟡 Medium |
| **Capture pane** | — | `tmux capture-pane -p` | ✅ Backend only | — |
| **List buffers** | — | `:list-buffers` | ❌ Not implemented | 🟢 Low |
| **Save buffer** | — | `:save-buffer <file>` | ❌ Not implemented | 🟢 Low |

### Implementation Notes
- **Copy mode**: Tabz relies on native terminal selection (xterm.js built-in)
- **Search**: Could add `Ctrl+F` search overlay using xterm-addon-search
- **Paste buffer**: Browser clipboard integration via `navigator.clipboard`
- **Capture pane**: Already used for Dev Logs terminal

---

## Control Mode (Programmatic API)

### Overview

Control mode is tmux's text-based protocol for programmatic interaction. Tabz currently uses command-line tmux (not control mode).

### Entering Control Mode

```bash
# For testing (canonical mode, echo enabled)
tmux -C attach-session -t <name>

# For applications (canonical mode disabled)
tmux -CC attach-session -t <name>
```

### Command/Response Format

**Success:**
```
%begin [timestamp] [command-number] [flags]
<command output>
%end [timestamp] [command-number] [flags]
```

**Failure:**
```
%begin [timestamp] [command-number] [flags]
<error message>
%error
```

### Key Control Mode Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `list-sessions` | Get all sessions | `tmux -C list-sessions` |
| `list-windows -t <session>` | Get windows in session | `tmux -C list-windows -t mysession` |
| `list-panes -t <window>` | Get panes in window | `tmux -C list-panes -t mysession:0` |
| `show-options` | Get configuration | `tmux -C show-options -g` |
| `send-keys <keys>` | Send input to pane | `tmux -C send-keys -t %0 "ls" Enter` |
| `refresh-client -C <w>x<h>` | Set client size | `tmux -C refresh-client -C 80x24` |
| `refresh-client -f <flags>` | Set flags | `tmux -C refresh-client -f no-output` |
| `refresh-client -B <name>:<type>:<format>` | Subscribe to changes | `tmux -C refresh-client -B "win:window:#{window_id}"` |

### Asynchronous Notifications

Control mode sends notifications prefixed with `%`:

| Notification | Description |
|--------------|-------------|
| `%output <pane-id> <data>` | Terminal output from pane |
| `%window-add <window-id>` | New window created |
| `%window-close <window-id>` | Window closed |
| `%window-renamed <window-id> <name>` | Window renamed |
| `%session-changed <session-id>` | Session switched |
| `%sessions-changed` | Session list changed |
| `%pane-mode-changed <pane-id>` | Pane mode changed (copy mode, etc.) |
| `%pause` | Flow control: pause output |
| `%continue` | Flow control: resume output |

### Flow Control

Enable flow control to prevent buffer overflow:

```bash
# Pause output after 5 seconds
tmux refresh-client -f pause-after=5

# Resume paused panes
tmux refresh-client -A
```

### Format Subscriptions

Subscribe to property changes for real-time updates:

```bash
# Subscribe to window name changes
tmux refresh-client -B "winname:window:#{window_name}"

# Backend sends notification when window name changes:
# %subscription-changed winname <window-id> <new-name>
```

### Control Mode vs Command-Line (Tabz Current Approach)

| Aspect | Control Mode (`-C`) | Command-Line (Tabz) |
|--------|---------------------|---------------------|
| **Protocol** | Text protocol with notifications | One-off commands via exec |
| **Real-time updates** | ✅ Push notifications | ❌ Polling required |
| **Complexity** | 🔴 High (parser, state sync) | 🟢 Low (simple exec) |
| **Performance** | ✅ Efficient for frequent ops | ❌ Spawns process each time |
| **Best for** | Long-lived daemon, IDE integration | Simple scripts, infrequent ops |

### Should Tabz Use Control Mode?

**Pros:**
- Real-time notifications for session/window/pane changes
- More efficient for high-frequency operations
- Structured output (easier to parse)

**Cons:**
- Adds complexity (requires parser + state synchronization)
- Tabz already has WebSocket for real-time terminal I/O
- Current approach works well for infrequent operations (spawn, detach, list)

**Recommendation:** 🟢 **Keep current approach** unless adding features requiring frequent tmux queries (e.g., live session monitoring dashboard).

---

## Implementation Recommendations

### Priority 1: Keyboard Shortcuts (High Impact, Low Effort)

**Tab Navigation:**
```typescript
// src/hooks/useKeyboardShortcuts.ts (already exists)
case 'Tab':
  if (e.ctrlKey && !e.shiftKey) {
    e.preventDefault()
    // Next tab: (activeIndex + 1) % terminals.length
  }
  if (e.ctrlKey && e.shiftKey) {
    e.preventDefault()
    // Previous tab: (activeIndex - 1 + terminals.length) % terminals.length
  }
  break

// Alt+1-9 for direct tab selection
case '1': case '2': case '3': case '4': case '5':
case '6': case '7': case '8': case '9':
  if (e.altKey) {
    e.preventDefault()
    const index = parseInt(e.key) - 1
    if (terminals[index]) setActiveTerminal(terminals[index].id)
  }
  break
```

**Pane Navigation:**
```typescript
// Arrow keys to switch panes (when in split view)
case 'ArrowUp':
case 'ArrowDown':
case 'ArrowLeft':
case 'ArrowRight':
  if (e.ctrlKey && e.altKey && hasSplitPanes) {
    e.preventDefault()
    // Navigate to adjacent pane based on direction
  }
  break
```

**Pane Zoom:**
```typescript
case 'z':
  if (e.ctrlKey && e.altKey) {
    e.preventDefault()
    // Toggle zoom on focused pane
    togglePaneZoom(focusedTerminalId)
  }
  break
```

---

### Priority 2: Pane Zoom (High Impact, Medium Effort)

**Feature:** Toggle focused pane to full screen (like `Ctrl+b z`)

**Implementation:**
```typescript
// src/stores/simpleTerminalStore.ts
interface Terminal {
  // ... existing fields
  isZoomed?: boolean  // New field
}

// src/components/SplitLayout.tsx
const SplitLayout = ({ terminal, ... }) => {
  const focusedPane = useMemo(() => {
    if (terminal.splitLayout.type === 'single') return terminal
    // Find zoomed pane
    const zoomed = terminal.splitLayout.panes.find(p =>
      terminals.find(t => t.id === p.terminalId)?.isZoomed
    )
    if (zoomed) return terminals.find(t => t.id === zoomed.terminalId)
    // Otherwise return focused pane
    return terminals.find(t => t.id === focusedTerminalId)
  }, [terminal, terminals, focusedTerminalId])

  if (focusedPane?.isZoomed) {
    // Render only the zoomed pane (full screen)
    return <Terminal terminal={focusedPane} ... />
  }

  // Normal split rendering
  return <div className="split-container">...</div>
}
```

**UI:**
- Hotkey: `Ctrl+Alt+Z` (or `Ctrl+b z` in tmux mode)
- Button: Add 🔍 button to split pane footer
- Visual indicator: Dim border or overlay on zoomed pane

---

### Priority 3: Tab Reordering (Medium Impact, Medium Effort)

**Feature:** Drag tabs to reorder (browser-style)

**Implementation:**
```typescript
// Use react-beautiful-dnd or @dnd-kit/core
import { DndContext, closestCenter, ... } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, ... } from '@dnd-kit/sortable'

const TabBar = () => {
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = terminals.findIndex(t => t.id === active.id)
      const newIndex = terminals.findIndex(t => t.id === over.id)
      reorderTerminals(oldIndex, newIndex)  // New store action
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={terminals.map(t => t.id)}>
        {terminals.map(terminal => (
          <SortableTab key={terminal.id} terminal={terminal} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

**Note:** Must not conflict with existing drag-to-split functionality!

---

### Priority 4: Copy Mode / Search (Medium Impact, High Effort)

**Feature:** Searchable terminal output with keyboard shortcuts

**Implementation:**
```typescript
// Use xterm-addon-search
import { SearchAddon } from '@xterm/addon-search'

const Terminal = ({ ... }) => {
  const searchAddonRef = useRef<SearchAddon>()

  useEffect(() => {
    if (!xtermRef.current) return
    const searchAddon = new SearchAddon()
    xtermRef.current.loadAddon(searchAddon)
    searchAddonRef.current = searchAddon
  }, [])

  const handleSearch = (query: string, options?: {
    caseSensitive?: boolean
    wholeWord?: boolean
    regex?: boolean
  }) => {
    searchAddonRef.current?.findNext(query, options)
  }
}
```

**UI:**
- Hotkey: `Ctrl+F` to open search overlay
- Overlay component: `<SearchOverlay terminal={terminal} />`
- Features: Find next/previous, case-sensitive, regex, highlight all

---

### Priority 5: Cycle Layouts (Low Impact, Medium Effort)

**Feature:** Preset split layouts like tmux's `Ctrl+b Space`

**Layouts:**
1. **Even Horizontal**: All panes side-by-side, equal width
2. **Even Vertical**: All panes stacked, equal height
3. **Main Vertical**: One large left pane, others stacked on right
4. **Main Horizontal**: One large top pane, others side-by-side below
5. **Tiled**: Grid layout (2x2, 3x3, etc.)

**Implementation:**
```typescript
const cycleLayout = (terminal: Terminal) => {
  const layouts = ['even-horizontal', 'even-vertical', 'main-vertical', 'main-horizontal', 'tiled']
  const currentIndex = layouts.indexOf(terminal.currentLayout || 'even-horizontal')
  const nextLayout = layouts[(currentIndex + 1) % layouts.length]

  updateTerminal(terminal.id, {
    currentLayout: nextLayout,
    splitLayout: calculateSplitLayout(terminal.splitLayout.panes, nextLayout)
  })
}

const calculateSplitLayout = (panes: Pane[], layout: string): SplitLayout => {
  switch (layout) {
    case 'even-horizontal':
      return { type: 'horizontal', panes, sizes: panes.map(() => 100 / panes.length) }
    case 'even-vertical':
      return { type: 'vertical', panes, sizes: panes.map(() => 100 / panes.length) }
    case 'main-vertical':
      return {
        type: 'horizontal',
        panes,
        sizes: [50, ...panes.slice(1).map(() => 50 / (panes.length - 1))]
      }
    // ... etc
  }
}
```

**UI:**
- Button: ⚡ button in split terminal footer
- Hotkey: `Ctrl+Alt+Space`

---

### Priority 6: Synchronize Panes (Low Impact, Low Effort)

**Feature:** Send input to all panes at once (like `:setw synchronize-panes`)

**Implementation:**
```typescript
// src/stores/simpleTerminalStore.ts
interface Terminal {
  isSyncEnabled?: boolean  // New field for split containers
}

// src/SimpleTerminalApp.tsx
const handleTerminalInput = (terminalId: string, data: string) => {
  const terminal = terminals.find(t => t.id === terminalId)

  // If sync enabled and this is a split container
  if (terminal?.isSyncEnabled && terminal.splitLayout?.panes.length > 0) {
    terminal.splitLayout.panes.forEach(pane => {
      const paneTerminal = terminals.find(t => t.id === pane.terminalId)
      if (paneTerminal?.agentId) {
        wsRef.current?.send(JSON.stringify({
          type: 'input',
          id: paneTerminal.agentId,
          data
        }))
      }
    })
  } else {
    // Normal single terminal input
    if (terminal?.agentId) {
      wsRef.current?.send(JSON.stringify({
        type: 'input',
        id: terminal.agentId,
        data
      }))
    }
  }
}
```

**UI:**
- Button: 🔗 toggle button in split terminal footer
- Visual indicator: Border color changes when sync enabled
- Hotkey: `Ctrl+Alt+S`

---

## Summary

### Quick Wins (Implement First)
1. ✅ **Keyboard shortcuts** - `Ctrl+Tab`, `Alt+1-9` for tab navigation
2. ✅ **Pane zoom** - `Ctrl+Alt+Z` to maximize focused pane
3. ✅ **Pane navigation** - Arrow keys to switch between split panes

### High Value Features (Implement Next)
4. ✅ **Tab reordering** - Drag tabs to reorder (must not conflict with drag-to-split)
5. ✅ **Search** - `Ctrl+F` overlay using xterm-addon-search
6. ✅ **Synchronize panes** - Toggle to send input to all panes

### Nice-to-Have (Future)
7. 🟢 **Cycle layouts** - Preset split arrangements
8. 🟢 **Session preview** - Visual picker for all tmux sessions
9. 🟢 **Copy mode** - Vi-style buffer navigation (lower priority, xterm selection works)

### Not Recommended
- ❌ **Control mode migration** - Current approach works well
- ❌ **Tmux session switching** - Browser tabs handle this better
- ❌ **Pane swapping** - Drag-to-split + reorder is more intuitive

---

## Related Documentation

- **Tmux Manual**: `man tmux` or https://man7.org/linux/man-pages/man1/tmux.1.html
- **Tmux Cheat Sheet**: https://tmuxcheatsheet.com/
- **Control Mode Wiki**: https://github.com/tmux/tmux/wiki/Control-Mode
- **xterm.js Addons**: https://xtermjs.org/docs/api/addons/

---

**End of Reference**
