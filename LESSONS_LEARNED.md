# Lessons Learned - Tabz

This document captures important debugging lessons, gotchas, and best practices discovered during development.

---

## Refs and State Management

### Lesson: Clear Refs When State Changes (Nov 13, 2025)

**Problem**: Detach/reattach broke because `processedAgentIds` ref wasn't cleared when detaching terminals.

**What Happened:**
1. Terminal detached → `agentId` cleared from state
2. Terminal reattached → Backend returned **same agentId** (reconnecting to same PTY)
3. Frontend checked `processedAgentIds.current.has(agentId)` → returned `true`
4. Frontend ignored `terminal-spawned` message → terminal stuck in "spawning" state forever

**Root Cause**: Refs persist across state changes. When you clear state (`agentId: undefined`), you must also clear related refs.

**Solution**:
```typescript
// When detaching, clear from both state AND ref:
if (terminal.agentId) {
  clearProcessedAgentId(terminal.agentId)  // Clear ref
}
updateTerminal(id, { agentId: undefined })  // Clear state
```

**Key Insight**:
- State (Zustand) = what the terminal is
- Refs (useRef) = what we've processed
- When state changes, check if related refs need updating!

**Files**:
- `src/SimpleTerminalApp.tsx:747-750, 839-842`
- `src/hooks/useWebSocketManager.ts:515-517`

---

## WebSocket Message Types

### Lesson: 'close' vs 'disconnect' - Know Your Destructive Operations (Nov 13, 2025)

**Problem**: Detaching terminals killed their tmux sessions.

**What Happened:**
```typescript
// WRONG - This KILLS the tmux session!
wsRef.current.send(JSON.stringify({
  type: 'close',
  terminalId: terminal.agentId,
}))
```

**Root Cause**: Backend has two close behaviors:
- `case 'disconnect'`: Graceful disconnect, keep tmux session alive
- `case 'close'`: **Force close and KILL tmux session** (backend/server.js:254)

**Solution**: For detach, only call the API endpoint - don't send WebSocket message:
```typescript
// CORRECT - Let PTY disconnect naturally
await fetch(`/api/tmux/detach/${sessionName}`, { method: 'POST' })
// Don't send WebSocket 'close' message!
```

**Key Insight**:
- Read backend code to understand what each message type does
- "Close" often means "destroy" in WebSocket contexts
- For non-destructive operations, use API endpoints only

**Files**:
- `backend/server.js:240-256` - Close message handler
- `backend/routes/api.js:714-744` - Safe detach endpoint
- `src/SimpleTerminalApp.tsx:743-744, 833-835` - Removed close messages

---

## Debugging Patterns

### Pattern: Add Diagnostic Logging Before Fixing

When debugging complex state issues, add comprehensive logging first:

```typescript
// BEFORE fixing, add logging to understand the problem:
console.log('[useWebSocketManager] 📨 Received terminal-spawned:', {
  agentId: message.data.id,
  requestId: message.requestId,
  sessionName: message.data.sessionName,
  pendingSpawnsSize: pendingSpawns.current.size
})

// Log each fallback attempt:
if (!existingTerminal) {
  existingTerminal = storedTerminals.find(t => t.requestId === message.requestId)
  console.log('[useWebSocketManager] 🔍 Checking by requestId:', existingTerminal ? 'FOUND' : 'NOT FOUND')
}
```

**Benefits**:
1. Shows exactly which code path is executing
2. Reveals data mismatches (wrong ID, missing state, etc.)
3. Helps users self-diagnose issues
4. Can be left in for production debugging

**Files**: `src/hooks/useWebSocketManager.ts:118-157`

---

## Multi-Step State Changes

### Pattern: Handle All Side Effects When Changing State

When a state change affects multiple systems, update all of them:

**Checklist for Terminal State Changes**:
- [ ] Update Zustand state (terminal properties)
- [ ] Clear/update refs (processedAgentIds, pending spawns)
- [ ] Notify WebSocket (if needed)
- [ ] Clean up event listeners
- [ ] Update localStorage (if using persist)

**Example (Detach)**:
```typescript
// 1. API call
await fetch(`/api/tmux/detach/${sessionName}`, { method: 'POST' })

// 2. Clear ref (DON'T FORGET THIS!)
if (terminal.agentId) {
  clearProcessedAgentId(terminal.agentId)
}

// 3. Update state
updateTerminal(id, {
  status: 'detached',
  agentId: undefined,
})
```

**Anti-Pattern**: Only updating state and forgetting side effects.

---

## Session Naming & Reconnection

### Pattern: Use Consistent Session Identifiers

**Lesson**: When reconnecting, the backend needs to find the existing PTY. Use the existing `sessionName` (not a new one):

```typescript
// CORRECT - Reconnect to existing session
const config = {
  sessionName: terminal.sessionName,  // Use existing!
  resumable: true,
  useTmux: true,
}

// WRONG - Would create new session
const config = {
  sessionName: generateNewSessionName(),  // DON'T DO THIS
}
```

**Key Insight**: Tmux sessions have stable names. Use them as the source of truth for reconnection.

**Files**: `src/hooks/useTerminalSpawning.ts:246-247`

---

## Testing Detach/Reattach

### Checklist: How to Verify Detach Works Correctly

```bash
# 1. Spawn terminal
# Right-click → spawn Claude Code

# 2. Detach
# Right-click tab → Detach

# 3. Verify session survived
tmux ls | grep tt-cc-
# Should show: tt-cc-xxx: 1 windows (created ...) (attached)

# 4. Reattach
# Click detached tab

# 5. Check console logs (should see):
# [SimpleTerminalApp] Detaching from tmux session: tt-cc-xxx
# [SimpleTerminalApp] Clearing processedAgentId: 1810f662
# [SimpleTerminalApp] ✓ Detached from session: tt-cc-xxx
# [useWebSocketManager] 📨 Received terminal-spawned: {...}
# [useWebSocketManager] 🔍 Checking pendingSpawns: FOUND
# [useWebSocketManager] ✅ Matched terminal: terminal-xxx

# 6. Terminal should be active and responsive immediately
```

---

## Split Terminal Operations

### Scenario: Closing vs Detaching Panes

**Split Container with 2 panes: Claude Code (left) + Bash (right)**

#### Closing a Pane (X button):
```
1. Find split container
2. Remove pane from split.panes array
3. If only 1 pane left → convert to single terminal
4. Send WebSocket 'close' → KILLS tmux session
5. removeTerminal() → removes from localStorage
Result: Pane gone forever, tmux session destroyed
```

#### Detaching a Pane (Right-click → Detach):
```
1. Find split container
2. Remove pane from split.panes array
3. If only 1 pane left → convert to single terminal
4. Call /api/tmux/detach → keeps tmux session alive
5. Mark pane as 'detached' → stays in localStorage
Result: Pane becomes detached tab, tmux session survives, can reattach
```

#### Detaching Whole Container (Right-click container → Detach):
```
1. Detach ALL panes in split
2. Mark each pane as 'detached'
3. Mark container as 'detached'
4. Preserve splitLayout
Result: All panes detached, split layout preserved, can reattach and restore split
```

**Key Difference**:
- Close = permanent deletion + kills tmux
- Detach = temporary suspension + preserves tmux

### Bug: Clicking Detached Pane Tab Only Reattached One Terminal (Nov 13, 2025)

**Problem**: After detaching a split, clicking on a **pane tab** (not container) only reconnected that one pane as a single terminal. The split was lost.

**What Happened**:
```
1. Detach split → creates 3 detached tabs:
   - Pane 1 (detached)
   - Pane 2 (detached)
   - Container (detached, with splitLayout preserved)

2. Click Pane 1 tab to reattach
3. handleReattachTerminal(pane1.id) called
4. Code checked: is this a split container? NO
5. Reconnected as single terminal (no split!)
6. SplitLayout waiting for other pane → stuck "Waiting for agents"
```

**Root Cause**: Code didn't check if the terminal being reattached was a PANE in a detached split. It only checked if the terminal itself was a container.

**Solution**: Before reattaching, check if terminal is part of a detached split container. If yes, reattach the container instead:

```typescript
// Check if this terminal is a PANE in a detached split
const detachedSplitContainer = storedTerminals.find(t =>
  t.status === 'detached' &&
  t.splitLayout?.type !== 'single' &&
  t.splitLayout?.panes.some(p => p.terminalId === terminalId)
)

if (detachedSplitContainer) {
  // Reattach the whole container, which reattaches all panes
  return handleReattachTerminal(detachedSplitContainer.id)
}
```

**Result**: Clicking any detached pane tab now restores the entire split with all panes!

**Files**: `src/SimpleTerminalApp.tsx:864-878`

---

## React Hooks & Refactoring

### Lesson: Identify Shared Refs Before Extracting Hooks (Nov 10, 2025)

**Problem:** After extracting `useWebSocketManager` hook, all terminal input stopped working. Typing, TUI tools, everything was broken.

**Root Cause:** Hook created its own internal `wsRef` instead of using the shared one from parent component. Terminal components had `null` WebSocket reference.

**Key Insight:**
- **Identify shared refs BEFORE extracting hooks**:
  - If a ref is used by both hook AND child components → pass as parameter
  - WebSocket refs, DOM refs, library instance refs must be shared
  - **Rule:** If a ref is used by both the hook AND child components, pass it as a parameter!

**Wrong Approach:**
```typescript
// WRONG - creates new ref
export function useWebSocketManager(...) {
  const wsRef = useRef<WebSocket | null>(null)
  // Hook creates its own WebSocket
}

// Parent component passes different ref to children
<Terminal wsRef={wsRef} />  // Terminal gets null!
```

**Right Approach:**
```typescript
// RIGHT - uses shared ref
export function useWebSocketManager(
  wsRef: React.MutableRefObject<WebSocket | null>,  // Pass as parameter
  ...
) {
  // Hook uses parent's ref, all components share same WebSocket
}
```

**Prevention:**
- Map out all refs before refactoring (diagram which components use which refs)
- Check if ref is used outside the hook
- Test with real usage immediately after extraction:
  ```bash
  npm run build              # 1. Check TypeScript
  # Open http://localhost:5173
  # Spawn terminal            # 2. Test spawning
  # Type in terminal          # 3. Test input (WebSocket)
  # Resize window             # 4. Test resize
  # Spawn TUI tool            # 5. Test complex interactions
  ```

**Files to Remember:**
- `src/hooks/useWebSocketManager.ts` - wsRef parameter pattern
- `src/SimpleTerminalApp.tsx` - Parent passes wsRef to hook

---

### Lesson: useEffect Dependencies Must Include ref.current for Initialization (Nov 10, 2025)

**Problem:** Terminals stayed at tiny size after refactoring resize logic.

**Root Cause:** ResizeObserver setup had early return if `terminalRef.current` was null, but `terminalRef.current` wasn't in dependency array. If null at mount, ResizeObserver was NEVER set up.

**Key Insight:**
- **Early returns need corresponding dependencies**:
  ```typescript
  // WRONG - only runs once, may return early forever
  useEffect(() => {
    if (!terminalRef.current) return  // Returns if null
    // Setup ResizeObserver
  }, [])  // Never re-runs!

  // RIGHT - re-runs when ref becomes available
  useEffect(() => {
    if (!terminalRef.current) return
    // Setup ResizeObserver
  }, [terminalRef.current])  // Re-runs when ref changes!
  ```

**Prevention:**
- If useEffect checks a ref and returns early → add `ref.current` to dependencies
- Test initialization timing (refs may be null on first render)
- Use React DevTools to verify effects re-run when expected
- Common pattern: Wait for DOM refs AND library instances (xterm) before setup

**Files to Remember:**
- `src/hooks/useTerminalResize.ts` - ResizeObserver retry pattern

---

### Lesson: Test Real Usage Immediately After Refactoring (Nov 10, 2025)

**Problem:** TypeScript compiled successfully after refactoring, but terminals were completely broken in production.

**Key Insight:**
- **TypeScript compilation ≠ working code** - Always test with real usage:
  ```bash
  # After refactoring:
  npm run build              # 1. Check TypeScript
  # Open http://localhost:5173
  # Spawn terminal            # 2. Test spawning
  # Type in terminal          # 3. Test input (WebSocket)
  # Resize window             # 4. Test resize (ResizeObserver)
  # Spawn TUI tool            # 5. Test complex interactions
  ```

**Refactoring Checklist:**
- [ ] TypeScript compilation succeeds
- [ ] Spawn a terminal (test spawning logic)
- [ ] Type in terminal (test WebSocket communication)
- [ ] Resize window (test ResizeObserver)
- [ ] Spawn TUI tool like htop (test complex ANSI sequences)
- [ ] Check browser console for errors
- [ ] Check backend logs via `tmux capture-pane -t tabz:backend -p -S -50`
- [ ] Run test suite: `npm test`

**Prevention:**
- Don't batch multiple hook extractions (extract one, test, commit)
- Create refactoring checklist and follow it religiously
- If something breaks, rollback immediately and extract smaller pieces

---

**Last Updated**: November 13, 2025
