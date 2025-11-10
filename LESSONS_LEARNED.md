# Lessons Learned - Tabz

A living document capturing critical bugs, their root causes, and fixes to prevent future regressions.

---

## Table of Contents

- [Detached Sessions Reattachment Bug (Nov 10, 2025)](#detached-sessions-reattachment-bug-nov-10-2025)
- [Split Terminal & Reconnection Issues (Nov 10, 2025)](#split-terminal--reconnection-issues-nov-10-2025)

---

## Detached Sessions Reattachment Bug (Nov 10, 2025)

### Context
Implemented a detached sessions feature that allows users to detach terminals (keep tmux session running) and reattach them later. Detaching worked perfectly, but clicking a detached tab to reattach got stuck on "Connecting to terminal..." spinner indefinitely. Only a page refresh would reconnect successfully.

### Root Cause Analysis

There were **two critical bugs** preventing reattachment:

#### Bug #1: Backend Removed Terminals from Registry on Detach

```typescript
// backend/modules/terminal-registry.js - closeTerminal()
async closeTerminal(id, force = false) {
  if (terminal.sessionId || terminal.sessionName) {
    if (force) {
      // Kill tmux session
    } else {
      // Just detach from tmux
      await ptyHandler.killPTY(id)
    }
  }

  this.terminals.delete(id)  // ❌ Always removed from registry!
  // ❌ When reattaching, backend can't find terminal to reconnect
}
```

The detach flow:
1. User clicks "Detach" → backend calls `closeTerminal(id, false)`
2. Backend kills PTY but keeps tmux session alive ✓
3. Backend removes terminal from registry ✗
4. User clicks detached tab → tries to reconnect → terminal not in registry → fails

**Evidence from logs:**
```
[TerminalRegistry] Detaching from tmux session (session preserved): tt-bash-7zx
[TerminalRegistry] ✅ Terminal Bash-4 removed from registry  ← Problem!
[UnifiedSpawn] ✅ Returning result: { success: true, ... }
[Server] 📤 unifiedSpawn.spawn() returned: { success: true, ... }
[Server] ✅ Broadcast complete!  ← Backend sent message!
```

But no reconnection because the terminal was gone from registry.

#### Bug #2: Frontend Blocked Duplicate AgentIds

```typescript
// src/hooks/useWebSocketManager.ts - handleWebSocketMessage
case 'terminal-spawned':
  if (message.data) {
    if (processedAgentIds.current.has(message.data.id)) {
      return  // ❌ Blocks ALL messages with same agentId!
    }
    // ... process message
  }
```

The reconnection flow:
1. Terminal spawns with `agentId: abc123` → added to `processedAgentIds`
2. User detaches terminal
3. User clicks to reattach → sends spawn request with **same** `sessionName`
4. Backend reconnects to existing terminal → returns **same** `agentId: abc123`
5. Frontend receives `terminal-spawned` → checks `processedAgentIds` → **blocks it!**

**Evidence from logs:**
```
[useWebSocketManager] 📨 Received terminal-spawned: {
  agentId: '61ea2f3c-35e8-4ea5-8fbb-0371e34249dd',
  requestId: 'reconnect-1762804414324-g0w6gwead',
  name: 'TFE',
  sessionName: 'tt-tfe-i41'
}
[useWebSocketManager] ⏭️ Skipping - agentId already processed: 61ea2f3c-35e8-4ea5-8fbb-0371e34249dd
```

The message was received but rejected because the agentId was already in the set!

### The Fixes

#### Fix #1: Keep Detached Terminals in Backend Registry

```typescript
// backend/modules/terminal-registry.js
async closeTerminal(id, force = false) {
  if (terminal.sessionId || terminal.sessionName) {
    if (force) {
      // FORCE CLOSE (X button): Kill tmux and remove from registry
      execSync(`tmux kill-session -t "${sessionName}"`)
      await ptyHandler.killPTY(id)
      this.terminals.delete(id)
      console.log(`✅ Terminal ${terminal.name} removed from registry`)
    } else {
      // DETACH (power off): Keep session AND keep in registry
      await ptyHandler.killPTY(id)
      terminal.state = 'disconnected'
      console.log(`✅ Terminal ${terminal.name} kept in registry for reconnection`)
      // ✅ Don't delete! Let it reconnect later
    }
  }
}
```

**File:** `backend/modules/terminal-registry.js:564-603`

**Lesson:** Detached terminals must remain in backend registry with `state='disconnected'` so reconnection logic can find and reattach to them.

#### Fix #2: Allow Reprocessing AgentIds During Reconnection

```typescript
// src/hooks/useWebSocketManager.ts
case 'terminal-spawned':
  if (message.data) {
    // Find matching terminal first
    let existingTerminal = pendingSpawns.current.get(message.requestId)
    // ... other fallbacks ...

    // Check if we should skip (moved AFTER finding terminal)
    if (processedAgentIds.current.has(message.data.id) && !existingTerminal) {
      console.log('⏭️ Skipping - agentId already processed and no matching terminal')
      return
    }

    // Allow reprocessing for reconnection
    if (existingTerminal && existingTerminal.status === 'spawning') {
      console.log('🔄 Allowing reprocessing for reconnection:', message.data.id)
      processedAgentIds.current.delete(message.data.id)  // ✅ Remove from set!
    }
    // ... process message normally ...
  }
```

**File:** `src/hooks/useWebSocketManager.ts:124-158`

**Lesson:** Duplicate detection must account for reconnection scenarios. Same agentId should be allowed to be processed again when a terminal is in 'spawning' state (reattaching).

### Why Page Refresh Worked

Page refresh worked because:
1. Frontend cleared `processedAgentIds.current` (new page load)
2. Frontend sent `query-tmux-sessions` and found orphaned session
3. Backend still had terminal in registry (from before our fix)
4. Reconnection succeeded because no agentId was blocked

### Debugging Steps Used

1. **Added debug logging to backend** to trace spawn flow:
   ```typescript
   console.log('[Server] 📥 Calling unifiedSpawn.spawn()')
   console.log('[Server] 📤 unifiedSpawn.spawn() returned:', result)
   console.log('[Server] ✅ Broadcast complete!')
   ```

2. **Added debug logging to frontend** to see message reception:
   ```typescript
   console.log('[useWebSocketManager] 📨 Received terminal-spawned:', message)
   console.log('[useWebSocketManager] ⏭️ Skipping - agentId already processed')
   ```

3. **Checked backend logs** to verify message was sent:
   ```bash
   tmux capture-pane -t tabz:backend -p -S -100 | tail -50
   ```

4. **Checked browser console** to verify message was received but blocked.

### Lesson Summary

**When implementing detach/reattach functionality:**

1. **Backend state:** Detached terminals must stay in registry with `state='disconnected'`. Only remove on force close.

2. **Duplicate detection:** Must account for reconnection scenarios where the same agentId is reused. Move duplicate check after terminal matching.

3. **Debug flow end-to-end:** If backend sends message but frontend doesn't respond, add logging to WebSocket message handler to trace where messages get filtered.

4. **Test both paths:** Test manual reattach (clicking tab) AND automatic reconnect (page refresh). They use different code paths!

---

## Split Terminal & Reconnection Issues (Nov 10, 2025)

### Context
After implementing UX improvements in the `polish` branch (context menus, split enhancements, refresh button), terminals stopped reconnecting properly after page refresh, especially the first terminal in splits.

### Root Cause Analysis

The `polish` branch changed the split terminal architecture:
- **Old (main branch):** Split containers were just UI placeholders with no sessions
- **New (polish branch):** First pane **references the container terminal itself** (`terminalId: splitMode.terminalId`)
- **Critical detail:** Container keeps its `agentId` and `sessionName` for the first pane to use

This architectural change broke multiple reconnection assumptions that worked in `main`.

---

### Bug #1: Split Containers Blocked from Reconnection

**Symptom:** First pane in splits never reconnects after refresh - stuck at "connecting"

**Root Cause:**
```typescript
// useWebSocketManager.ts - Reconnection logic
if (terminal.splitLayout && terminal.splitLayout.type !== 'single') {
  console.log('⏭️ Skipping split container')
  return  // ❌ Blocks ALL containers, including ones with sessions!
}
```

The skip logic assumed split containers never have sessions. But in polish branch, **the container IS the first pane** and holds its session.

**The Fix:**
```typescript
// Only skip HIDDEN containers (panes with their own terminals)
// Allow VISIBLE containers (which hold the first pane's session)
if (terminal.splitLayout && terminal.splitLayout.type !== 'single' && terminal.isHidden) {
  console.log('⏭️ Skipping hidden split container')
  return  // ✅ Only blocks containers that are UI-only
}
```

**File:** `src/hooks/useWebSocketManager.ts:302-306`

**Lesson:** When skip logic exists, always verify assumptions. Architecture changes can invalidate blanket skip rules.

---

### Bug #2: Backend Registry Removal During Popout

**Symptom:** After popping out a terminal, reconnection sometimes failed with "terminal not found"

**Root Cause:**
```typescript
// backend/routes/api.js - Detach API
const terminalToRemove = allTerminals.find(t => t.sessionName === name)
if (terminalToRemove) {
  await terminalRegistry.closeTerminal(terminalToRemove.id, false)
  // ❌ Removes terminal from backend registry BEFORE new window reconnects!
}
```

This created a race condition:
1. Window 1 pops out terminal → calls detach API
2. Detach API removes terminal from backend registry
3. Window 2 opens and tries to reconnect → terminal gone from registry → fails

**The Fix:**
```typescript
// Just detach from tmux, don't remove from registry
execSync(`tmux detach-client -s "${name}" 2>/dev/null || true`)
// ✅ Terminal stays in registry, new window can reconnect
```

**File:** `backend/routes/api.js:800-813` (removed 14 lines)

**Lesson:** When handing off state between windows, don't destroy backend resources prematurely. Let reconnection happen first, cleanup later.

---

### Bug #3: Band-Aid Auto-Fix Treating Symptoms

**Symptom:** Split containers got stuck in 'spawning' status

**Root Cause:** This was a **symptom** of Bug #1 - containers couldn't reconnect because they were being skipped.

**The Band-Aid:**
```typescript
// This ran on EVERY tmux-sessions-list message (multiple times per second!)
storedTerminals.forEach(terminal => {
  if (terminal.splitLayout && terminal.splitLayout.type !== 'single' && terminal.status !== 'active') {
    updateTerminal(terminal.id, { status: 'active' })  // ❌ Force it active without fixing root cause
  }
})
```

**The Fix:**
Removed the band-aid entirely. After fixing Bug #1, containers reconnect properly and don't get stuck.

**File:** `src/hooks/useWebSocketManager.ts:291-297` (removed)

**Lesson:** Band-aids that run frequently (every message, every render) are red flags. Fix the root cause instead of masking symptoms.

---

### Bug #4: Popout Activating Wrong Terminal

**Symptom:** After popping out a split, new window showed blank screen or wrong terminal

**Root Cause:**
```typescript
// usePopout.ts - Opening new window
const url = `?window=${newWindowId}&active=${terminalId}`
// ❌ Activates container ID, but container has no session after unpacking!
```

When splits are unpacked during popout, the container becomes a normal tab with `splitLayout: { type: 'single', panes: [] }`. But the URL still points to the container ID, which has no way to render content.

**The Fix:**
```typescript
// Activate first pane instead of container (pane has the session)
let activeTerminalId = terminalId
if (isSplitContainer && terminal.splitLayout.panes.length > 0) {
  activeTerminalId = terminal.splitLayout.panes[0].terminalId
  console.log('Activating first pane (container has no session)')
}
const url = `?window=${newWindowId}&active=${activeTerminalId}`
// ✅ New window shows terminal with actual content
```

**File:** `src/hooks/usePopout.ts:164-169`

**Lesson:** When unpacking/transforming data structures, update all references. Container ID ≠ pane ID after unpacking.

---

### Bug #5: Container SessionName Cleared During Popout

**Symptom:** First terminal in popped-out split never reconnected - stuck at "connecting" forever

**Root Cause:**
```typescript
// usePopout.ts - Unpacking split for popout
updateTerminal(terminalId, {
  splitLayout: { type: 'single', panes: [] },  // Clear split
  sessionName: isSplitContainer ? undefined : terminal.sessionName,
  // ❌ Clears sessionName thinking container doesn't need it
})
```

The comment said: "Clear sessionName to prevent collision with pane terminals during reconnection."

But this was **wrong** for polish branch architecture! The container **IS** the first pane's terminal. Clearing its sessionName destroyed the session it needed.

**Evidence:**
- `tmux ls` showed session `tt-tfe-g11` exists ✓
- Terminal in localStorage had `sessionName: undefined` ✗
- Reconnection logic couldn't find the session

**The Fix:**
```typescript
updateTerminal(terminalId, {
  splitLayout: { type: 'single', panes: [] },
  sessionName: terminal.sessionName,
  // ✅ Keep it! Container IS the first pane, needs its session
})
```

**File:** `src/hooks/usePopout.ts:81-83`

**Lesson:** Comments can be wrong, especially after architectural changes. Verify assumptions don't just trust old comments.

---

### Bug #6: Multi-Window Trash Not Syncing

**Symptom:** Clicking trash in Window 1 killed all sessions globally, but Window 2's UI didn't update - showed ghost terminals with broken connections

**Root Cause:**
The trash button:
1. Killed ALL tmux sessions (global effect)
2. Cleared localStorage (syncs via Zustand persist)
3. Reloaded current window only

Other windows received the localStorage update (empty terminals array) via Zustand persist, but didn't reload to reflect it. Users saw stale UI with dead terminals.

**The Fix:**
```typescript
// Listen for storage events from other windows
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'simple-terminal-storage' && e.newValue) {
      const newState = JSON.parse(e.newValue)
      // If another window cleared all terminals, reload this window too
      if (newState.state?.terminals?.length === 0 && storedTerminals.length > 0) {
        console.log('🗑️ Detected trash from another window, reloading...')
        setTimeout(() => window.location.reload(), 500)
      }
    }
  }
  window.addEventListener('storage', handleStorageChange)
  return () => window.removeEventListener('storage', handleStorageChange)
}, [storedTerminals.length])
```

**File:** `src/SimpleTerminalApp.tsx:350-370`

**Lesson:** Global destructive actions (killing all sessions) must coordinate across all windows. localStorage sync ≠ UI update without reload.

---

## Key Takeaways

### 1. Architecture Changes Break Assumptions
When you change fundamental architecture (e.g., "first pane IS the container"), audit all code that makes assumptions about the old architecture:
- Skip logic
- Cleanup logic
- Reference handling
- Comments that explain "why"

### 2. Test Reconnection Thoroughly
After any changes to terminal/session handling, test:
- [ ] Normal terminal refresh
- [ ] Split terminal refresh (both panes)
- [ ] Pop out single terminal
- [ ] Pop out split (both panes)
- [ ] Multi-window coordination

### 3. Band-Aids Are Red Flags
Code that runs frequently to "fix" status should trigger investigation:
- Forcing status to 'active' every message? Why isn't it active naturally?
- Clearing/resetting state repeatedly? What's corrupting it?
- setTimeout workarounds? What's the race condition?

Fix root causes, not symptoms.

### 4. Storage Events for Multi-Window Sync
When using localStorage for cross-window state:
- **Zustand persist** syncs state automatically ✓
- **But doesn't trigger re-renders or reloads** ✗
- Use `storage` event listener for coordination
- Destructive actions (clear all) need explicit reload

### 5. Container vs Pane Semantics Matter
In split architecture:
- **Container:** The tab with `splitLayout` property
- **Pane:** Individual terminals inside the split
- **Polish branch twist:** First pane references container ID

When unpacking splits (popout, close), preserve this relationship or create new terminals.

---

## Debugging Checklist

When investigating reconnection issues:

```bash
# 1. Check tmux sessions exist
tmux ls | grep "^tt-"

# 2. Check localStorage has sessionName
# In browser console:
window.terminalStore.getState().terminals.map(t => ({
  name: t.name,
  sessionName: t.sessionName,
  windowId: t.windowId,
  isHidden: t.isHidden,
  splitLayout: t.splitLayout?.type
}))

# 3. Check backend logs for reconnection
tmux capture-pane -t tabz:logs -p -S -200 | grep "Reconnecting"

# 4. Check frontend logs for skip messages
# Browser console: look for "Skipping split container"

# 5. Verify WebSocket ownership
# Backend should show: "Adding terminal owner" for each connection
tmux capture-pane -t tabz:logs -p -S -100 | grep "owner"
```

---

## Template for Future Entries

When adding new lessons:

```markdown
## [Issue Name] ([Date])

### Context
Brief description of what changed or what you were trying to do.

### Root Cause Analysis
What was the actual problem? Include code snippets showing the bug.

### The Fix
What did you change? Include before/after code.

**File:** Path to file and line numbers

**Lesson:** One-sentence takeaway to prevent future occurrences.
```

---

**Last Updated:** November 10, 2025 (Added: Detached Sessions Reattachment Bug)
