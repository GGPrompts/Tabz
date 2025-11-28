# Claude Code Plugin System for Tabz

**Date**: November 16, 2025
**Status**: Brainstorm / Planning
**Goal**: Leverage Claude Code's plugin system to distribute Tabz themes, TUI tools, and customizations

---

## Core Concept

Instead of building a custom plugin UI in Tabz, **create Tabz plugins for Claude Code itself!**

Users run Claude Code in a Tabz terminal, then use natural language to install themes, tools, and backgrounds:
- "I want a cyberpunk theme"
- "Add LazyGit to my spawn menu"
- "Install that Matrix rain background"

Claude auto-invokes the appropriate skill and handles installation.

---

## Claude Code Plugin Architecture

### **3 Key Components:**

1. **Skills** (`.claude/skills/SKILL.md`)
   - Markdown files with prompts/instructions for Claude
   - Claude auto-invokes based on user needs (not explicitly called)
   - Can include setup instructions, code templates, file paths

2. **Plugins** (bundles of skills/commands/hooks)
   - Distributed via "marketplaces" (JSON catalogs hosted on GitHub)
   - Users install via `/plugin install plugin-name@marketplace-name`
   - Can contain multiple skills, bundled files, configurations

3. **MCP Servers** (external tools via Model Context Protocol)
   - Extend Claude's capabilities with external data/tools
   - Future enhancement: Live theme/tool catalog server

### **File Structure:**
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json          # Manifest (name, version, description)
├── skills/
│   └── my-skill/
│       └── SKILL.md         # YAML frontmatter + Markdown instructions
├── commands/                # Custom slash commands (optional)
├── agents/                  # Custom agents (optional)
└── hooks/                   # Event handlers (optional)
```

---

## Tabz Plugin Strategy: Hybrid Approach

### **Bundle Popular Items + Fetch Extended Catalog**

**Why Hybrid?**
- ✅ Works offline (bundled files)
- ✅ Fast installation (no network fetch for popular items)
- ✅ Extensible (catalog points to GitHub for more)
- ✅ Community contributions (PRs to add new items)
- ✅ Versioned (specific configs per plugin release)

### **Plugin Structure:**

```
tabz-official-plugin/
├── .claude-plugin/
│   └── plugin.json                    # Plugin manifest
│
├── skills/
│   ├── install-theme/
│   │   └── SKILL.md                   # Install bundled theme
│   ├── browse-themes/
│   │   └── SKILL.md                   # Fetch from GitHub catalog
│   ├── install-tool/
│   │   └── SKILL.md                   # Install TUI tool + spawn config
│   └── install-background/
│       └── SKILL.md                   # Install animated background
│
├── themes/                             # ✅ Bundled theme files (JSON)
│   ├── cyberpunk.json
│   ├── matrix.json
│   ├── amber.json
│   ├── vaporwave.json
│   ├── github-dark.json
│   └── catalog.json                   # Points to GitHub for 200+ more
│
├── spawn-configs/                      # ✅ Pre-made spawn options
│   ├── bash.json
│   ├── claude-code.json
│   ├── lazygit.json
│   ├── k9s.json
│   ├── spotify-tui.json
│   ├── htop.json
│   ├── ranger.json
│   └── catalog.json                   # Points to GitHub for more
│
├── backgrounds/                        # ✅ Background scripts
│   ├── matrix-rain.js
│   ├── synthwave-grid.js
│   ├── particle-system.js
│   └── README.md
│
└── README.md                          # Usage documentation
```

---

## Example: Bundled Spawn Config

**spawn-configs/lazygit.json:**
```json
{
  "label": "LazyGit",
  "command": "lazygit",
  "terminalType": "lazygit",
  "icon": "git-branch",
  "description": "Beautiful git TUI for version control",
  "defaultTheme": "cyberpunk",
  "defaultTransparency": 95,
  "defaultSize": { "width": 1200, "height": 800 },
  "install": {
    "macos": "brew install lazygit",
    "linux": "sudo apt install lazygit || sudo pacman -S lazygit",
    "termux": "pkg install lazygit"
  },
  "usage": "Opens in current git repository. Use arrows to navigate, 'a' to stage, 'c' to commit.",
  "info": {
    "github": "https://github.com/jesseduffield/lazygit",
    "docs": "https://github.com/jesseduffield/lazygit/blob/master/docs/Config.md",
    "homepage": "https://github.com/jesseduffield/lazygit"
  }
}
```

**Key Addition:** `info` object with links for the sidebar info panel!

---

## Example: Skill (SKILL.md)

**skills/install-tool/SKILL.md:**
```yaml
---
name: tabz-install-tool
description: Install a TUI tool and add to Tabz spawn menu. Use when user wants to add tools like LazyGit, k9s, spotify-tui, htop, ranger, etc.
---

# Install TUI Tool for Tabz

## Step 1: Find Tool Config

Check bundled spawn configs:
```bash
ls ~/.claude/plugins/tabz-official/spawn-configs/
# lazygit.json, k9s.json, spotify-tui.json, etc.
```

If not found, check GitHub catalog:
```bash
curl https://raw.githubusercontent.com/GGPrompts/tabz-tools/main/catalog.json
```

## Step 2: Read Config

```typescript
const toolConfig = JSON.parse(
  fs.readFileSync('~/.claude/plugins/tabz-official/spawn-configs/lazygit.json')
)
```

## Step 3: Check if Tool is Installed

```bash
which ${toolConfig.command}
```

If not installed, show install command for user's platform:
- macOS: `toolConfig.install.macos`
- Linux: `toolConfig.install.linux`
- Termux: `toolConfig.install.termux`

## Step 4: Add to Spawn Options

Edit `public/spawn-options.json`:
```typescript
const spawnOptions = JSON.parse(fs.readFileSync('public/spawn-options.json'))
spawnOptions.spawnOptions.push(toolConfig)
fs.writeFileSync('public/spawn-options.json', JSON.stringify(spawnOptions, null, 2))
```

## Step 5: Verify

```bash
${toolConfig.command} --version
```

Done! Tool is now available in right-click spawn menu.

**Usage tip:** Display `toolConfig.usage` to user.
```

---

## User Workflows

### **1. Installing Theme (Bundled)**
```
User: "Install the Matrix green theme"

Claude (auto-invokes tabz-install-theme skill):
✅ Found "Matrix Rain" theme in plugin
✅ Added to terminal-themes.ts
✅ Available in Settings → Theme → "Matrix Rain"

Preview: [screenshot from bundled README]
```

### **2. Installing Theme (From Catalog)**
```
User: "I want a Catppuccin theme"

Claude:
❌ Not found in bundled themes
🔍 Checking GitHub catalog...
✅ Found "Catppuccin Mocha" by @community-user
✅ Downloaded from GitHub
✅ Added to terminal-themes.ts

Preview: https://tabz.dev/themes/catppuccin-mocha
```

### **3. Installing TUI Tool**
```
User: "Add spotify-tui"

Claude:
✅ Found spawn config in plugin
🔍 Checking if spotify-tui is installed...
❌ Not installed

Would you like me to install it?
$ brew install spotify-tui

[User: yes]

✅ Installed spotify-tui (v0.25.0)
✅ Added to spawn menu
✅ Right-click → "Spotify TUI" now available

Usage tip: Run 'spt' to authorize with Spotify first
```

### **4. Installing Background**
```
User: "I want that Matrix rain background"

Claude:
✅ Found matrix-rain.js in plugin
✅ Copied to public/backgrounds/
✅ Updated SimpleTerminalApp.tsx background config

Refresh the page to see the effect!
Preview: https://tabz.dev/backgrounds/matrix
```

---

## Distribution Strategy

### **1. Official Marketplace**

**Hosted on GitHub:**
```json
// tabz-marketplace.json
{
  "name": "tabz-official",
  "description": "Official Tabz themes, tools, and backgrounds",
  "repository": "https://github.com/GGPrompts/tabz-marketplace",
  "plugins": [
    {
      "name": "tabz-official",
      "source": "github:GGPrompts/tabz-official-plugin",
      "description": "15+ themes, 12+ TUI tools, animated backgrounds"
    }
  ]
}
```

### **2. User Installation**

```bash
# In Claude Code terminal (running in Tabz):

# Browse available plugins
/plugin

# Install official plugin
/plugin install tabz-official@tabz-marketplace

# Now use natural language:
"Install cyberpunk theme"
"Add LazyGit"
"Show me all available themes"
```

### **3. Community Contributions**

Users can create their own plugins:

```bash
# Community member creates custom themes
my-themes-plugin/
├── .claude-plugin/plugin.json
├── skills/install-theme/SKILL.md
└── themes/
    ├── neon-city.json
    ├── blade-runner.json
    └── tron-legacy.json

# Publish to GitHub
# Others install: /plugin install my-themes@github-username
```

---

## NEW IDEA: Info Sidebar for Spawn Options

**Concept:** When viewing a spawn option, show an info panel with:
- Description
- Installation instructions
- Links to GitHub, docs, homepage
- Screenshots/previews
- Usage tips
- Keybindings/shortcuts

### **UI Mockup:**

```
┌─────────────────────────┬─────────────────────────┐
│ Settings Modal          │ Info Sidebar            │
│                         │                         │
│ Spawn Options:          │ 📦 LazyGit              │
│                         │                         │
│ [🤖 Claude Code    ℹ️]  │ Beautiful git TUI for   │
│ [📂 Bash           ℹ️]  │ version control         │
│ [🎵 Git Branch     ℹ️] ←│                         │
│ [☸️  Container     ℹ️]  │ 🔗 Links:               │
│                         │ • GitHub                │
│ [+ Add New]             │ • Documentation         │
│                         │                         │
│                         │ 📦 Install:             │
│                         │ macOS: brew install ... │
│                         │ Linux: apt install ...  │
│                         │                         │
│                         │ 💡 Usage:               │
│                         │ Opens in current git... │
│                         │                         │
│                         │ ⌨️  Shortcuts:          │
│                         │ a - Stage               │
│                         │ c - Commit              │
│                         │ P - Push                │
└─────────────────────────┴─────────────────────────┘
```

### **Implementation:**

**1. Extend spawn-options.json schema:**
```json
{
  "label": "LazyGit",
  "command": "lazygit",
  "terminalType": "lazygit",
  "icon": "git-branch",
  "description": "Beautiful git TUI for version control",
  "info": {
    "github": "https://github.com/jesseduffield/lazygit",
    "docs": "https://github.com/jesseduffield/lazygit/blob/master/docs/Config.md",
    "homepage": "https://github.com/jesseduffield/lazygit",
    "screenshots": [
      "https://raw.githubusercontent.com/jesseduffield/lazygit/master/docs/resources/demo.gif"
    ],
    "install": {
      "macos": "brew install lazygit",
      "linux": "sudo apt install lazygit",
      "termux": "pkg install lazygit"
    },
    "usage": "Opens in current git repository. Use arrows to navigate, 'a' to stage, 'c' to commit, 'P' to push.",
    "shortcuts": [
      { "key": "a", "action": "Stage file" },
      { "key": "c", "action": "Commit" },
      { "key": "P", "action": "Push" },
      { "key": "p", "action": "Pull" }
    ]
  }
}
```

**2. Add info button to spawn option rows:**
```typescript
// In Settings modal spawn options list
<div className="spawn-option-row">
  <Icon icon={option.icon} />
  <span>{option.label}</span>
  <button onClick={() => setShowInfo(option)}>
    <InfoIcon /> {/* ℹ️ button */}
  </button>
</div>
```

**3. Create InfoSidebar component:**
```typescript
// src/components/InfoSidebar.tsx
interface InfoSidebarProps {
  spawnOption: SpawnOption
  onClose: () => void
}

const InfoSidebar = ({ spawnOption, onClose }) => {
  return (
    <div className="info-sidebar">
      <h2>{spawnOption.label}</h2>
      <p>{spawnOption.description}</p>

      {spawnOption.info?.github && (
        <div className="links">
          <h3>Links</h3>
          <a href={spawnOption.info.github} target="_blank">
            GitHub
          </a>
          <a href={spawnOption.info.docs} target="_blank">
            Documentation
          </a>
        </div>
      )}

      {spawnOption.info?.install && (
        <div className="install">
          <h3>Install</h3>
          <code>{spawnOption.info.install.macos}</code>
          <code>{spawnOption.info.install.linux}</code>
        </div>
      )}

      {spawnOption.info?.usage && (
        <div className="usage">
          <h3>Usage</h3>
          <p>{spawnOption.info.usage}</p>
        </div>
      )}

      {spawnOption.info?.shortcuts && (
        <div className="shortcuts">
          <h3>Keyboard Shortcuts</h3>
          {spawnOption.info.shortcuts.map(s => (
            <div key={s.key}>
              <kbd>{s.key}</kbd> - {s.action}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**4. Integration with plugin system:**

When Claude installs a tool via plugin, it includes the full `info` object:
```typescript
// Claude reads from bundled spawn-configs/lazygit.json
// Adds entire config including info object to spawn-options.json
// User clicks ℹ️ button → sees GitHub link, install instructions, etc.
```

---

## Why This Approach is Brilliant

### **Comparison: Custom UI vs Claude Code Plugins**

| Aspect | Custom Plugin UI | Claude Code Plugins |
|--------|------------------|---------------------|
| **UI Development** | Build theme browser, tool catalog, search, filters | ✅ Zero - use `/plugin` + natural language |
| **Installation** | Click "Install" buttons | ✅ "add cyberpunk theme" |
| **Discovery** | SEO, marketing, showcase site | ✅ Claude Code marketplace + `/plugin` |
| **Updates** | Build update checker, notifications | ✅ Re-run skill or plugin update |
| **Community** | Build submission system, moderation | ✅ GitHub PRs to plugin repo |
| **Maintenance** | Maintain web app, database, hosting | ✅ Just update JSON files |
| **Cost** | Hosting, CDN, database | ✅ Free (GitHub Pages) |
| **Offline** | Requires online catalog | ✅ Bundled files work offline |

### **Benefits:**

✅ **Zero UI Development** - Claude Code has plugin discovery built-in
✅ **Natural Language** - "I want LazyGit" vs clicking through menus
✅ **Claude Does The Work** - Installs, configures, verifies automatically
✅ **GitHub-Native** - Version control, PRs, community contributions
✅ **Automatic Updates** - Skills reference latest GitHub URLs
✅ **Offline-First** - Bundled files work without internet
✅ **Info Sidebar** - Rich documentation for each tool/theme

---

## Implementation Roadmap

### **Phase 1: Create Plugin Structure (2-3 days)**
- [ ] Create `tabz-official-plugin` repository
- [ ] Write `plugin.json` manifest
- [ ] Create bundled theme files (10-15 popular themes)
- [ ] Create bundled spawn configs (10-12 TUI tools)
- [ ] Write skills for theme/tool installation
- [ ] Add `info` objects to all spawn configs

### **Phase 2: Test Plugin Installation (1 day)**
- [ ] Install plugin locally in Claude Code
- [ ] Test: "Install cyberpunk theme"
- [ ] Test: "Add LazyGit to spawn menu"
- [ ] Test: "Show me all available themes"
- [ ] Verify `info` objects work with sidebar

### **Phase 3: Build Info Sidebar (2-3 days)**
- [ ] Extend spawn-options.json schema with `info` object
- [ ] Create `InfoSidebar` component
- [ ] Add ℹ️ button to spawn option rows
- [ ] Style sidebar with glassmorphic design
- [ ] Support clickable links (GitHub, docs, homepage)
- [ ] Display screenshots/GIFs
- [ ] Show install instructions per platform

### **Phase 4: Marketplace + Showcase (2 days)**
- [ ] Create `tabz-marketplace` repository
- [ ] Host marketplace.json on GitHub Pages
- [ ] Build showcase site (Next.js):
  - Landing page with hero + features
  - Theme gallery with screenshots
  - TUI tools directory
  - Background demos
  - Installation guide
- [ ] Add plugin submission guide for community

### **Phase 5: Community Launch (1 day)**
- [ ] Publish plugin to marketplace
- [ ] Write blog post / README
- [ ] Share on Reddit/HN/Twitter
- [ ] Create video demo (themes, tools, Claude integration)

---

## Future Enhancements

### **MCP Server for Live Catalog**
Build an MCP server that provides real-time theme/tool data:

```typescript
// tabz-mcp-server provides tools:
- list_themes({ category?, tags? })    // Returns available themes
- install_theme(id)                    // Installs theme to Tabz
- preview_theme(id)                    // Shows screenshot
- search_tools(query)                  // Searches TUI tools
- get_tool_info(id)                    // Returns install, docs, etc.

// Claude can use these automatically:
User: "Show me dark themes"
Claude: [calls list_themes({category: 'dark'})]
        Here are 5 dark themes: Cyberpunk, Matrix, GitHub Dark...

User: "Install the first one"
Claude: [calls install_theme('cyberpunk')]
        ✅ Installed Cyberpunk Neon theme!
```

### **Plugin Versioning & Updates**
```bash
# Check for updates
/plugin update tabz-official

# Get new themes/tools from latest release
Claude: 5 new themes and 3 new tools available!
- Gruvbox Dark
- Nord
- Tokyo Night
```

### **Import/Export Configs**
```typescript
// User clicks "Share My Setup"
const config = {
  themes: [...],
  spawnOptions: [...],
  background: {...},
  layout: {...}
}

// Uploads to tabz.dev/setups/abc123
// Other users: One-click import entire setup
```

---

## Open Questions

1. **Should we build the info sidebar first, or the plugin system?**
   - Sidebar could work independently with manual spawn-options.json editing
   - Plugin could reference sidebar in skill instructions

2. **Should bundled configs include ALL info, or just basics?**
   - Full info = larger plugin download
   - Basic info + fetch details on demand = smaller, more flexible

3. **How to handle platform detection in skills?**
   - Claude can detect via `uname -s`
   - Skill provides install commands for all platforms, Claude picks right one

4. **Should backgrounds be bundled JS files or URLs?**
   - Bundled = works offline, versioned
   - URLs = smaller plugin, can update independently

5. **How to showcase themes without building full UI?**
   - Screenshots in plugin README
   - Link to tabz.dev showcase site
   - GIFs embedded in skill instructions

---

## Conclusion

The Claude Code plugin system is a **perfect fit** for Tabz customization. Instead of building a complex UI for theme/tool discovery, we leverage:

1. **Claude's intelligence** - Understands "I want a cyberpunk theme"
2. **Skills system** - Auto-invokes installation instructions
3. **Bundled files** - Works offline, fast, reliable
4. **GitHub distribution** - Free hosting, version control, community PRs
5. **Info sidebar** - Rich documentation without bloating the plugin

This approach turns Tabz from "just another terminal" into a **customizable platform** with a thriving ecosystem - just like Obsidian, VS Code, and Neovim.

**Next Step:** Build Phase 1 (plugin structure) or Phase 3 (info sidebar)?
