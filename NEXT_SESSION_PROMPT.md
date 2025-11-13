# Next Session: Claude Code Status Badges + Terminal Visual Fixes

## ✅ Completed This Session (Nov 12-13, 2025)

### 1. Enhanced Tab Naming for TUI Tools
**Fixed**: Tab names now show meaningful information instead of generic hostnames
- TUI tools display: `command - ~/working/dir` (e.g., `🦎 lazygit - ~/projects/terminal-tabs`)
- Claude Code tabs preserve dynamic status from tmux (e.g., "Editing: Terminal.tsx")
- Modified: `src/hooks/useTerminalNameSync.ts`

### 2. Fixed Claude Code Hook Status Tracking
**Fixed**: State-tracker hooks now properly capture and store Claude's status
- **Session ID mismatch**: `state-tracker.sh` now uses working directory hash (matching `statusline-script.sh`)
- **Stdin reading broken**: Changed from `[[ -p /dev/stdin ]]` to `timeout 0.1 cat` - now captures JSON data
- **Tool name extraction**: Now correctly extracts tool names (Bash, Read, Edit, etc.)
- **Debug logging**: Added to `/tmp/claude-code-state/debug/` for troubleshooting
- Modified: `~/.claude/hooks/state-tracker.sh`
- Result: Statusline (green text at bottom) now shows detailed updates like "🔧 Bash...", "⚙️ Working...", "✓ Ready"

### 3. Claude Code Status Badges (Nov 12, 2025)
**Fixed**: Live status badges now appear on Claude Code tabs
- Added Vite proxy configuration for `/api` requests
- Fixed API route path (`/claude-status` instead of `/api/claude-status`)
- Badges always show, defaulting to "✓ Ready" when status unknown
- Status updates every 2 seconds from state-tracker hook
- Modified: `vite.config.ts`, `backend/routes/api.js`, `src/SimpleTerminalApp.tsx`

### 4. Tmux Pane Count Display (Nov 12, 2025)
**Added**: Tab names now show both window and pane counts
- `(2w)` = 2 tmux windows in session (Ctrl+B c)
- `(3p)` = 3 tmux vertical panes in window (Ctrl+B ")
- `(2w, 3p)` = 2 windows AND 3 panes
- Backend returns `paneCount` from `#{window_panes}` format
- Modified: `backend/routes/api.js` (line 771), `src/hooks/useTerminalNameSync.ts` (lines 64-74)

### 5. Split Container Detach/Reattach (Nov 13, 2025)
**Fixed**: Detaching and reattaching split terminals now preserves layout and reconnects properly
- When detaching a split container, ALL panes are detached and split layout preserved
- When reattaching, ALL panes reconnect and split is restored
- Each pane's tmux session persists independently
- **Critical bug fix #1**: Removed WebSocket 'close' message that was killing tmux sessions
  - Detach now only calls `/api/tmux/detach` endpoint (keeps session alive)
  - PTY disconnects naturally without destroying the session
- **Critical bug fix #2**: Clear agentId from processedAgentIds when detaching
  - Previously, reattaching got "Already processed agentId" and was ignored
  - Now clears the agentId so reconnection works properly
- Modified: `src/SimpleTerminalApp.tsx` (handleContextDetach, handleReattachTerminal)
- Modified: `src/hooks/useWebSocketManager.ts` (added clearProcessedAgentId function)

---

## 🎨 TODO: Terminal Visual Improvements

### 1. Add Left Padding to Terminals
**Issue**: Text starts at the very left edge of terminals
**Fix**: Add 8-12px left padding to terminal panes

**Files**:
- `src/components/Terminal.css`
- `src/components/Terminal.tsx`

### 2. Make Split Divider More Visible
**Issue**: Divider between split panes is hard to see, panes may overlap
**Fix**:
- Increase divider visibility (currently 2px, 30% opacity)
- Add clear visual gap between panes
- Ensure no overlap between left/right or top/bottom panes

**Files**:
- `src/components/SplitLayout.tsx`
- `src/components/SplitLayout.css`

**Current Setup**: Uses `react-resizable` with `ResizableBox`

---

## 📁 Key Files Reference

### Status Badge System
- `backend/routes/api.js:795-841` - API endpoint
- `src/hooks/useClaudeCodeStatus.ts` - Polling hook
- `src/SimpleTerminalApp.tsx:222-252` - Badge rendering (in SortableTab)
- `src/SimpleTerminalApp.tsx:537-538` - **Feature toggle (currently disabled)**
- `src/SimpleTerminalApp.css:461-522` - Badge styles
- `~/.claude/hooks/state-tracker.sh` - Writes state files
- `/tmp/claude-code-state/` - State storage directory

### Tab Naming System
- `src/hooks/useTerminalNameSync.ts` - Polls tmux for pane titles
- `backend/routes/api.js:753-793` - `/api/tmux/info/:name` endpoint
- `~/.claude/hooks/state-tracker.sh` - Hook that tracks status
- `~/.claude/statusline-script.sh` - Reads state for statusline display

---

## ⚠️ Important Notes

1. **Backend must be running**: Status badges require backend API at `localhost:8127`
2. **Hook system working**: State files are being written correctly to `/tmp/claude-code-state/`
3. **API route exists**: Just needs proper routing from frontend
4. **No code removal needed**: All implementation is complete, just needs proxy config
5. **Test thoroughly**: After fixing proxy, spawn multiple Claude Code terminals and verify badges update correctly
