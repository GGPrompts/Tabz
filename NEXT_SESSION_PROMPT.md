# Terminal Sizing & Multiple PTY Attachment Issues - Session Status

**Date:** 2025-11-15
**Branch:** terminal-tabs-tmux-only (experimental)
**Status:** Multiple critical bugs - NOT PRODUCTION READY

---

## 🐛 Current Critical Issues

### 1. **Multiple PTY Attachments to Same Tmux Session** ❌
**Symptom:** White dots fill screen below 800x600 window. Visual artifacts everywhere.

**What User Sees:**
- In app: Both 800x600 window AND fullscreen window visible with tmux status bars
- Area below 800x600 filled with white dots
- Cursor appears in wrong locations

**What's Actually Happening:**
```bash
$ tmux list-clients
/dev/pts/9: 154 [88x35] (attached)     ← Original spawn
/dev/pts/10: 154 [378x75] (attached)   ← First resize
/dev/pts/11: 154 [309x75] (attached)   ← Second resize
```
**THREE PTY clients** attached to ONE tmux session!

**Attempted Fix:** Added PTY cleanup in `pty-handler.js:181-189` - **DOES NOT WORK**

---

### 2. **Commands Not Executing** ❌
**Symptom:** Spawning TFE shows bash prompt instead of running `tfe`.

**In tmux session:**
```
matt@MattDesktop:~/projects/terminal-tabs$ bash
matt@MattDesktop:~/projects/terminal-tabs$
```

**Should be:** TFE file explorer running immediately

**Config is correct:**
- Frontend sends: `{ command: "tfe", terminalType: "tui-tool" }`
- Backend logs: `"command": "tfe"` received
- autoExecuteCommand should write `"tfe\n"` to PTY

**Root cause unknown** - timing issue? PTY not ready? Command lost in attach?

---

### 3. **Terminal Stuck at 800x600** ❌
**Symptom:** Terminal doesn't fill window despite ResizeObserver working.

**Dimensions:**
- Container: 3056px x 1230px ✅
- xterm fits to: 378 cols x 75 rows ✅
- Tmux session: 88 cols x 35 rows ❌ (800x600)

**Why:** Multiple tmux clients force session to smallest common size (800x600)

---

## ✅ Fixes Applied (Nov 15, 2025)

### 1. Disabled React.StrictMode
**File:** `src/main.tsx:18`
**Problem:** Double mount in dev → duplicate terminals → double typing
**Result:** ✅ No more double typing

### 2. Debounced ResizeObserver
**File:** `src/hooks/useTerminalInstance.ts:150-182`
**Problem:** Feedback loop causing infinite shrinking
**Result:** ✅ Terminal no longer shrinks continuously

### 3. Auto-Resize After Attach
**File:** `src/components/MinimalTerminalView.tsx:140-165`
**Problem:** Terminal connects but tmux not resized
**Result:** ⚠️ Sends resize command but blocked by multi-client issue

### 4. Fixed Backend Validation
**File:** `backend/routes/api.js:34`
**Problem:** Backend rejected `command` field
**Result:** ✅ TUI tools can now send commands

### 5. Fixed WebSocket Port
**File:** `src/components/MinimalTerminalView.tsx:14`
**Problem:** Connecting to wrong port (8127 instead of 8131)
**Result:** ✅ WebSocket connects properly

### 6. Attempted PTY Cleanup
**File:** `backend/modules/pty-handler.js:181-189`
**Problem:** Old PTY processes not killed
**Result:** ❌ **STILL BROKEN** - multiple PTYs still attaching

---

## 📁 Files Modified This Session

```
src/main.tsx                          - Disabled StrictMode
src/hooks/useTerminalInstance.ts      - Debounced resize, added logging
src/components/MinimalTerminalView.tsx - Auto-resize, fixed WS port
src/SimpleTmuxApp.tsx                 - Changed prompt → command
backend/routes/api.js                 - Added command field validation
backend/modules/pty-handler.js        - Added PTY cleanup (NOT WORKING)
```

---

## 🔍 Debug Information for Next Session

### PTY Cleanup Code (NOT WORKING)
**Location:** `backend/modules/pty-handler.js:171-194`

```javascript
if (existingPty.tmuxSession === sessionName && existingId !== id) {
  // CRITICAL: Kill the old PTY process (detach from tmux)
  try {
    if (existingPty.ptyProcess && !existingPty.ptyProcess.killed) {
      existingPty.ptyProcess.kill('SIGTERM');
      log.debug('Old PTY process killed (detached from tmux)');
    }
  } catch (err) {
    log.warn('Failed to kill old PTY process:', err.message);
  }
  this.processes.delete(existingId);
}
```

**Why it's not working:**
- SIGTERM might not actually kill the PTY?
- Process might respawn before old one dies?
- Race condition in cleanup timing?
- Need to use `tmux detach-client` instead?

### Command Execution Code
**Location:** `backend/modules/pty-handler.js:345-354`

```javascript
if (terminalConfig && terminalConfig.command && !autoExecuteTypes.includes(terminalType)) {
  const cmd = typeof terminalConfig.command === 'string' ? terminalConfig.command : ''
  const toWrite = cmd.endsWith('\n') ? cmd : (cmd + '\n')
  log.debug(`Executing custom command for ${terminalType}`);
  ptyProcess.write(toWrite);
  return;
}
```

**Why commands aren't running:**
- Timing - PTY not ready when write happens?
- Running on reconnect when shouldn't?
- Tmux attach eating the command?

---

## 🎯 Next Steps (Priority Order)

### **1. Fix Multiple PTY Attachments** (CRITICAL)

**Debug approach:**
```bash
# Before spawn
tmux list-clients

# After spawn - should see ONE client
tmux list-clients

# If see multiple - cleanup failed
```

**Possible solutions:**
- Use `tmux detach-client -t /dev/pts/X` instead of kill()
- Add delay between kill and new spawn
- Check if kill() actually terminates process
- Monitor process list to verify termination

### **2. Fix Command Execution** (HIGH)

**Debug approach:**
- Add logging: actual command content being written
- Log PTY state when command executes
- Test: does it work on first spawn vs reconnect?
- Check tmux capture-pane output immediately after spawn

### **3. Test Single Client Flow** (HIGH)
Once fixes applied:
- Spawn terminal
- Run `tmux list-clients` - should show ONE client
- Check for white dots - should be GONE
- Terminal should fill window

---

## 🔬 Comparison: Main vs Tmux-Only Branch

### Main Branch (`~/projects/terminal-tabs`) - WORKING ✅
- Terminals fill window
- Commands execute immediately
- No visual artifacts
- One PTY per session
- Detach/reattach works

### Tmux-Only Branch (`~/projects/terminal-tabs-tmux-only`) - BROKEN ❌
- White dots everywhere
- Commands don't execute (bash instead of tfe)
- Terminal stuck at 800x600
- Multiple PTYs per session
- Detach/reattach broken

**KEY QUESTION:** What does main branch do differently to prevent multiple PTY attachments?

---

## 🧪 Testing Checklist (For Next Session)

After fixes:
- [ ] Spawn TFE → should launch tfe (not bash)
- [ ] `tmux list-clients` → ONE client per session
- [ ] Terminal fills window (not 800x600)
- [ ] No white dots/artifacts
- [ ] Typing works normally
- [ ] Detach → reattach works
- [ ] Window resize works

---

## 💾 Git Commit Ready

Changes staged for commit on `terminal-tabs-tmux-only` branch:
- All sizing fixes
- ResizeObserver debouncing
- StrictMode disabled
- Backend validation updated
- PTY cleanup attempt (even though not working yet)

**Commit message:**
```
wip: terminal sizing fixes and PTY cleanup attempt

Issues:
- Multiple PTY attachments still occurring (white dots)
- Commands not executing (bash instead of tfe)
- Terminal stuck at 800x600

Fixes applied:
- Disabled React.StrictMode (fixed double typing)
- Debounced ResizeObserver (fixed infinite shrinking)
- Added auto-resize after attach
- Fixed backend validation for command field
- Attempted PTY cleanup (not working yet)

See NEXT_SESSION_PROMPT.md for full details.
```

---

**Last Updated:** 2025-11-15 20:38 UTC
**Next Session Focus:** Fix multiple PTY attachments and command execution
