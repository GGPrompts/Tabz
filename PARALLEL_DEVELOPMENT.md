# Terminal-Tabs: Parallel Development Guide

**Date**: 2025-11-14
**Strategy**: 4 concurrent worktrees for maximum productivity

## Overview

This document coordinates parallel development across 4 git worktrees, each exploring different architectural approaches and features for the terminal-tabs project.

## Worktree Structure

```
~/projects/
├── terminal-tabs/              # Main worktree (master branch)
├── terminal-tabs-tmux-only/    # Track 1: Simplified tmux-only architecture
├── terminal-tabs-extension/    # Track 2: Chrome extension version
├── terminal-tabs-showcase/     # Track 3: Advanced UI components
└── terminal-tabs-ai/           # Track 4: AI-powered features
```

## Development Tracks

### Track 1: Tmux-Only Simple
**Path**: `~/projects/terminal-tabs-tmux-only`
**Branch**: `feat/tmux-only-simple`
**Focus**: Simplified state management using pure tmux as source of truth

**Key Goals**:
- Remove Zustand complexity
- Direct tmux session queries
- <1000 lines of React code
- Zero state sync bugs

**Implementation Plan**: See `IMPLEMENTATION_PLAN.md` in worktree

---

### Track 2: Chrome Extension
**Path**: `~/projects/terminal-tabs-extension`
**Branch**: `feat/chrome-extension`
**Focus**: Browser extension with DevTools, Side Panel, and Popup integration

**Key Goals**:
- Manifest V3 extension
- DevTools panel with terminal
- Context menu integrations
- Chrome Storage sync

**Implementation Plan**: See `IMPLEMENTATION_PLAN.md` in worktree

---

### Track 3: Component Showcase
**Path**: `~/projects/terminal-tabs-showcase`
**Branch**: `feat/component-showcase`
**Focus**: Impressive UI components showcasing terminal management patterns

**Key Goals**:
- TerminalCarousel (swipeable sessions)
- SessionAnalyticsDashboard (charts)
- CollaborativeTerminal (multi-user)
- TerminalThemeBuilder (visual editor)
- CommandPaletteSearch (Cmd+K fuzzy search)

**Implementation Plan**: See `IMPLEMENTATION_PLAN.md` in worktree

---

### Track 4: AI-Powered Features
**Path**: `~/projects/terminal-tabs-ai`
**Branch**: `feat/ai-experiments`
**Focus**: Experimental AI integrations for productivity

**Key Goals**:
- AICommandSuggester (inline suggestions)
- ErrorDiagnosticsPanel (auto-fix errors)
- NaturalLanguageTerminal (English → commands)
- SessionSummaryBot (commit messages, reports)

**Implementation Plan**: See `IMPLEMENTATION_PLAN.md` in worktree

---

## Quick Start: Tmux Session Setup

### Option 1: Manual tmux sessions
```bash
# Start 4 tmux sessions (one per track)
tmux new-session -d -s tmux-only 'cd ~/projects/terminal-tabs-tmux-only && claude'
tmux new-session -d -s extension 'cd ~/projects/terminal-tabs-extension && claude'
tmux new-session -d -s showcase 'cd ~/projects/terminal-tabs-showcase && claude'
tmux new-session -d -s ai-features 'cd ~/projects/terminal-tabs-ai && claude'

# Attach to first session
tmux attach -t tmux-only

# Switch between sessions with Ctrl+b s (session list)
```

### Option 2: Automated startup script
```bash
# Run the startup script (see TMUX_STARTUP.sh)
./TMUX_STARTUP.sh
```

---

## Coordination Strategy

### Shared Infrastructure
- Backend WebSocket server (port 8127)
- Backend REST API (port 8127)
- Shared `spawn-options.json`
- Common tmux integration code

### Independent Work
- Frontend state management (each track different)
- UI components (shadcn/ui configs per track)
- Feature flags for experimental features
- Separate `package.json` dependencies

### Merge Strategy
1. **Track 3** (Component Showcase) → Merge first (most visual, least risk)
2. **Track 1** (Tmux-Only) → Merge as optional simplified mode
3. **Track 2** (Chrome Extension) → Package as separate distribution
4. **Track 4** (AI Features) → Feature-flag merge (opt-in)

---

## Development Workflow

### 1. Start All Sessions
```bash
cd ~/projects/terminal-tabs
./TMUX_STARTUP.sh
```

### 2. Switch Between Tracks
```bash
# Ctrl+b s - Show session list
# Arrow keys - Select session
# Enter - Attach
```

### 3. Monitor Progress
Each track has its own todo list managed by Claude Code in that session.

### 4. Backend Coordination
The backend server is shared across all tracks:
```bash
# In main terminal-tabs directory
cd backend && npm start
```

All worktrees connect to same backend at `ws://localhost:8127`.

---

## Timeline Estimate

**Total Development Time**: 1 hour

| Track | Time | Priority |
|-------|------|----------|
| Track 3 (Showcase) | 30 min | HIGH (visual impact) |
| Track 1 (Tmux-Only) | 10 min | MEDIUM (architecture validation) |
| Track 2 (Extension) | 10 min | MEDIUM (unique value) |
| Track 4 (AI Features) | 10 min | LOW (experimental) |

**Strategy**: Focus Claude Code instances on Track 3 first, then parallelize the rest.

---

## Worktree Management

### List all worktrees
```bash
cd ~/projects/terminal-tabs
git worktree list
```

### Remove worktree (when done)
```bash
git worktree remove ~/projects/terminal-tabs-tmux-only
git branch -d feat/tmux-only-simple  # Delete branch if needed
```

### Sync changes from main
```bash
# In any worktree
git fetch origin
git merge origin/main  # Or rebase
```

---

## Tech Stack Summary

### Shared Dependencies
- React 18.3 + TypeScript
- Vite (build tool)
- xterm.js (terminal emulation)
- Tailwind CSS (styling)
- shadcn/ui (UI components)

### Track-Specific
| Track | Unique Dependencies |
|-------|---------------------|
| Tmux-Only | None (removes Zustand) |
| Extension | Chrome Extension APIs, vite-plugin-web-extension |
| Showcase | Recharts, Framer Motion, Fuse.js, react-colorful |
| AI Features | Ollama, ollama npm package |

---

## Expected Outcomes

### Track 1: Tmux-Only
- ✅ 40% code reduction
- ✅ Zero state sync bugs
- ✅ Simpler mental model
- ✅ Faster startup time

### Track 2: Chrome Extension
- ✅ Installable .zip for Chrome Web Store
- ✅ DevTools integration
- ✅ Cross-device sync
- ✅ Context menu features

### Track 3: Component Showcase
- ✅ 5 impressive reusable components
- ✅ Portfolio-quality code
- ✅ Full shadcn/ui showcase
- ✅ Mobile responsive

### Track 4: AI Features
- ✅ Local AI (Ollama) integration
- ✅ Privacy-first design
- ✅ Real productivity gains
- ✅ Learning from user patterns

---

## Communication Between Tracks

### Shared CHANGELOG
All tracks document API changes in `SHARED_CHANGELOG.md`:
```markdown
## 2025-11-14

### Backend API Changes
- Added `GET /api/tmux/sessions/detailed` (Track 1)
- Added `POST /api/ai/suggest` (Track 4)

### Shared Components
- None yet (tracks are independent)
```

### Feature Flags
Track 4 (AI) uses feature flags:
```typescript
// .env
VITE_ENABLE_AI_FEATURES=true
VITE_AI_PROVIDER=ollama  # or openai
```

---

## Ready to Build!

All worktrees are set up with detailed implementation plans. Start your tmux sessions and let's build in parallel! 🚀

**Next Steps**:
1. Review each `IMPLEMENTATION_PLAN.md` in the worktrees
2. Run `./TMUX_STARTUP.sh` to start all sessions
3. Begin with Track 3 (most visual impact)
4. Coordinate via this master document

Happy coding! 💻✨
