#!/bin/bash

# Terminal-Tabs: Parallel Development Tmux Startup Script
# Creates 4 tmux sessions, one for each development track

set -e

echo "🚀 Starting Terminal-Tabs Parallel Development Sessions..."

# Track 1: Tmux-Only Simple
if ! tmux has-session -t tmux-only 2>/dev/null; then
  echo "📦 Creating session: tmux-only"
  tmux new-session -d -s tmux-only -c ~/projects/terminal-tabs-tmux-only
  tmux send-keys -t tmux-only 'echo "Track 1: Tmux-Only Simple"' C-m
  tmux send-keys -t tmux-only 'echo "See IMPLEMENTATION_PLAN.md for details"' C-m
  tmux send-keys -t tmux-only 'echo ""' C-m
  tmux send-keys -t tmux-only 'echo "Ready for Claude Code! Type: claude"' C-m
else
  echo "✅ Session tmux-only already exists"
fi

# Track 2: Chrome Extension
if ! tmux has-session -t extension 2>/dev/null; then
  echo "🌐 Creating session: extension"
  tmux new-session -d -s extension -c ~/projects/terminal-tabs-extension
  tmux send-keys -t extension 'echo "Track 2: Chrome Extension"' C-m
  tmux send-keys -t extension 'echo "See IMPLEMENTATION_PLAN.md for details"' C-m
  tmux send-keys -t extension 'echo ""' C-m
  tmux send-keys -t extension 'echo "Ready for Claude Code! Type: claude"' C-m
else
  echo "✅ Session extension already exists"
fi

# Track 3: Component Showcase
if ! tmux has-session -t showcase 2>/dev/null; then
  echo "✨ Creating session: showcase"
  tmux new-session -d -s showcase -c ~/projects/terminal-tabs-showcase
  tmux send-keys -t showcase 'echo "Track 3: Component Showcase"' C-m
  tmux send-keys -t showcase 'echo "See IMPLEMENTATION_PLAN.md for details"' C-m
  tmux send-keys -t showcase 'echo ""' C-m
  tmux send-keys -t showcase 'echo "🎯 HIGH PRIORITY - Start here!"' C-m
  tmux send-keys -t showcase 'echo "Ready for Claude Code! Type: claude"' C-m
else
  echo "✅ Session showcase already exists"
fi

# Track 4: AI Features
if ! tmux has-session -t ai-features 2>/dev/null; then
  echo "🤖 Creating session: ai-features"
  tmux new-session -d -s ai-features -c ~/projects/terminal-tabs-ai
  tmux send-keys -t ai-features 'echo "Track 4: AI-Powered Features"' C-m
  tmux send-keys -t ai-features 'echo "See IMPLEMENTATION_PLAN.md for details"' C-m
  tmux send-keys -t ai-features 'echo ""' C-m
  tmux send-keys -t ai-features 'echo "Ready for Claude Code! Type: claude"' C-m
else
  echo "✅ Session ai-features already exists"
fi

echo ""
echo "✅ All tmux sessions created!"
echo ""
echo "📋 Available sessions:"
echo "  1. tmux-only    - Simplified tmux-based architecture"
echo "  2. extension    - Chrome extension version"
echo "  3. showcase     - Advanced UI components (START HERE!)"
echo "  4. ai-features  - AI-powered terminal features"
echo ""
echo "🎯 Recommended start: showcase (most visual impact)"
echo ""
echo "To attach to a session:"
echo "  tmux attach -t showcase"
echo ""
echo "To switch between sessions (when attached):"
echo "  Ctrl+b s    (shows session list)"
echo ""
echo "To see session list:"
echo "  tmux list-sessions"
echo ""
echo "Happy coding! 🚀"
