# Next Session: Project Management UI

## ✅ Completed This Session (Nov 13, 2025)

### 1. Fixed All Failing Tests ✅ (214/214 Tests Passing - 100%)

**Problem:** 10 tests failing due to:
- `usePopout.ts` window.open signature changes (2 tests)
- Zustand persist timing issues in multi-window tests (8 tests)

**Solution:**
- Updated `usePopout` test expectations for new `popoutMode` parameter
- Added `waitFor()` from `@testing-library/react` to wait for Zustand persist to complete

**Files Modified:**
- `tests/unit/hooks/usePopout.test.ts` - Fixed 2 tests for popout mode
- `tests/integration/multi-window-popout.test.ts` - Fixed 8 tests with async/await
- `tests/unit/hooks/useTerminalSpawning.test.ts` - Added 1 new test
- `tests/integration/terminal-spawning.test.ts` - Added 1 new test

**Test Results:** 206/214 → **214/214 passing** 🎉

---

### 2. Working Directory Priority Fix ✅

**Problem:** Spawn menu's top-level "Working Directory Override" input overrode ALL spawn options, even those with explicit `workingDir` set (like Dev Logs → `/tmp`).

**Solution:** Changed priority order in `useTerminalSpawning.ts`:

```typescript
// BEFORE (broken)
const effectiveWorkingDir = option.workingDirOverride || option.workingDir || globalWorkingDir

// AFTER (fixed)
const effectiveWorkingDir = option.workingDir || option.workingDirOverride || globalWorkingDir
```

**New Priority (highest to lowest):**
1. **Spawn option's explicit `workingDir`** - Dev Logs with `/tmp` always uses `/tmp`
2. **Spawn menu's override input** - Manual override for options without `workingDir`
3. **Global default from Settings** - Fallback for everything else

**Files Modified:**
- `src/hooks/useTerminalSpawning.ts` (line 88) - Changed priority order
- `tests/unit/hooks/useTerminalSpawning.test.ts` - Updated test + added new test
- `tests/integration/terminal-spawning.test.ts` - Updated test + added new test

**Impact:**
- ✅ Spawn options with explicit `workingDir` are never overridden
- ✅ Spawn menu override works for generic options (Claude Code, Bash)
- ✅ Global default provides final fallback

---

### 3. Project Dropdown Implementation ✅

**Feature:** Added project selector dropdown to Global Settings Modal for quick project switching.

**Implementation:**

#### Configuration File (Git-Tracked)
**File:** `public/spawn-options.json`
```json
{
  "projects": [
    {"name": "Tabz Development", "workingDir": "~/projects/terminal-tabs"},
    {"name": "TUI Classics", "workingDir": "~/projects/TUIClassics"},
    {"name": "Tmuxplexer", "workingDir": "~/projects/tmuxplexer"}
  ],
  "globalDefaults": { ... },
  "spawnOptions": [ ... ]
}
```

#### Backend API Updates
**File:** `backend/routes/api.js`
- GET `/api/spawn-options` - Returns `projects` array
- PUT `/api/spawn-options` - Preserves `projects` when saving (not editable via API yet)

#### Frontend UI
**File:** `src/components/SettingsModal.tsx`

**New UI in Global Defaults Tab:**
```
┌─────────────────────────────────────┐
│ 📁 Default Working Directory        │
│                                     │
│ Project: [Tabz Development ▼]      │ ← Dropdown
│ Path:    ~/projects/terminal-tabs  │ ← Auto-filled
└─────────────────────────────────────┘
```

**Behavior:**
- Dropdown shows "Manual Entry" + all projects from config
- Selecting a project → auto-fills working directory
- Manually editing path → switches dropdown back to "Manual Entry"

**Files Modified:**
- `src/components/SettingsModal.tsx` - Added project dropdown, auto-fill logic
- `src/components/SettingsModal.css` - Styled project selector and working dir input
- `backend/routes/api.js` - Return projects from API, preserve on save
- `public/spawn-options.json` - Added projects array

**Impact:**
- ✅ Quick project switching without editing config files
- ✅ Projects persist in git-tracked config
- ✅ Manual override still works
- ✅ Simple, clean UI

---

## 📊 Session Summary

**Tests Fixed:** 10 → **All 214 tests passing (100%)**
**Features Added:** Working directory priority fix + Project dropdown
**Bugs Fixed:** Bash spawn option working directory + Settings Modal validation
**Issues Identified:** Tab names don't update for bash/TUI terminals (use window_name not pane_title)
**Files Modified:** 11 files (tests, hooks, settings modal, backend API, config, spawn-options)
**Lines Changed:** ~320 lines (test fixes + UI + bug fixes)

---

## 🚀 Next Session: Project Management UI

### Goal
Make projects **fully editable** in the Settings Modal, similar to how Spawn Options are currently editable.

### Current State

**Projects are read-only:**
- Defined in `public/spawn-options.json`
- Loaded and displayed in dropdown
- Can only be edited by manually editing JSON file

**What users need:**
- Add new projects
- Edit existing projects (name, working directory)
- Delete projects
- Reorder projects

---

## 🐛 Fixed During Session: Bash Working Directory Issue

### Issue: Bash Spawn Option Always Used `~` Instead of Global Default

**Problem:**
1. Bash spawn option had `"workingDir": "~"` explicitly set in `spawn-options.json`
2. Settings Modal validation was too strict - rejected empty command string `""`

**Solution:**
1. **Removed explicit `workingDir`** from Bash spawn option
   - Now falls through to global default (as designed)
2. **Fixed validation** to allow empty command strings
   - Changed from `!formData.command` to `formData.command === undefined || formData.command === null`
   - Empty string `""` is valid for bash (spawns plain bash shell)

**Files Modified:**
- `public/spawn-options.json` - Removed `workingDir` from Bash option
- `src/components/SettingsModal.tsx` - Fixed validation logic (lines 214, 235)

**Impact:**
- ✅ Bash terminals now spawn at global default working directory
- ✅ Can edit Bash spawn option in Settings Modal without validation errors
- ✅ Empty command string explicitly supported

---

## 🔧 Known Issue: Tab Names Don't Update for Non-Claude Terminals

### Issue: Bash/TUI Terminals Show Static Names

**Problem:**
When you spawn a Bash terminal and run a TUI app (like lazygit, htop, etc.), the tab name stays "bash" forever. However, tmux's status bar correctly shows the dynamic name:
- Tmux status: `tt-bash-20:bash*` → `tt-bash-20:lazygit*` (updates!)
- Tab name: "bash" → "bash" (stays static)

**Root Cause:**
Current auto-naming system reads `#{pane_title}` which:
- ✅ Works great for Claude Code (sets pane title via escape sequences)
- ❌ Doesn't work for bash terminals (pane title stays "bash")
- ❌ Tmux's **window name** (`#{window_name}`) is what actually updates based on running command

**What Tmux Shows:**
```bash
# Format: session:window_name*
tt-bash-20:bash*      # Initially
tt-bash-20:lazygit*   # After running lazygit (window name updates automatically!)
tt-bash-20:htop*      # After running htop
```

**Where to Fix:**
`backend/routes/api.js` - `/api/tmux/info/:sessionName` endpoint

**Current Implementation:**
```javascript
// Line ~650 (backend/routes/api.js)
const output = execSync(
  `tmux display-message -p -t "${sessionName}" "#{pane_title}|#{session_windows}|#{window_index}"`,
  { encoding: 'utf-8' }
).trim()
```

**Proposed Fix:**
Use `#{window_name}` instead of or in addition to `#{pane_title}`:

```javascript
// Option 1: Prefer window_name, fallback to pane_title
const output = execSync(
  `tmux display-message -p -t "${sessionName}" "#{window_name}|#{pane_title}|#{session_windows}|#{window_index}"`,
  { encoding: 'utf-8' }
).trim()

const [windowName, paneTitle, sessionWindows, windowIndex] = output.split('|')

// Use window_name if different from pane_title (means it's a running command)
// Otherwise use pane_title (for apps like Claude Code that set it explicitly)
const displayName = (windowName !== paneTitle && windowName !== 'bash')
  ? windowName
  : paneTitle
```

**Frontend Update:**
`src/hooks/useTerminalNameSync.ts` - Parse both window name and pane title

**Expected Behavior After Fix:**
- Bash terminal tab shows "bash" initially
- Run `lazygit` → Tab updates to "lazygit" ✅
- Run `htop` → Tab updates to "htop" ✅
- Run `vim file.txt` → Tab updates to "vim" ✅
- Claude Code terminal → Still shows Claude's pane title (like "Editing: file.tsx") ✅

**Priority:** Medium-High - Improves UX significantly for bash/TUI terminals

---

## 📋 Implementation Steps

### Step 1: Add "Projects" Tab to Settings Modal

**File:** `src/components/SettingsModal.tsx`

**Current tabs:** Spawn Options | Global Defaults
**New tabs:** Spawn Options | Projects | Global Defaults

**UI mockup:**
```
┌────────────────────────────────────────────┐
│ [Spawn Options] [Projects] [Global Defaults] │
├────────────────────────────────────────────┤
│ Projects                                   │
│                                            │
│ ┌────────────────────────────────────┐   │
│ │ ⋮⋮ 📁 Tabz Development             │   │
│ │    ~/projects/terminal-tabs     [✏️][❌] │
│ ├────────────────────────────────────┤   │
│ │ ⋮⋮ 📁 TUI Classics                 │   │
│ │    ~/projects/TUIClassics       [✏️][❌] │
│ ├────────────────────────────────────┤   │
│ │ ⋮⋮ 📁 Tmuxplexer                   │   │
│ │    ~/projects/tmuxplexer        [✏️][❌] │
│ └────────────────────────────────────┘   │
│                                            │
│ [+ Add New Project]                       │
└────────────────────────────────────────────┘
```

**Features:**
- Drag handle (⋮⋮) for reordering
- Edit button (✏️) to modify name/path
- Delete button (❌) to remove project
- Add button to create new project

**Code changes needed:**

1. **Add new tab state:**
```typescript
const [activeTab, setActiveTab] = useState<'spawn-options' | 'projects' | 'global-defaults'>('spawn-options')
```

2. **Add projects state (already exists):**
```typescript
const [projects, setProjects] = useState<Project[]>([])
```

3. **Add project editing state:**
```typescript
const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null)
const [isAddingProject, setIsAddingProject] = useState(false)
const [projectFormData, setProjectFormData] = useState<Project>({ name: '', workingDir: '' })
```

4. **Add drag-and-drop for reordering (similar to spawn options):**
```typescript
const [draggedProjectIndex, setDraggedProjectIndex] = useState<number | null>(null)
const [dragOverProjectIndex, setDragOverProjectIndex] = useState<number | null>(null)
```

---

### Step 2: Add Project CRUD Operations

**File:** `src/components/SettingsModal.tsx`

**Add these functions (similar to spawn options):**

```typescript
// Add new project
const handleAddProject = () => {
  setIsAddingProject(true)
  setProjectFormData({ name: '', workingDir: '' })
}

// Save new/edited project
const handleSaveProject = () => {
  if (editingProjectIndex !== null) {
    // Edit existing
    const updated = [...projects]
    updated[editingProjectIndex] = projectFormData
    setProjects(updated)
    setEditingProjectIndex(null)
  } else {
    // Add new
    setProjects([...projects, projectFormData])
    setIsAddingProject(false)
  }
  setProjectFormData({ name: '', workingDir: '' })
}

// Delete project
const handleDeleteProject = (index: number) => {
  if (confirm('Delete this project?')) {
    setProjects(projects.filter((_, i) => i !== index))
  }
}

// Reorder projects (drag and drop)
const handleProjectDrop = () => {
  if (draggedProjectIndex === null || dragOverProjectIndex === null) return

  const reordered = [...projects]
  const [removed] = reordered.splice(draggedProjectIndex, 1)
  reordered.splice(dragOverProjectIndex, 0, removed)

  setProjects(reordered)
  setDraggedProjectIndex(null)
  setDragOverProjectIndex(null)
}
```

---

### Step 3: Update Backend API to Save Projects

**File:** `backend/routes/api.js`

**Currently:** PUT `/api/spawn-options` preserves existing projects (doesn't save edits)

**Update to accept projects in request body:**

```typescript
router.put('/spawn-options', asyncHandler(async (req, res) => {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const { spawnOptions, globalDefaults, projects } = req.body; // Add projects

    if (!Array.isArray(spawnOptions)) {
      return res.status(400).json({
        error: 'Invalid format',
        message: 'spawnOptions must be an array'
      });
    }

    const spawnOptionsPath = path.join(__dirname, '../../public/spawn-options.json');

    // Read existing file to preserve projects/globalDefaults if not provided
    let existingGlobalDefaults = {};
    let existingProjects = [];
    try {
      const existingData = await fs.readFile(spawnOptionsPath, 'utf-8');
      const existingConfig = JSON.parse(existingData);
      existingGlobalDefaults = existingConfig.globalDefaults || {};
      existingProjects = existingConfig.projects || [];
    } catch (err) {
      // File doesn't exist or is invalid, use empty defaults
    }

    const configData = {
      projects: projects !== undefined ? projects : existingProjects, // Use provided projects or preserve existing
      globalDefaults: globalDefaults || existingGlobalDefaults,
      spawnOptions
    };

    await fs.writeFile(
      spawnOptionsPath,
      JSON.stringify(configData, null, 2),
      'utf-8'
    );

    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to save configuration',
      message: error.message
    });
  }
}));
```

**Validation to add:**
```typescript
// Validate projects array if provided
if (projects !== undefined) {
  if (!Array.isArray(projects)) {
    return res.status(400).json({
      error: 'Invalid format',
      message: 'projects must be an array'
    });
  }

  // Validate each project has name and workingDir
  for (const project of projects) {
    if (!project.name || !project.workingDir) {
      return res.status(400).json({
        error: 'Invalid project',
        message: 'Each project must have name and workingDir'
      });
    }
  }
}
```

---

### Step 4: Update Save Function in Settings Modal

**File:** `src/components/SettingsModal.tsx`

**Update `saveSpawnOptions` to include projects:**

```typescript
const saveSpawnOptions = async () => {
  setIsSaving(true)
  setError(null)
  try {
    // Build globalDefaults from current settings store
    const globalDefaults = {
      workingDirectory: settings.workingDirectory,
      fontFamily: settings.terminalDefaultFontFamily,
      fontSize: settings.terminalDefaultFontSize,
      theme: settings.terminalDefaultTheme,
      background: settings.terminalDefaultBackground,
      transparency: Math.round(settings.terminalDefaultTransparency * 100),
      useTmux: settings.useTmux,
    }

    const response = await fetch('/api/spawn-options', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spawnOptions,
        globalDefaults,
        projects // Add projects to save
      }),
    })

    const result = await response.json()

    if (result.success) {
      setOriginalOptions(JSON.parse(JSON.stringify(spawnOptions)))
      onSave() // Notify parent that settings were saved
    } else {
      setError(result.message || 'Failed to save settings')
    }
  } catch (err: any) {
    setError(err.message || 'Failed to save settings')
  } finally {
    setIsSaving(false)
  }
}
```

---

### Step 5: Add Styling for Projects Tab

**File:** `src/components/SettingsModal.css`

**Copy and adapt styles from spawn options:**
- `.project-list` (similar to `.spawn-options-list`)
- `.project-item` (similar to `.spawn-option-item`)
- `.project-drag-handle` (similar to `.option-drag-handle`)
- `.project-form` (similar to `.option-form`)

**Key differences:**
- Projects have only 2 fields (name, workingDir) vs spawn options with many fields
- Simpler form UI
- No icon picker needed

---

### Step 6: Update hasUnsavedChanges Check

**File:** `src/components/SettingsModal.tsx`

**Track project changes too:**

```typescript
const [originalProjects, setOriginalProjects] = useState<Project[]>([])

// When loading:
setProjects(result.projects || [])
setOriginalProjects(JSON.parse(JSON.stringify(result.projects || [])))

// Update check:
const hasUnsavedChanges = () => {
  const spawnOptionsChanged = JSON.stringify(spawnOptions) !== JSON.stringify(originalOptions)
  const projectsChanged = JSON.stringify(projects) !== JSON.stringify(originalProjects)
  return spawnOptionsChanged || projectsChanged
}

// After save:
setOriginalProjects(JSON.parse(JSON.stringify(projects)))
```

---

## 🎯 Expected Behavior After Implementation

**User Workflow:**

1. **Open Settings Modal** (⚙️ button)
2. **Click "Projects" tab**
3. **See list of projects** with drag handles, edit/delete buttons
4. **Drag to reorder** projects
5. **Click ✏️ to edit** - Opens inline form with name/path inputs
6. **Click ❌ to delete** - Removes project after confirmation
7. **Click "+ Add New Project"** - Opens inline form for new project
8. **Fill in name and working directory**
9. **Click Save** - Persists all changes to `spawn-options.json`
10. **Close modal** - Projects dropdown in Global Defaults reflects changes

**Benefits:**
- ✅ No more manual JSON editing
- ✅ Drag-and-drop reordering
- ✅ Inline editing (same pattern as spawn options)
- ✅ Changes saved atomically with other settings
- ✅ Git-trackable configuration

---

## 📝 Files to Modify

1. **`src/components/SettingsModal.tsx`** - Add Projects tab, CRUD operations
2. **`src/components/SettingsModal.css`** - Style project list and forms
3. **`backend/routes/api.js`** - Accept and save projects in PUT endpoint
4. **`CLAUDE.md`** - Document new project management UI

**Estimated Lines of Code:** ~200-300 lines (mostly UI + CRUD handlers)

---

## 🧪 Testing Checklist

After implementation, verify:

**Project Management:**
- [ ] Projects tab shows all projects from config
- [ ] Can add new project (name + working dir)
- [ ] Can edit existing project
- [ ] Can delete project
- [ ] Can drag-and-drop to reorder
- [ ] Save persists changes to `spawn-options.json`
- [ ] Unsaved changes warning works
- [ ] Projects dropdown in Global Defaults updates after save
- [ ] Selecting project from dropdown still auto-fills working dir

**Dynamic Tab Names (if implemented):**
- [ ] Bash terminal shows "bash" initially
- [ ] Running lazygit updates tab to "lazygit"
- [ ] Running htop updates tab to "htop"
- [ ] Claude Code terminals still show pane title (e.g., "Editing: file.tsx")
- [ ] Tab names update every 2 seconds while app is running

---

## 💡 Optional Enhancements

Consider adding in future sessions:

### High Priority
1. **Dynamic Tab Names for Bash/TUI Terminals** - Use `#{window_name}` instead of `#{pane_title}` (see "Known Issue" above)
   - Significantly improves UX for non-Claude terminals
   - Simple fix: ~10-20 lines of code

### Medium Priority
2. **Project Templates** - Predefined project structures
3. **Working Dir Validation** - Check if directory exists before spawning
4. **Import/Export Projects** - Share project configs as JSON files

### Lower Priority
5. **Project Icons** - Visual differentiation (like spawn options)
6. **Terminal Filtering by Project** - Show only terminals in current project
7. **Project-Specific Spawn Options** - Different spawn options per project

---

Last Updated: November 13, 2025
