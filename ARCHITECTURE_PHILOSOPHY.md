# Architecture Philosophy - Tabz

**Last Updated**: November 15, 2025

## Core Principle: Small, Focused Tools

Tabz is intentionally kept **small and stable**. New features should be **separate tools** that integrate via spawn options, not additions to the Tabz codebase.

---

## The Problem: Feature Creep

**Anti-pattern**: Keep adding features to Tabz until it becomes unmaintainable
```
Tabz (v1.0): Tab-based terminals ✅
Tabz (v2.0): + Session detection ❌
Tabz (v3.0): + Workspace templates ❌
Tabz (v4.0): + AI features ❌
Tabz (v5.0): + Analytics dashboards ❌
→ Result: 50,000 lines of code, can't maintain, project shelved
```

**The right pattern**: Keep Tabz focused, build plugins
```
Tabz: Tab-based terminals (stable, tested) ✅
tmuxplexer: Workspace templates (separate Go tool) ✅
future-tool: AI features (separate Go tool) ✅
another-tool: Analytics (separate Go tool) ✅
→ Result: Each tool is manageable, can maintain long-term
```

---

## Project Boundaries

### Tabz Core (What Stays IN)

**Scope**: Browser-based terminal UI with tab management

**Features**:
- ✅ Tab-based interface (browser-style tabs)
- ✅ Terminal spawning (bash, claude-code, tui-tools)
- ✅ WebSocket terminal I/O
- ✅ Multi-window support (move tabs between windows)
- ✅ Split terminals (horizontal/vertical)
- ✅ Tmux integration (persistence)
- ✅ Per-tab customization (theme, font, transparency)
- ✅ Keyboard shortcuts

**What to RESIST adding**:
- ❌ Session detection (use tmux/tmuxplexer)
- ❌ Workspace templates (use tmuxplexer)
- ❌ AI features (build separate tool)
- ❌ Analytics dashboards (build separate tool)
- ❌ Complex UI components (keep it simple)

**Success Criteria**:
- Tests passing: 98%+
- Lines of code: <10,000 (excluding tests)
- Startup time: <500ms
- Bundle size: <300KB gzipped

---

## Plugin Architecture

### How to Add Features

Instead of adding to Tabz, build a separate tool and integrate via spawn options:

**Step 1: Build standalone tool**
```bash
# Example: Build a Git TUI tool
cd ~/projects/git-tui
go build -o git-tui
```

**Step 2: Add to spawn-options.json**
```json
{
  "label": "Git TUI",
  "command": "~/projects/git-tui/git-tui",
  "terminalType": "tui-tool",
  "icon": "🌿",
  "description": "Git operations TUI"
}
```

**Step 3: Done!**
- Users spawn from Tabz
- Tool runs independently
- No Tabz code changes needed

### Plugin Checklist

Before adding a feature to Tabz, ask:

- [ ] Could this be a separate tool?
- [ ] Would it add >500 lines to Tabz?
- [ ] Does it require new dependencies?
- [ ] Is it a specialized use case?
- [ ] Would it complicate testing?

If **any** answer is YES → Build as plugin!

---

## Technology Choices

### Tabz Core
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + WebSocket
- **Why**: Web-based, good ecosystem for UI

### Plugins (Recommended)
- **Language**: Go
- **UI Framework**: Bubble Tea (TUI)
- **Why**:
  - Single binary (easy distribution)
  - Fast compilation
  - Great for TUI apps
  - No runtime dependencies

### Integration
- **Method**: Spawn from Tabz via `spawn-options.json`
- **Communication**: Tools run independently (no IPC needed)
- **State**: Each tool manages its own state

---

## Examples: Good vs Bad

### ❌ BAD: sessionmanager Branch

**What it tried**: Add orphaned session detection to Tabz
- Polling tmux every 15s
- Managing two sources of truth (localStorage + tmux)
- Showing "detached" sessions in Tabz UI

**Why it failed**:
- Refresh loops
- Race conditions
- State sync chaos
- Project got too complex

**Right approach**: Use tmuxplexer (already exists!)
- tmuxplexer shows ALL sessions
- No polling, no state sync
- Spawn from Tabz when needed

### ❌ BAD: tmux-manager Branch

**What it tried**: Build entire Go backend to replace Node.js
- Reimplemented tmux session management
- Planned 5-phase roadmap
- Months of work

**Why it's wrong**:
- Node.js backend already works
- Solving problems that don't exist
- tmuxplexer already does workspace management

**Right approach**: Just add tmuxplexer to spawn options
- 5-minute integration
- Uses existing tool
- No backend rewrite

### ✅ GOOD: tmuxplexer Integration

**What it does**: Separate Go tool for workspace templates
- 2x2, 4x2, 3x3 tmux layouts
- Safe send-keys in Go (not JS)
- Session management TUI

**Why it's right**:
- Independent project
- Can develop/test separately
- Works with or without Tabz
- Simple integration (spawn option)

### ✅ GOOD: Future AI Tool Example

**Instead of**: Adding AI features to Tabz
```typescript
// ❌ Adding to SimpleTerminalApp.tsx
import { AICommandSuggester } from './components/ai'
// +1000 lines of AI code in Tabz
```

**Do this**: Build separate AI TUI
```go
// ✅ ~/projects/ai-terminal/main.go
func main() {
    // AI command suggestions
    // Error diagnostics
    // Runs independently
}
```

**Integration**:
```json
{
  "label": "AI Terminal",
  "command": "~/projects/ai-terminal/ai-terminal",
  "terminalType": "tui-tool",
  "icon": "🤖"
}
```

---

## Maintenance Strategy

### Monthly Review
- [ ] Tests still passing? (98%+ required)
- [ ] Bundle size under 300KB?
- [ ] No new dependencies added?
- [ ] Documentation up to date?

### When to Say NO
- New feature requests → Build as plugin
- "It would be nice if..." → Build as plugin
- "Can we add..." → Build as plugin

### When to Say YES
- Bug fixes
- Performance improvements
- Test coverage improvements
- Documentation improvements

---

## Benefits of This Approach

1. **Sustainability**: Each project stays manageable
2. **Focus**: Tabz does ONE thing well
3. **Flexibility**: Swap/remove plugins without affecting core
4. **Learning**: Each plugin is a focused learning project
5. **Maintenance**: Can put aside and pick up later
6. **Composition**: Mix and match tools as needed

---

## Success Stories

### What Works

**Tabz (master branch)**:
- Lines: ~8,000 (excluding tests)
- Tests: 259 passing (98.4%)
- Bundle: ~200KB gzipped
- Status: **Stable, maintainable** ✅

**tmuxplexer**:
- Independent Go tool
- Works standalone
- Integrates via spawn option
- Status: **Mature, working** ✅

### What Didn't Work

**sessionmanager branch**: Too complex, abandoned
**tmux-manager branch**: Unnecessary, abandoned
**showcase branch**: Feature creep, not merged
**tmux-only branch**: Over-engineered, incomplete

---

## The Unix Philosophy

> Write programs that do one thing and do it well.
> Write programs to work together.
>
> — Doug McIlroy, Bell Labs

**Applied to Tabz**:
- Tabz: Terminal UI (does it well)
- tmuxplexer: Workspace management (does it well)
- tmux: Session persistence (does it well)
- Compose them together → Powerful system

---

## Decision Framework

When someone (including yourself!) asks for a new feature:

```
New Feature Request
        │
        ▼
  Does it fit core scope?
  (Tab mgmt, WebSocket I/O)
        │
    ┌───┴───┐
   YES     NO
    │       │
    ▼       ▼
  Add    Build
   to    plugin
  Tabz     │
    │      │
    ▼      ▼
  Done   Add to
       spawn-options
           │
           ▼
         Done
```

---

## Future Plugin Ideas

Things that should be PLUGINS, not Tabz features:

1. **git-tui**: Git operations (stage, commit, branch, merge)
2. **ai-terminal**: AI command suggestions, error diagnostics
3. **log-viewer**: Colorized log viewing with filtering
4. **process-monitor**: htop-style process viewer
5. **docker-tui**: Docker container management
6. **db-tui**: Database query interface
7. **api-tester**: REST API testing tool
8. **file-browser**: Enhanced file navigation (beyond TFE)

**All can be spawned from Tabz, none need to be IN Tabz.**

---

## Conclusion

**Keep Tabz stable. Build plugins.**

When you feel the urge to add a big new feature:
1. Stop
2. Ask: "Could this be a separate tool?"
3. Build it separately in Go/Bubble Tea
4. Add to spawn-options.json
5. Done!

This keeps projects manageable, prevents burnout, and lets you build amazing things without getting overwhelmed.

---

**References**:
- [LESSONS_LEARNED.md](LESSONS_LEARNED.md) - What NOT to do
- [FEATURE_BRANCHES.md](FEATURE_BRANCHES.md) - Failed experiments
- [tmuxplexer](https://github.com/GGPrompts/tmuxplexer) - Example of good plugin

**Last Updated**: November 15, 2025
