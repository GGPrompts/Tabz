# Quick Start Guide

## TL;DR - Get Started in 30 Seconds

```bash
cd ~/projects/terminal-tabs

# Start all 4 tmux sessions
./TMUX_STARTUP.sh

# Attach to showcase track (highest priority)
tmux attach -t showcase

# Inside tmux, start Claude Code
claude
```

## What You Have

✅ **4 Git Worktrees** - Each exploring a different approach
```
~/projects/terminal-tabs-tmux-only/    # Simplified architecture
~/projects/terminal-tabs-extension/    # Chrome extension
~/projects/terminal-tabs-showcase/     # Impressive UI components ⭐
~/projects/terminal-tabs-ai/           # AI-powered features
```

✅ **4 Detailed Implementation Plans** - In each worktree's `IMPLEMENTATION_PLAN.md`

✅ **4 Tmux Sessions Ready** - Just run `./TMUX_STARTUP.sh`

## Recommended Workflow

### Step 1: Start Sessions
```bash
cd ~/projects/terminal-tabs
./TMUX_STARTUP.sh
```

### Step 2: Start with Showcase Track (Best Visual Impact)
```bash
tmux attach -t showcase
claude  # Start Claude Code
```

Tell Claude:
> "Hi! I'm ready to start building the component showcase. Let's begin with the TerminalCarousel component. Can you initialize shadcn/ui and get us started?"

### Step 3: Work in Parallel
Open 3 more terminal windows/panes and attach to other sessions:

**Terminal 2**:
```bash
tmux attach -t tmux-only
claude
```

**Terminal 3**:
```bash
tmux attach -t extension
claude
```

**Terminal 4**:
```bash
tmux attach -t ai-features
claude
```

### Step 4: Switch Between Sessions (If Using One Terminal)
When attached to tmux:
- Press `Ctrl+b s` - Shows session list
- Use arrow keys to select
- Press Enter to attach

## File Locations

| What | Where |
|------|-------|
| Master coordination guide | `~/projects/terminal-tabs/PARALLEL_DEVELOPMENT.md` |
| Track 1 plan | `~/projects/terminal-tabs-tmux-only/IMPLEMENTATION_PLAN.md` |
| Track 2 plan | `~/projects/terminal-tabs-extension/IMPLEMENTATION_PLAN.md` |
| Track 3 plan | `~/projects/terminal-tabs-showcase/IMPLEMENTATION_PLAN.md` ⭐ |
| Track 4 plan | `~/projects/terminal-tabs-ai/IMPLEMENTATION_PLAN.md` |
| This guide | `~/projects/terminal-tabs/QUICK_START.md` |

## Priority Order

1. **🎯 Track 3 (Showcase)** - 30 min
   - Most visual impact
   - Portfolio quality
   - Safe to merge first

2. **Track 1 (Tmux-Only)** - 10 min
   - Validate simplified architecture
   - Optional alternative mode

3. **Track 2 (Extension)** - 10 min
   - Unique distribution
   - Chrome Web Store ready

4. **Track 4 (AI)** - 10 min
   - Experimental features
   - Feature-flagged merge

## What Claude Code Will Build

### Track 3 (Showcase) - START HERE!
- ✨ TerminalCarousel - Swipeable session browser
- 📊 SessionAnalyticsDashboard - Charts & heatmaps
- 👥 CollaborativeTerminal - Multi-user with live cursors
- 🎨 TerminalThemeBuilder - Visual theme editor
- 🔍 CommandPaletteSearch - Cmd+K fuzzy search

### Track 1 (Tmux-Only)
- Simplified state management (no Zustand)
- Pure tmux-based session management
- 40% code reduction

### Track 2 (Chrome Extension)
- Browser toolbar popup
- DevTools panel
- Side panel terminal
- Context menu integrations

### Track 4 (AI Features)
- Inline command suggestions
- Error diagnostics with auto-fix
- Natural language → commands
- Session summarization

## Tmux Cheat Sheet

| Action | Command |
|--------|---------|
| List sessions | `tmux list-sessions` |
| Attach to session | `tmux attach -t showcase` |
| Detach (keep running) | `Ctrl+b d` |
| Switch sessions | `Ctrl+b s` |
| Kill session | `tmux kill-session -t showcase` |
| Kill all sessions | `tmux kill-server` |

## Backend Server

All tracks share the same backend:

```bash
# In a separate terminal
cd ~/projects/terminal-tabs/backend
npm start
```

Backend runs on:
- WebSocket: `ws://localhost:8127`
- REST API: `http://localhost:8127`

## Expected Timeline (1 Hour Total)

- **00:00-00:05** - Setup & start sessions
- **00:05-00:35** - Track 3 (Showcase) - Build 2-3 components
- **00:35-00:45** - Track 1 (Tmux-Only) - Scaffold simplified version
- **00:45-00:55** - Track 2 (Extension) - Set up manifest & popup
- **00:55-01:00** - Track 4 (AI) - Spike on command suggester

## Tips for Maximum Productivity

1. **Start with Track 3** - Most impressive, safest to merge
2. **Run backend once** - Shared across all tracks
3. **Use multiple windows** - One terminal per track
4. **Read the plans** - Each `IMPLEMENTATION_PLAN.md` has step-by-step instructions
5. **Let Claude Code do the work** - Just guide, don't code manually

## Troubleshooting

### Tmux session already exists
```bash
tmux kill-session -t showcase
./TMUX_STARTUP.sh
```

### Backend not running
```bash
cd ~/projects/terminal-tabs/backend
npm start
```

### Worktree doesn't exist
```bash
cd ~/projects/terminal-tabs
git worktree list  # Verify
```

They should all be there! If not:
```bash
git worktree add ../terminal-tabs-showcase -b feat/component-showcase
```

## Ready? Let's Go! 🚀

```bash
cd ~/projects/terminal-tabs
./TMUX_STARTUP.sh
tmux attach -t showcase
claude
```

Then tell Claude:
> "I'm ready to start building! Let's begin with the component showcase track. Initialize shadcn/ui and let's build the TerminalCarousel first!"

Happy coding! 💻✨
