# tmuxplexer Integration Guide

**Last Updated**: November 15, 2025

## Background

Originally, there was a plan to integrate tmuxplexer (the TUI workspace manager at ~/projects/tmuxplexer) as spawn options in Tabz. However, Claude misunderstood and built an entire new Go CLI backend (tmux-manager) instead.

**This document shows the ORIGINAL, SIMPLE approach.**

---

## Why Use tmuxplexer?

tmuxplexer is already a mature tool that:
- ✅ Creates complex tmux workspace layouts (2x2, 4x2, 3x3 grids)
- ✅ Handles `tmux send-keys` safely in Go code (not JavaScript!)
- ✅ Has workspace templates for common setups
- ✅ Works perfectly as a TUI tool
- ✅ Has CLI flags for automation (`--cwd`, `--template`)

**Problem it solves**: React/JavaScript shouldn't use `tmux send-keys` directly (causes terminal corruption). Let tmuxplexer handle it!

---

## Simple Integration (5 minutes)

### Step 1: Add to spawn-options.json

Edit `public/spawn-options.json` and add:

```json
{
  "spawnOptions": [
    // ... existing options ...

    {
      "label": "tmuxplexer Session Manager",
      "command": "tmuxplexer",
      "terminalType": "tui-tool",
      "icon": "🎛️",
      "description": "Launch tmuxplexer to create workspace from templates",
      "defaultSize": { "width": 1400, "height": 900 },
      "defaultTheme": "dracula",
      "defaultTransparency": 100
    }
  ]
}
```

### Step 2: Test It

1. Start Tabz: `npm run dev`
2. Click spawn menu (+ button)
3. Select "tmuxplexer Session Manager"
4. tmuxplexer TUI should open in a new tab
5. Navigate templates, press Enter to create workspace
6. Exit tmuxplexer (q), attach to created session

**That's it!**

---

## Advanced: Direct Template Spawning

You can also add spawn options for specific tmuxplexer templates:

```json
{
  "label": "Workspace: Frontend Dev (2x2)",
  "command": "tmuxplexer --template 0",
  "terminalType": "tui-tool",
  "icon": "🎨",
  "description": "4-pane frontend workspace with Claude, editor, dev server, git"
},
{
  "label": "Workspace: Full Stack (4x2)",
  "command": "tmuxplexer --template 1",
  "terminalType": "tui-tool",
  "icon": "🚀",
  "description": "8-pane full stack workspace"
}
```

**User flow**:
1. Click "Workspace: Frontend Dev (2x2)"
2. tmuxplexer runs in background, creates session
3. Tabz attaches to the session automatically
4. User sees complex multi-pane layout

---

## Why This Is Better Than tmux-manager

| Approach | Effort | Result |
|----------|--------|--------|
| **tmuxplexer integration** | 5 minutes | ✅ Works immediately, safe send-keys |
| **tmux-manager (Go CLI)** | Months | ⚠️ Reimplements what tmuxplexer already does |

tmux-manager Phase 1 is solid engineering, but it's solving a problem that doesn't exist:
- ❌ Reimplements tmux session management (already in Node.js backend)
- ❌ Reimplements workspace templates (already in tmuxplexer)
- ❌ Still needs Phases 2-3 to be useful

vs just using tmuxplexer:
- ✅ Already exists and works
- ✅ Battle-tested send-keys implementation
- ✅ Rich TUI for template management
- ✅ 5-minute integration

---

## Future Enhancements (Optional)

### 1. Add Template Categories

tmuxplexer already supports categories:

```json
// ~/.config/tmuxplexer/templates.json
{
  "templates": [
    {
      "category": "Development",
      "name": "Frontend Dev",
      "layout": "2x2"
    },
    {
      "category": "AI",
      "name": "Claude Workspace",
      "layout": "3x3"
    }
  ]
}
```

### 2. Working Directory Override

Use `--cwd` flag to spawn in specific directory:

```json
{
  "label": "tmuxplexer (current dir)",
  "command": "tmuxplexer --cwd $PWD",
  "terminalType": "tui-tool"
}
```

### 3. JSON Output Mode

If tmuxplexer added `--json` flag, backend could parse output:

```bash
tmuxplexer --template 0 --json
# Output: {"sessionName": "tmux-frontend-abc", "status": "created"}
```

Then Tabz could auto-attach to the created session.

---

## Architecture

```
┌─────────────────────────────────────┐
│  Tabz (React UI)                    │
│  - Tab management                   │
│  - Simple terminals (bash, claude)  │
│  - Spawn tmuxplexer for workspaces  │
└─────────────────────────────────────┘
                │
                ├─→ Simple spawn: Bash, Claude Code
                │   (backend handles directly)
                │
                └─→ Complex workspaces: tmuxplexer
                    (tmuxplexer creates multi-pane layout)
                    (send-keys handled safely in Go!)
```

**Separation of concerns**:
- **React**: UI, tab management, simple terminals
- **tmuxplexer**: Complex layouts, safe send-keys, workspace templates
- **Node.js backend**: WebSocket I/O, session management

---

## What About tmux-manager?

The tmux-manager Go CLI (~/projects/tmux-manager) was built based on a misunderstanding. While Phase 1 is solid work:

**What it does**:
- Wraps tmux commands (start, attach, list, kill)
- Returns structured JSON output
- Plans for API server in Phase 3

**Why it's not needed**:
- Node.js backend already does this
- tmuxplexer already handles workspace creation
- Adds complexity without clear benefit

**Recommendation**: Archive the branch or continue as a learning project, but it's not needed for Tabz.

---

## Summary

**Original intent**: Use tmuxplexer for spawn options
**What happened**: Built entire Go CLI backend (tmux-manager)
**Reality**: Just add tmuxplexer to spawn-options.json

**Benefits of simple approach**:
- ✅ 5-minute integration
- ✅ Uses existing, working tool
- ✅ Safe send-keys (in Go, not JS)
- ✅ No backend rewrite needed

---

## Related Files

- [FEATURE_BRANCHES.md](FEATURE_BRANCHES.md) - Overview of all branches
- [~/projects/tmuxplexer/README.md](../tmuxplexer/README.md) - tmuxplexer documentation
- [public/spawn-options.json](public/spawn-options.json) - Spawn options config

---

**Last Updated**: November 15, 2025
