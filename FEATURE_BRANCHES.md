# Feature Branches Overview

**Last Updated**: November 15, 2025

This document tracks all active feature branches being developed in parallel using git worktrees. Each branch explores a different architectural direction for terminal-tabs.

---

## 📁 Worktree Directory Structure

All feature branches are checked out as separate worktrees in `~/projects/`:

```
~/projects/
├── terminal-tabs/                 # Main repository (master branch)
├── terminal-tabs-showcase/        # feat/component-showcase
├── terminal-tabs-tmux-only/       # feat/tmux-only-simple
├── terminal-tabs-extension/       # feat/chrome-extension
├── terminal-tabs-ai/              # feat/ai-experiments
└── tmux-manager/                  # tmux-manager branch (Go backend)
```

**How to switch between branches**:
```bash
# Just cd into the directory
cd ~/projects/terminal-tabs-showcase

# Each directory is a full git worktree
git status
git log
```

---

## 🌿 Feature Branches

### 1. **master** (Main Branch) ✅ PRODUCTION
**Location**: `~/projects/terminal-tabs`
**Status**: ✅ Stable, production-ready
**Version**: v1.3.0

**What it is**:
- The current production version of Tabz
- Tab-based terminal interface with React frontend + Node.js backend
- Multi-window support, split terminals, tmux integration
- Keyboard shortcuts, auto-naming from tmux

**Key Features**:
- ✅ Terminal spawning (15 types)
- ✅ Tab-based UI with browser-style tabs
- ✅ Multi-window support (move tabs between windows)
- ✅ Split terminals (horizontal/vertical)
- ✅ Tmux integration (persistence)
- ✅ Keyboard shortcuts (Alt+1-9, Alt+H/V/X/Z)
- ✅ Test pass rate: 98.4% (259/260 tests)

**Backend**: Node.js + Express + WebSocket (port 8127)
**Frontend**: React + Vite (port 5173)

---

### 2. **feat/component-showcase** 🎨 EXPERIMENTAL
**Location**: `~/projects/terminal-tabs-showcase`
**Status**: 90% complete - Visual components built
**Has Working Terminal**: ✅ Yes (same as master)

**What it is**:
- Explores advanced React UI components for terminal management
- Adds visual flair with carousels, charts, and analytics
- Demonstrates what's possible with modern UI libraries

**Built Components**:
- ✅ **TerminalCarousel** - Swipeable carousel with live terminal previews
  - Canvas snapshots from xterm.js
  - Auto-play mode (3s delay)
  - Hover cards with terminal metadata
- ✅ shadcn/ui integration (19+ components)
- ✅ recharts for analytics/charts
- ✅ embla-carousel for smooth animations

**Dependencies Added**:
- `recharts` - Charts/analytics
- `embla-carousel-react` - Carousel
- `date-fns` - Date formatting
- `fuse.js` - Fuzzy search
- `react-colorful` - Color picker
- `cmdk` - Command palette

**Files Modified**:
- `src/components/showcase/TerminalCarousel.tsx` (new)
- All base components from master copied over

**Assessment**:
- ✅ **Working terminals** - Full terminal functionality works
- 🎨 **Beautiful visuals** - Very impressive UI components
- ⚠️ **Feature creep** - Conflicts with "simple" philosophy
- 📊 **Portfolio value** - Great for demos and showcasing React skills

**Next Steps (from SESSION_STATUS.md)**:
- Build SessionAnalyticsDashboard
- Add command frequency heatmap
- Session duration charts

---

### 3. **feat/tmux-only-simple** 🚧 IN PROGRESS
**Location**: `~/projects/terminal-tabs-tmux-only`
**Status**: 80% complete - UI built, **terminal NOT working yet**
**Has Working Terminal**: ❌ No - UI only, no xterm integration

**What it is**:
- Radical architectural simplification
- Removes Zustand state management
- Focuses on tmux session lifecycle instead of tab management
- Becomes a "tmux session browser" instead of "tab manager"

**Built Components**:
- ✅ **SimpleTmuxApp** - Main app (list/grid view modes)
- ✅ **TmuxSessionList** - Session browser UI
- ✅ **TmuxSessionCard** - Session cards with actions
- ✅ **MinimalTerminalView** - Terminal view component (NOT INTEGRATED)
- ✅ **TmuxControlPanel** - Session management controls
- ✅ **TmuxKeyboardShortcuts** - Keyboard reference

**Architecture Changes**:
- ❌ **Removed Zustand** (still in package.json but not used)
- ✅ Simpler state management (useState-based)
- ✅ Focus on tmux attach/detach workflow
- ✅ Uses shadcn/ui for clean UI

**Current Limitations**:
- ⚠️ **No working terminal rendering** - xterm.js not integrated yet
- ⚠️ **No WebSocket connection** - Can't connect to backend
- ⚠️ **UI only** - Can browse sessions but not interact with them
- ⚠️ **Missing features**: Split support, multi-window, customization

**Files**:
- `src/SimpleTmuxApp.tsx` - Main app
- `src/components/TmuxSessionList.tsx` - Session browser
- `src/components/MinimalTerminalView.tsx` - Terminal stub (not working)

**Assessment**:
- 📉 ~40% code reduction claimed (compared to master)
- ✅ Cleaner architecture (if completed)
- ⚠️ **Fundamental shift**: From "Tabz" to "tmux session manager"
- ⚠️ **Loses tab metaphor** - No longer browser-style tabs
- ❌ **Not usable yet** - Terminal rendering not implemented

**What's Missing to Make it Work**:
1. Integrate xterm.js into MinimalTerminalView
2. Add WebSocket connection to backend
3. Handle terminal I/O (input/output)
4. Add terminal resize/refit logic
5. Test with actual tmux sessions

---

### 4. **feat/chrome-extension** 🌐 ✅ WORKING
**Location**: `~/projects/terminal-tabs-extension`
**Status**: 95% complete - Fully functional!
**Has Working Terminal**: ✅ Yes - Full terminal functionality working
**Last Updated**: November 17, 2025

**What it is**:
- Chrome extension version of Tabz
- Leverages Chrome's side panel for native browser integration
- Same terminal functionality but as a browser extension
- Perfect for multi-monitor setups

**Built Components**:
- ✅ **Manifest V3** configuration
- ✅ Extension structure:
  - `extension/popup/` - Command palette popup
  - `extension/sidepanel/` - Side panel terminal UI (working!)
  - `extension/devtools/` - DevTools integration
  - `extension/background/` - Service worker (WebSocket)
  - `extension/content/` - Content script
- ✅ **xterm.js integration** with Unicode11 addon
- ✅ **WebSocket communication** to backend (port 8128)
- ✅ **Session management** - Spawn, close, switch terminals
- ✅ **Simplified UI** - Compact toolbar (no redundant headers)

**Build Tooling**:
- Vite + TypeScript
- shadcn/ui for components
- Custom build script for extension packaging

**Critical Bug Fixed (Nov 17, 2025)**:
- ❌ **Original Issue**: Terminals spawned but only showed blinking cursor
- 🔍 **Root Cause**: Message type mismatch in background worker
  - Backend sent `'terminal-output'` but worker only checked for `'output'`
  - Terminal output was wrapped in `WS_MESSAGE` instead of `TERMINAL_OUTPUT`
  - Terminal component never received output
- ✅ **Fix**: Check for both message types in background worker
- 📝 **Documentation**: [GitHub Gist](https://gist.github.com/GGPrompts/94d74552271412bd1374f1122f7d20da)

**Additional Fixes**:
- ✅ Added Unicode11 addon for emoji/TUI support (htop, lazygit work!)
- ✅ Simplified header - removed redundancy with Chrome's built-in header
- ✅ Removed footer that was covering tmux status bar
- ✅ Proper message flow: Backend → Background Worker → Terminal Component

**Files**:
- `extension/manifest.json` - Chrome extension manifest
- `extension/popup/popup.tsx` - Popup UI
- `extension/sidepanel/sidepanel.tsx` - Side panel (simplified layout)
- `extension/background/background.ts` - Service worker (fixed message routing)
- `extension/components/Terminal.tsx` - xterm.js terminal (Unicode11 enabled)

**Current State**:
- ✅ **Terminal rendering works** - Full output display
- ✅ **Keyboard input works** - Typing, commands, shortcuts
- ✅ **Emoji support** - Unicode11 addon for correct width
- ✅ **TUI apps work** - htop, lazygit, etc. render correctly
- ✅ **Tmux integration** - Status bar fully visible
- ✅ **Session tabs** - Multiple terminals with tabs
- ✅ **Connection status** - Connected/Disconnected badge

**Assessment**:
- 🌟 **Most unique value** - Only terminal manager as Chrome extension
- 🎯 **Perfect for multi-monitor** - Chrome's native side panel
- ✅ **Production ready** - All major bugs fixed
- 💡 **Clean architecture** - Simplified UI, proper message flow
- 🚀 **Next step**: Package for Chrome Web Store

**Ready for Merge to Main**:
- ✅ Terminal functionality complete
- ✅ Build process working
- ✅ Debug logging in place (can be cleaned up)
- ⚠️ Needs: Final testing, cleanup debug logs, update CHANGELOG
- 📦 **Build command**: `npm run build:extension`
- 📂 **Output**: `dist-extension/` (ready to load in Chrome)

---

### 5. **feat/ai-experiments** 🤖 EXPERIMENTAL
**Location**: `~/projects/terminal-tabs-ai`
**Status**: 90% complete - AI features working
**Has Working Terminal**: ✅ Yes (same as master + AI features)

**What it is**:
- Adds AI-powered features to terminals
- Context-aware command suggestions
- Error detection and diagnostics
- Requires Ollama running locally

**Built Components**:
- ✅ **AICommandSuggester** - Inline command suggestions
  - Tab to accept, Esc to dismiss
  - Context-aware (cwd, git status, recent commands)
  - Confidence scores
  - Debounced fetching (3+ chars trigger)
- ✅ **ErrorDiagnosticsPanel** - Error detection and fixes
- ✅ **useTerminalContext** hook - Auto-refresh terminal state (5s)
- ✅ Backend AI service (Ollama with qwen2.5-coder:7b)

**Dependencies**:
- Radix UI (tooltip, alert, collapsible, tabs)
- Lucide icons (Loader2, Sparkles, X)
- Ollama (external dependency)

**Files**:
- `src/components/ai/AICommandSuggester.tsx` - Inline suggestions
- `src/components/ai/ErrorDiagnosticsPanel.tsx` - Error detection
- `src/hooks/useTerminalContext.ts` - Context hook
- Backend: AI service integration (Ollama)

**Assessment**:
- ✅ **Working terminals** - Full functionality + AI features
- 🤖 **Future-forward** - AI suggestions are genuinely useful
- 💡 **Error diagnostics** - Could save hours of debugging
- ⚠️ **Ollama dependency** - Requires external service running
- 🎯 **Experimental** - Accuracy varies by use case

**Requirements**:
- Ollama installed and running
- qwen2.5-coder:7b model downloaded

---

### 6. **tmux-manager** (Go Backend) ⚠️ CREATED BY MISTAKE
**Location**: `~/projects/tmux-manager`
**Status**: ✅ Phase 1 Complete - Working binary
**Type**: Backend replacement (not a frontend)

**⚠️ NOTE: This branch was created based on a misunderstanding!**

The original intent was to **integrate tmuxplexer as spawn options in Tabz**, but Claude misunderstood and built an entirely new Go CLI tool instead.

**What it is**:
- Universal CLI tool written in Go
- Replaces fragmented Node.js backend code
- Single binary backend for Tabz, Opustrator, AND tmuxplexer
- "Tmux is the database" - stateless architecture

**Completed (Phase 1)**:
- ✅ **8 working commands**:
  - `start` - Start new tmux session
  - `attach` - Attach to session
  - `detach` - Detach from session
  - `kill` - Kill session
  - `list` - List all sessions
  - `info` - Get session details
  - `types` - List terminal types
  - `version` - Show version
- ✅ **Binary built**: 7.9 MB, fully functional
- ✅ **Test coverage**: 43.6% (core logic: 90%+)
- ✅ **Config system**: YAML-based (~/.config/tmux-manager/config.yaml)
- ✅ **Session naming**: `tt-{type}-{random}` (e.g., tt-bash-a3k)

**Example Usage**:
```bash
$ ~/projects/tmux-manager/bin/tmux-manager version
tmux-manager v0.1.0
Built: 2025-11-14T23:02:40Z
Go: go1.25.4

$ ~/projects/tmux-manager/bin/tmux-manager types
TYPE         COMMAND  ICON  DESCRIPTION
bash         <empty>  💻     Plain bash terminal
claude-code  claude   🤖     Claude Code interactive mode
tui-tool     <empty>  🛠️    Generic TUI tool
```

**Phase Roadmap**:
- ✅ **Phase 1**: Core CLI (COMPLETE)
- 🚧 **Phase 2**: Rich metadata (Git, GitHub, process monitoring)
- 🚧 **Phase 3**: API server (REST + WebSocket)
- 🚧 **Phase 4**: Integration with Tabz
- 🚧 **Phase 5**: Polish & release

**Dependencies**:
- Go 1.25.4
- Cobra CLI framework
- Viper configuration

**Files**:
- `bin/tmux-manager` - Compiled binary (7.9 MB)
- `TMUX_MANAGER_PLAN.md` - Full 5-phase roadmap
- `PHASE_1_COMPLETE.md` - Phase 1 completion report
- `main.go` - Entry point
- `cmd/` - Command implementations
- `internal/` - Internal packages

**Assessment**:
- ⚠️ **Created based on misunderstanding** - Not originally needed
- 🏆 Phase 1 is solid engineering
- 💡 Could be useful for universal backend
- 📦 Single binary, no Node.js dependencies
- ⚡ Fast: Session list <50ms, info <100ms
- ✅ Well-tested - 90%+ coverage for core logic
- 🤔 **But**: tmuxplexer already exists and does workspace management!

**Original Intent vs What Was Built**:
- **Original**: Use existing tmuxplexer for spawn options
- **Built**: New Go CLI tool to replace Node.js backend
- **Reality**: Just add tmuxplexer to spawn-options.json (much simpler!)

---

## 📊 Status Summary Table

| Branch | Location | Terminal Works? | Status | Completion |
|--------|----------|-----------------|--------|------------|
| **master** | `terminal-tabs/` | ✅ Yes | Stable | 100% |
| **showcase** | `terminal-tabs-showcase/` | ✅ Yes | Working | 90% |
| **tmux-only** | `terminal-tabs-tmux-only/` | ❌ No | UI only | 80% |
| **extension** | `terminal-tabs-extension/` | ✅ Yes | ✅ **READY FOR MERGE** | 95% |
| **ai-experiments** | `terminal-tabs-ai/` | ✅ Yes | Working | 90% |
| **tmux-manager** | `tmux-manager/` | N/A (backend) | ⚠️ Misunderstood | 33% (1/3 phases) |
| **sessionmanager** | N/A | N/A | ❌ Failed | Abandoned |

**Note on sessionmanager**: This branch attempted orphaned session detection (showing tmux sessions not created by Tabz). It failed due to refresh loops, race conditions, and state synchronization issues. Lesson: Keep Tabz simple, use tmux/tmuxplexer for external session management. See [LESSONS_LEARNED.md](LESSONS_LEARNED.md#lesson-orphaned-session-detection-is-a-trap-nov-15-2025).

---

## 🎯 Recommendations

### Immediate Actions

1. **Add tmuxplexer to spawn options** - The original intent! (5 minutes)
   ```json
   {
     "label": "tmuxplexer Session Manager",
     "command": "tmuxplexer",
     "terminalType": "tui-tool",
     "icon": "🎛️"
   }
   ```

2. **Fix tmux-only terminal** - Integrate xterm.js into MinimalTerminalView (if continuing)
3. **Fix extension build** - Create icons, fix config (if continuing)
4. **Archive tmux-manager?** - Built on misunderstanding, though Phase 1 is good work

### Long-term Strategy

**Option A: Simple Integration (Recommended - Original Intent)**
1. Add tmuxplexer to spawn-options.json
2. Users spawn tmuxplexer from Tabz
3. tmuxplexer creates complex workspace layouts safely
4. Done! No need for new backend

**Option B: Cherry-pick features**
1. Keep master as-is
2. Add AI features from ai-experiments
3. Add tmuxplexer spawn option
4. Archive showcase, tmux-only, tmux-manager

**Option C: Continue tmux-manager (if you like it)**
1. Complete Phase 2 (Git/GitHub metadata)
2. Complete Phase 3 (API server)
3. Migrate master to use tmux-manager backend
4. **But**: This is way more work than just using tmuxplexer!

---

## 🐳 Docker Multi-Branch Testing

**NEW**: Run multiple feature branches simultaneously in Docker containers for easy comparison and cherry-picking!

### Quick Start

```bash
# Start all branches at once
./docker-branches.sh start all

# Or start specific branches
./docker-branches.sh start ai-experiments
./docker-branches.sh start chrome-extension

# View all URLs
./docker-branches.sh urls

# Stop all branches
./docker-branches.sh stop all
```

### Port Mappings

Each branch gets its own ports to avoid conflicts:

| Branch | Frontend | Backend | Docker Command |
|--------|----------|---------|----------------|
| **master** | 5173 | 8127 | `./docker-branches.sh start master` |
| **ai-experiments** | 5174 | 8128 | `./docker-branches.sh start ai-experiments` |
| **chrome-extension** | 5175 | 8129 | `./docker-branches.sh start chrome-extension` |
| **component-showcase** | 5176 | 8130 | `./docker-branches.sh start component-showcase` |
| **tmux-only-simple** | 5177 | 8131 | `./docker-branches.sh start tmux-only-simple` |

### Available Commands

```bash
# Start branches
./docker-branches.sh start <branch>     # Start single branch
./docker-branches.sh start all          # Start all branches

# Stop branches
./docker-branches.sh stop <branch>      # Stop single branch
./docker-branches.sh stop all           # Stop all branches

# Manage branches
./docker-branches.sh restart <branch>   # Restart a branch
./docker-branches.sh build <branch>     # Rebuild container
./docker-branches.sh build all          # Rebuild all

# Monitor
./docker-branches.sh list               # List running containers
./docker-branches.sh urls               # Show all branch URLs
./docker-branches.sh logs <branch>      # View logs (Ctrl+C to exit)

# Cleanup
./docker-branches.sh clean              # Remove all containers/images
```

### Workflow Example

**Compare AI experiments with component showcase:**

```bash
# Start both branches
./docker-branches.sh start ai-experiments
./docker-branches.sh start component-showcase

# Open in browser tabs:
# - http://localhost:5174 (AI experiments)
# - http://localhost:5176 (Component showcase)

# Test features, compare UX, identify what to cherry-pick

# View logs if needed
./docker-branches.sh logs ai-experiments

# Stop when done
./docker-branches.sh stop all
```

### Cherry-Picking Features

Once you've identified features to merge:

```bash
# 1. Find the commits you want
cd ~/projects/terminal-tabs
git log feat/ai-experiments --oneline

# 2. Cherry-pick specific commits
git cherry-pick abc123  # Replace with actual commit hash

# 3. Or merge entire files
git checkout feat/ai-experiments -- src/components/ai/AICommandSuggester.tsx

# 4. Test locally
./start-tmux.sh

# 5. Commit your merge
git add .
git commit -m "feat: add AI command suggester from feat/ai-experiments"
```

### Why Docker for Branch Testing?

**Advantages:**
- ✅ **Isolated environments** - Each branch runs independently
- ✅ **Easy comparison** - Open multiple browsers tabs side-by-side
- ✅ **No port conflicts** - Different ports for each branch
- ✅ **Clean testing** - No worktree setup needed
- ✅ **Quick teardown** - `stop all` removes everything

**Alternative: Git Worktrees** (already documented above)
- ✅ Native git workflow
- ✅ Persistent file access
- ❌ Manual port management
- ❌ Must cd between directories

### Files

- `Dockerfile` - Multi-stage build supporting branch selection
- `docker-compose.yml` - Service definitions for all branches
- `docker-entrypoint.sh` - Container startup script
- `docker-branches.sh` - Management CLI tool

---

## 🔗 Related Documentation

- [PLAN.md](PLAN.md) - Master roadmap and refactoring plan
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [SESSION_STATUS.md](SESSION_STATUS.md) - Nov 14 session notes
- [TMUX_MANAGER_PLAN.md](tmux-manager/TMUX_MANAGER_PLAN.md) - Full tmux-manager plan
- [PHASE_1_COMPLETE.md](tmux-manager/PHASE_1_COMPLETE.md) - tmux-manager Phase 1 report

---

## ❓ Common Questions

**Q: Which branch should I use?**
A: Use **master** for production. Others are experiments.

**Q: Can I test the other branches?**
A: Yes for showcase and ai-experiments. No for tmux-only (no terminal) and extension (build broken). **Don't use sessionmanager** - it's a failed experiment with refresh loops and bugs.

**Q: How do I switch branches?**
A: Just `cd` into the directory (e.g., `cd ~/projects/terminal-tabs-showcase`)

**Q: Should these be merged?**
A: Not yet. Each explores a different direction. Wait until one proves superior.

**Q: What about tmux-manager?**
A: ⚠️ This was created based on a misunderstanding. The original intent was to use existing tmuxplexer (~/projects/tmuxplexer) as spawn options in Tabz, not build a whole new backend. Though Phase 1 is solid work, it's probably unnecessary.

**Q: How do I use tmuxplexer with Tabz?**
A: Just add it to spawn-options.json:
```json
{
  "label": "tmuxplexer",
  "command": "tmuxplexer",
  "terminalType": "tui-tool",
  "icon": "🎛️"
}
```
This lets users create complex workspace layouts safely (tmuxplexer handles send-keys in Go).

---

**Last Updated**: November 15, 2025
