# Changelog

All notable changes to Terminal Tabs will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2025-11-08

### ✨ Major Features

#### Terminal Persistence (COMPLETE) 🎉
- **All terminals persist through page refresh** - Fixed critical xterm.js initialization bug
- Changed from `display: none` to `visibility: hidden` with absolute positioning
- All terminals render properly, not just the active tab
- Sessions survive via tmux integration (when enabled)

#### Tmux Integration (COMPLETE)
- **Tmux toggle in header** - Enable/disable tmux for spawns (default: ON)
- Backend spawns terminals with unique tmux sessions (`tt-bash-xyz`, `tt-cc-abc`)
- Sessions survive backend restarts and page refreshes
- Custom tmux config (`.tmux-terminal-tabs.conf`) optimized for Terminal Tabs
- Query API for active tmux sessions

#### Per-Tab Customization
- **Footer controls** - Quick access to font size (+/-), refit, customize panel
- **Customize modal** - Change theme, transparency, font family per tab
- **Persistent settings** - All customizations save to localStorage per-tab
- **Spawn defaults** - New terminals always use defaults from spawn-options.json
- Tab-specific changes don't affect other tabs or new spawns

#### Beautiful Logging
- **Consola integration** - Colored, structured logging with emojis
- **Log levels** - Control verbosity via `LOG_LEVEL` environment variable
- **Dev Logs terminal** - View backend logs directly in-app
- **Safe logging** - Never logs terminal data/ANSI sequences (prevents host corruption)

### 🐛 Bug Fixes

#### Critical Fixes
- **Terminal persistence** - Fixed xterm.js requiring non-zero container dimensions
- **Escape sequence leak** - Stopped ANSI codes from corrupting host terminal
- **Text loss on tab switch** - All terminals now render simultaneously, switched via CSS
- **Duplicate isSelected** - Removed duplicate prop causing Vite warnings
- **Commands not executing** - Fixed bash terminals spawning without commands
- **Working directory validation** - Tilde paths (`~/projects`) now expand correctly
- **Duplicate terminals** - Fixed race condition using `useRef` for synchronous tracking

#### Minor Fixes
- **Font size modal** - Shows "16 (default)" when editing spawn options without fontSize
- **Scrollbar overlap** - Hidden with tmux, visible with 10k scrollback when tmux off
- **Footer controls** - Properly reflect initial values from spawn options
- **Dropdown visibility** - All dropdowns now have dark backgrounds
- **Refit button** - Actually unsticks terminals (calls proper refit() method)

### 🎨 UI/UX Improvements
- **Dynamic theme backgrounds** - App background transitions to match active terminal theme
- **Footer layout** - Changed from expanding panel to floating modal (keeps terminal full-size)
- **Responsive footer** - Works on ultra-wide, desktop, tablet, and mobile
- **Conditional scrollbar** - Hidden with tmux, styled scrollbar without
- **Spawn options manager** - Edit spawn-options.json with live preview
- **Metadata readability** - Fixed brightBlack colors for better diff/timestamp visibility

### 🔧 Technical Improvements
- **Cleanup on refresh** - Prevents PTY process buildup
- **Request ID tracking** - Reliable placeholder-to-agent matching
- **Session name format** - Short, unique names (`tt-{type}-{random}`)
- **Safe spawn tracking** - `useRef` eliminates race conditions
- **Error logging** - Validation failures now logged (no silent failures)

### 📝 Documentation
- **CLAUDE.md** - Updated with persistence fix details and current status
- **NEXT_SESSION_PROMPT.md** - Complete session summary with debugging notes
- **DEBUG_PERSISTENCE.md** - Detailed debugging analysis (user-created)
- **Launcher scripts** - `start.sh`, `stop.sh`, `start-tmux.sh` with docs

---

## [1.0.0] - 2025-11-07

### Initial Release - MVP Complete

#### Core Features
- **Tab-based interface** - Browser-style tabs for terminals
- **15 terminal types** - Claude Code, Bash, TFE, LazyGit, and more
- **Full terminal emulation** - xterm.js with WebGL rendering
- **WebSocket communication** - Real-time I/O
- **Theme system** - 14 themes with intuitive aliases
- **Spawn menu** - Right-click or Ctrl+T to spawn terminals
- **Connection status** - Visual indicator for WebSocket state

#### Terminal Types Supported
- Claude Code (🤖)
- OpenCode (🔧)
- Gemini (✨)
- Docker AI (🐳)
- Orchestrator (🎭)
- Bash (💻)
- TFE - Terminal File Explorer (📁)
- LazyGit (🌿)
- PyRadio (📻)
- Micro Editor (✏️)
- htop (📊)
- bottom (📈)
- Spotify (🎵)
- Dev Logs (📋)
- TUI Tool (generic) (🖥️)

#### Themes Available
- Default (GitHub Dark)
- Retro Amber
- Matrix Rain
- Dracula
- Monokai
- Solarized Dark/Light
- GitHub Dark
- Nord
- Cyberpunk Neon
- Holographic
- Vaporwave Dreams
- Deep Ocean
- Neon City
- Tokyo Night

#### Architecture
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + PTY
- **State**: Zustand with localStorage persistence
- **Settings**: Global settings store
- **Communication**: WebSocket + REST API

---

## Upcoming Features (Planned)

### v1.2 - UX Improvements
- [ ] Keyboard shortcuts (Ctrl+T, Ctrl+W, Ctrl+Tab, Ctrl+1-9, Ctrl+Shift+T)
- [ ] Tab reordering (drag & drop)
- [ ] Tab context menu (close others, close to right, rename)
- [ ] Session manager UI (reconnect to orphaned tmux sessions)

### v1.3 - Mobile Support
- [ ] Responsive CSS for tablets/phones
- [ ] Touch-friendly tab switching
- [ ] Mobile keyboard support
- [ ] PWA manifest

### v2.0 - Advanced Features
- [ ] Claude Code theme integration (6 specialized palettes)
- [ ] Light theme support
- [ ] Split panes (or tmuxplexer templates)
- [ ] Tab groups/folders
- [ ] Search across terminals
- [ ] Export terminal output

---

## Technical Details

### Breaking Changes
None yet - this is the first stable release.

### Deprecations
None yet.

### Known Issues
- No keyboard shortcuts yet (planned for v1.2)
- Mobile responsiveness needs testing
- Tab bar doesn't scroll with many tabs (>10)

### Migration Notes
- **v1.0 → v1.1**: Automatic - localStorage schema is backward compatible
- **spawn-options.json**: Working as designed - each entry is essentially a "profile"

---

**Repository**: https://github.com/GGPrompts/terminal-tabs
**Parent Project**: https://github.com/GGPrompts/opustrator
**License**: MIT
