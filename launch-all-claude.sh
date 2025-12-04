#!/bin/bash

# Complete automation: Create tmux sessions, launch Claude Code, send prompts

set -e

echo "🚀 Terminal-Tabs: Complete Parallel Development Setup"
echo "======================================================"
echo ""

# Track 1: Tmux-Only Simple
echo "📦 Setting up tmux-only session..."
if tmux has-session -t tmux-only 2>/dev/null; then
  echo "   Killing existing session..."
  tmux kill-session -t tmux-only
fi
tmux new-session -d -s tmux-only -c ~/projects/terminal-tabs-tmux-only
tmux send-keys -t tmux-only 'claude' C-m
echo "   ✅ Claude Code launched in tmux-only"

sleep 3  # Give Claude Code time to start

# Send the prompt
tmux send-keys -t tmux-only "Hi! I'm ready to build the simplified tmux-only version of terminal-tabs.

Please follow the IMPLEMENTATION_PLAN.md in this directory. Let's start by:

1. Installing shadcn/ui with the recommended configuration (New York style, CSS variables, Neutral base)
2. Adding the required components: table, card, button, badge, dropdown-menu, alert-dialog, hover-card, sheet, input, select, separator, switch, dialog, tabs
3. Removing the Zustand dependencies from package.json

Then we'll build the core components starting with TmuxSessionList. Ready to begin!" C-m

echo "   ✅ Prompt sent to tmux-only"
echo ""

# Track 2: Chrome Extension
echo "🌐 Setting up extension session..."
if tmux has-session -t extension 2>/dev/null; then
  echo "   Killing existing session..."
  tmux kill-session -t extension
fi
tmux new-session -d -s extension -c ~/projects/terminal-tabs-extension
tmux send-keys -t extension 'claude' C-m
echo "   ✅ Claude Code launched in extension"

sleep 3

tmux send-keys -t extension "Hi! I'm ready to build the Chrome extension version of terminal-tabs.

Please follow the IMPLEMENTATION_PLAN.md in this directory. Let's start by:

1. Creating the Manifest V3 manifest.json file with all required permissions
2. Setting up the project structure for popup, sidepanel, devtools, and background service worker
3. Installing shadcn/ui and required dependencies including vite-plugin-web-extension
4. Configuring Vite for extension builds

Then we'll build the ExtensionPopup component with the Command palette. Ready to begin!" C-m

echo "   ✅ Prompt sent to extension"
echo ""

# Track 3: Component Showcase (PRIORITY)
echo "✨ Setting up showcase session (PRIORITY)..."
if tmux has-session -t showcase 2>/dev/null; then
  echo "   Killing existing session..."
  tmux kill-session -t showcase
fi
tmux new-session -d -s showcase -c ~/projects/terminal-tabs-showcase
tmux send-keys -t showcase 'claude' C-m
echo "   ✅ Claude Code launched in showcase"

sleep 3

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

This is the highest priority track - let's make it amazing! Ready to begin!" C-m

echo "   ✅ Prompt sent to showcase"
echo ""

# Track 4: AI Features
echo "🤖 Setting up ai-features session..."
if tmux has-session -t ai-features 2>/dev/null; then
  echo "   Killing existing session..."
  tmux kill-session -t ai-features
fi
tmux new-session -d -s ai-features -c ~/projects/terminal-tabs-ai
tmux send-keys -t ai-features 'claude' C-m
echo "   ✅ Claude Code launched in ai-features"

sleep 3

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

This is experimental but exciting - let's build the future of terminals! Ready to begin!" C-m

echo "   ✅ Prompt sent to ai-features"
echo ""

echo "======================================================"
echo "✅ ALL SESSIONS LAUNCHED AND PROMPTED!"
echo "======================================================"
echo ""
echo "📋 Active Claude Code sessions:"
echo "  1. ✨ showcase     - Component Showcase (HIGH PRIORITY)"
echo "  2. 📦 tmux-only    - Simplified Architecture"
echo "  3. 🌐 extension    - Chrome Extension"
echo "  4. 🤖 ai-features  - AI-Powered Features"
echo ""
echo "🎯 Recommended: Start by watching showcase session"
echo "   tmux attach -t showcase"
echo ""
echo "⌨️  Switch between sessions: Ctrl+b s"
echo "🔌 Detach from session: Ctrl+b d"
echo ""
echo "📊 View all sessions:"
echo "   tmux list-sessions"
echo ""
echo "🛑 Stop all sessions:"
echo "   tmux kill-server"
echo ""
echo "Happy building! 🚀"
echo ""
