#!/bin/bash

# Send starter prompts to all Claude Code tmux sessions
# This assumes Claude Code is already running in each session

echo "🚀 Sending starter prompts to all Claude Code sessions..."
echo ""

# Track 3: Showcase (PRIORITY)
echo "📦 Sending prompt to showcase session..."
tmux send-keys -t showcase "Hi! I'm ready to build impressive UI components for terminal-tabs!

Please follow the IMPLEMENTATION_PLAN.md in this directory. Let's start by:

1. Installing shadcn/ui with the recommended configuration
2. Adding ALL required components: carousel, card, badge, hover-card, chart, tabs, select, slider, popover, dialog, command
3. Installing additional packages: recharts, embla-carousel-autoplay, react-colorful, fuse.js, date-fns

Then let's build the TerminalCarousel component first - it's the most visually impressive! We'll implement:
- Horizontal swipeable carousel of terminal thumbnails
- Live preview on hover
- Auto-play mode
- Canvas snapshot functionality from xterm.js

This is the highest priority track - let's make it amazing! Ready to begin!"
# Submit the prompt
tmux send-keys -t showcase C-m

sleep 2

# Track 1: Tmux-Only
echo "📦 Sending prompt to tmux-only session..."
tmux send-keys -t tmux-only "Hi! I'm ready to build the simplified tmux-only version of terminal-tabs.

Please follow the IMPLEMENTATION_PLAN.md in this directory. Let's start by:

1. Installing shadcn/ui with the recommended configuration (New York style, CSS variables, Neutral base)
2. Adding the required components: table, card, button, badge, dropdown-menu, alert-dialog, hover-card, sheet, input, select, separator, switch, dialog, tabs
3. Removing the Zustand dependencies from package.json

Then we'll build the core components starting with TmuxSessionList. Ready to begin!"
# Submit the prompt
tmux send-keys -t tmux-only C-m

sleep 2

# Track 2: Extension
echo "🌐 Sending prompt to extension session..."
tmux send-keys -t extension "Hi! I'm ready to build the Chrome extension version of terminal-tabs.

Please follow the IMPLEMENTATION_PLAN.md in this directory. Let's start by:

1. Creating the Manifest V3 manifest.json file with all required permissions
2. Setting up the project structure for popup, sidepanel, devtools, and background service worker
3. Installing shadcn/ui and required dependencies including vite-plugin-web-extension
4. Configuring Vite for extension builds

Then we'll build the ExtensionPopup component with the Command palette. Ready to begin!"
# Submit the prompt
tmux send-keys -t extension C-m

sleep 2

# Track 4: AI Features
echo "🤖 Sending prompt to ai-features session..."
tmux send-keys -t ai-features "Hi! I'm ready to build AI-powered terminal features!

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

This is experimental but exciting - let's build the future of terminals! Ready to begin!"
# Submit the prompt
tmux send-keys -t ai-features C-m

echo ""
echo "✅ All prompts sent and submitted!"
echo ""
echo "📋 Sessions started in priority order:"
echo "  1. ✨ showcase (PRIORITY - most visual impact)"
echo "  2. 📦 tmux-only (simplified architecture)"
echo "  3. 🌐 extension (Chrome extension)"
echo "  4. 🤖 ai-features (experimental AI)"
echo ""
echo "To view each session:"
echo "  tmux attach -t showcase"
echo "  tmux attach -t tmux-only"
echo "  tmux attach -t extension"
echo "  tmux attach -t ai-features"
echo ""
echo "Switch between sessions: Ctrl+b s"
echo ""
echo "Happy building! 🚀"
