# Starter Prompts for Each Claude Code Session

Copy and paste these prompts into each Claude Code session to kick off development.

---

## Track 1: Tmux-Only Simple
**Session**: `tmux attach -t tmux-only`

```
Hi! I'm ready to build the simplified tmux-only version of terminal-tabs.

Please follow the IMPLEMENTATION_PLAN.md in this directory. Let's start by:

1. Installing shadcn/ui with the recommended configuration (New York style, CSS variables, Neutral base)
2. Adding the required components: table, card, button, badge, dropdown-menu, alert-dialog, hover-card, sheet, input, select, separator, switch, dialog, tabs
3. Removing the Zustand dependencies from package.json

Then we'll build the core components starting with TmuxSessionList. Ready to begin!
```

---

## Track 2: Chrome Extension
**Session**: `tmux attach -t extension`

```
Hi! I'm ready to build the Chrome extension version of terminal-tabs.

Please follow the IMPLEMENTATION_PLAN.md in this directory. Let's start by:

1. Creating the Manifest V3 manifest.json file with all required permissions
2. Setting up the project structure for popup, sidepanel, devtools, and background service worker
3. Installing shadcn/ui and required dependencies including vite-plugin-web-extension
4. Configuring Vite for extension builds

Then we'll build the ExtensionPopup component with the Command palette. Ready to begin!
```

---

## Track 3: Component Showcase ⭐ START HERE
**Session**: `tmux attach -t showcase`

```
Hi! I'm ready to build impressive UI components for terminal-tabs!

Please follow the IMPLEMENTATION_PLAN.md in this directory. Let's start by:

1. Installing shadcn/ui with the recommended configuration
2. Adding ALL required components: carousel, card, badge, hover-card, chart, tabs, select, slider, popover, dialog, command
3. Installing additional packages: recharts, embla-carousel-autoplay, react-colorful, fuse.js, date-fns

Then let's build the TerminalCarousel component first - it's the most visually impressive! We'll implement:
- Horizontal swipeable carousel of terminal thumbnails
- Live preview on hover
- Auto-play mode
- Canvas snapshot functionality from xterm.js

This is the highest priority track - let's make it amazing! Ready to begin!
```

---

## Track 4: AI-Powered Features
**Session**: `tmux attach -t ai-features`

```
Hi! I'm ready to build AI-powered terminal features!

Please follow the IMPLEMENTATION_PLAN.md in this directory. Let's start by:

1. Verifying Ollama is installed and running (we'll use qwen2.5-coder:7b)
2. Installing shadcn/ui and required components: tooltip, alert, collapsible, textarea, dialog, tabs
3. Installing the ollama npm package for backend integration
4. Setting up the AI service in the backend

Then we'll build the AICommandSuggester component with:
- Inline command suggestions as you type
- Context-aware suggestions (cwd, git status, recent commands)
- Tab to accept, Esc to dismiss
- Confidence scores

This is experimental but exciting - let's build the future of terminals! Ready to begin!
```

---

## Quick Copy-Paste Order

1. **Start showcase first** (highest priority, most visual impact)
2. Then tmux-only (architecture validation)
3. Then extension (unique value)
4. Finally ai-features (experimental)

---

## Verification Commands

After starting each Claude Code session, verify it's working:

```bash
# Check Claude Code is running
ps aux | grep claude

# In each tmux session, after pasting the prompt
# You should see Claude start working on the plan
```

---

## Switching Between Sessions

When attached to any tmux session:
- `Ctrl+b s` - Show session list
- Arrow keys - Navigate
- Enter - Attach to selected session
- `Ctrl+b d` - Detach (keeps session running)

---

## If You Need to Restart a Session

```bash
# Kill the session
tmux kill-session -t showcase

# Recreate it
tmux new-session -d -s showcase -c ~/projects/terminal-tabs-showcase

# Attach
tmux attach -t showcase

# Start Claude Code
claude

# Paste the prompt again
```

---

Good luck! 🚀
