# Debug: Split Terminal Popout Identity Loss

## Bug Description

When popping out a **split tab** to a new browser window, one of the pane terminals is losing its identity and turning into a different terminal type.

**Observed behavior:**
- Had a split with LazyGit + TFE
- Popped out the split to new window
- LazyGit terminal turned into a TFE terminal
- Original LazyGit tab still exists but is empty/gone

## Investigation Steps

### 1. Check Current State

**Run in browser console (both windows):**

```javascript
// Get all terminals with their key properties
const terminals = JSON.parse(localStorage.getItem('simple-terminal-storage')).state.terminals;

terminals.forEach(t => {
  console.log({
    id: t.id.slice(-8),
    name: t.name,
    sessionName: t.sessionName,
    terminalType: t.terminalType,
    command: t.command,
    agentId: t.agentId?.slice(-8),
    isHidden: t.isHidden,
    windowId: t.windowId,
    splitLayout: t.splitLayout ? {
      type: t.splitLayout.type,
      panes: t.splitLayout.panes.map(p => ({
        terminalId: p.terminalId.slice(-8),
        position: p.position
      }))
    } : null
  });
});
```

**Check active tmux sessions:**

```bash
tmux ls | grep "^tt-"
```

**Look for:**
- Do both LazyGit and TFE have different `sessionName` values?
- Does `terminalType` match the `sessionName` prefix? (tt-lazygit-* should have terminalType: "tui-tool")
- Are there duplicate `sessionName` values?
- Are there orphaned tmux sessions (sessions with no matching terminal)?

### 2. Reproduce the Bug

**Steps to reproduce:**
1. Clear localStorage: `localStorage.removeItem('simple-terminal-storage')`
2. Refresh page
3. Spawn LazyGit terminal
4. Right-click → Split Vertical
5. Spawn TFE in the split
6. Right-click the split tab → Move to New Window (↗)
7. Check localStorage in both windows
8. Check tmux sessions
9. Look for identity swaps

### 3. Monitor Console Logs

**Watch for these specific logs during popout:**

```
[usePopout] Popping out <name> to window: window-...
[usePopout] Step 1: Updating state (windowId=..., detaching X sessions)
[usePopout] Unpacking split: converting to 2 independent tabs
[usePopout] Step 3: Detaching from X tmux sessions via API
[usePopout] ✓ Detached from tmux session: tt-lazygit-xxx
[usePopout] ✓ Detached from tmux session: tt-tfe-yyy
[useWebSocketManager] 📋 Active tmux sessions: [...]
[useWebSocketManager] ⏭️ Skipping split container (panes will reconnect separately): tt-...
[useWebSocketManager] 🔄 Reconnecting to session: tt-lazygit-xxx
[useWebSocketManager] 🔄 Reconnecting to session: tt-tfe-yyy
[useWebSocketManager] ✅ Matched terminal: terminal-...
```

**Red flags:**
- Missing reconnection logs for one of the sessions
- "Matched terminal" pointing to wrong terminal ID
- Session names being reused/duplicated
- Split container sessionName matching a pane's sessionName

### 4. Check Code Areas

**Popout unpacking logic** (`src/hooks/usePopout.ts:68-90`):
```typescript
// Does this correctly preserve sessionName for each pane?
terminal.splitLayout.panes.forEach(pane => {
  updateTerminal(pane.terminalId, {
    agentId: undefined,
    status: 'spawning',
    windowId: newWindowId,
    isHidden: false,
    // Is sessionName being preserved here? ⚠️
  })
})
```

**Property preservation** (`src/hooks/useWebSocketManager.ts:176-196`):
```typescript
// Does this preserve sessionName correctly?
updateTerminal(existingTerminal.id, {
  agentId: message.data.id,
  sessionName: message.data.sessionName,  // ⚠️ Could overwrite!
  // ... other properties
})
```

**Terminal matching logic** (`src/hooks/useWebSocketManager.ts:122-140`):
```typescript
// How does it find the right terminal for a session?
let existingTerminal = pendingSpawns.current.get(message.requestId)
if (!existingTerminal) {
  existingTerminal = storedTerminals.find(t => t.requestId === message.requestId)
}
// Fallback: Check by sessionName? ⚠️
```

## Suspected Issues

### Theory 1: sessionName Collision
The split container might still have the original terminal's `sessionName` (e.g., `tt-lazygit-abc`), but when unpacked, it doesn't get cleared. Then when reconnecting, both the container and a pane might match to the same session.

**Fix:** Clear `sessionName` on split container when unpacking:
```typescript
updateTerminal(terminalId, {
  splitLayout: { type: 'single', panes: [] },
  sessionName: undefined,  // ⚠️ Add this?
})
```

### Theory 2: terminal-spawned Matching Wrong Terminal
When the new window reconnects, the `terminal-spawned` message might be matching to the wrong terminal in localStorage because:
- Multiple terminals have `status: 'spawning'`
- Fallback matching by `terminalType` picks the wrong one
- `requestId` not preserved during popout

**Fix:** Ensure `requestId` is set during reconnection in `handleReconnectTerminal`.

### Theory 3: Property Overwrite During Reconnection
The `terminal-spawned` handler explicitly sets:
```typescript
sessionName: message.data.sessionName
```

If the backend returns the wrong sessionName (or if matching is wrong), this overwrites the correct sessionName with the wrong one.

**Fix:** Only update sessionName if it's undefined:
```typescript
sessionName: existingTerminal.sessionName || message.data.sessionName
```

## Debug Commands

**Capture backend logs during popout:**
```bash
tmux capture-pane -t tabz:backend -p -S -200 | grep -E "Detach|Reconnect|terminal-spawned|tt-lazygit|tt-tfe"
```

**Watch WebSocket messages in browser:**
Open DevTools → Network → WS → Click websocket connection → Messages tab

Look for `terminal-spawned` messages and check:
- `data.id` (agentId)
- `data.sessionName`
- `data.terminalType`
- `requestId`

## Files to Check

1. `src/hooks/usePopout.ts` - Popout and split unpacking logic
2. `src/hooks/useWebSocketManager.ts` - Reconnection and terminal-spawned handling
3. `src/hooks/useTerminalSpawning.ts` - handleReconnectTerminal function
4. `backend/modules/terminal-registry.js` - Backend terminal tracking
5. `backend/modules/unified-spawn.js` - Spawn/reconnect logic

## Expected Outcome

After popout, each pane should:
1. Have its own unique `sessionName` (tt-lazygit-X, tt-tfe-Y)
2. Have its own unique `terminalType` (tui-tool, bash)
3. Reconnect to the correct tmux session
4. Appear as independent tabs in the new window
5. Maintain its identity (LazyGit stays LazyGit, TFE stays TFE)

## Questions to Answer

1. Does the split container have a sessionName that conflicts with a pane?
2. Are sessionNames being preserved during the popout updateTerminal calls?
3. Is the terminal-spawned matching logic picking the right terminal?
4. Are there duplicate terminals in localStorage with the same sessionName?
5. Is the backend creating new sessions or reusing existing ones?

---

**Start debugging by running the console commands above and comparing the output before/after popout.**
