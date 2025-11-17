# Test Coverage for Dual Context Menu System (v1.4.0)

## 🎯 Goal
Add comprehensive test coverage for the new dual context menu system and tmux features added in v1.4.0 (commit `b1533b2`).

## 📋 Features That Need Testing

### 1. **Pane Context Menu** (Right-click inside terminal)
**Location**: `src/SimpleTerminalApp.tsx:1125-1155` (handlePaneContextMenu)

**What to test**:
- ✅ Opens pane menu when right-clicking terminal with tmux session
- ✅ Shows "No tmux session" when terminal has no sessionName
- ✅ Fetches pane marked status from `/api/tmux/info/:name` before opening
- ✅ Sets `paneMarked` state correctly based on API response
- ✅ Handles API errors gracefully (sets paneMarked to false)
- ✅ Menu shows at correct mouse coordinates (e.clientX, e.clientY)

### 2. **Pane Menu Actions** (executeTmuxPaneCommand)
**Location**: `src/SimpleTerminalApp.tsx:1158-1179`

**What to test**:
- ✅ Split Horizontally → calls `/api/tmux/sessions/:name/command` with `split-window -h`
- ✅ Split Vertically → calls `/api/tmux/sessions/:name/command` with `split-window -v`
- ✅ Swap Up → calls with `swap-pane -U`
- ✅ Swap Down → calls with `swap-pane -D`
- ✅ Mark → calls with `select-pane -m`
- ✅ Unmark → calls with `select-pane -M`
- ✅ Swap with Marked → calls with `swap-pane -s '{marked}'`
- ✅ Respawn → calls with `respawn-pane -k`
- ✅ Zoom → calls with `resize-pane -Z`
- ✅ Closes menu after command execution
- ✅ Handles API errors without crashing

### 3. **Kill Pane** (handleKillPane)
**Location**: `src/SimpleTerminalApp.tsx:1196-1208`

**What to test**:
- ✅ Calls `kill-pane` via executeTmuxPaneCommand
- ✅ Removes terminal from UI using `removeTerminal()`
- ✅ Closes pane menu after execution
- ✅ Does nothing if no paneContextMenu.terminalId
- ✅ Does nothing if terminal has no sessionName

### 4. **Tmux Window Switcher**
**Location**: `src/SimpleTerminalApp.tsx:1181-1194` (fetchTmuxWindows)

**What to test**:
- ✅ Fetches window list from `/api/tmux/windows/:name`
- ✅ Sets `tmuxWindows` state with array of {index, name, active}
- ✅ Sets `showWindowSubmenu` to true on success
- ✅ Handles API errors gracefully
- ✅ Submenu only shows when `windowCount > 1`
- ✅ Window switching calls `select-window -t :N` with correct index

### 5. **Dynamic Mark/Unmark Toggle**
**Location**: `src/SimpleTerminalApp.tsx:2765-2779`

**What to test**:
- ✅ Shows "📌 Mark" button when `paneMarked === false`
- ✅ Shows "📍 Unmark" button when `paneMarked === true`
- ✅ Mark button calls `select-pane -m`
- ✅ Unmark button calls `select-pane -M`
- ✅ State updates correctly after marking/unmarking

### 6. **Tab Context Menu Reorganization**
**Location**: `src/SimpleTerminalApp.tsx:2634-2698`

**What to test**:
- ✅ Unsplit option appears only when `isInSplit === true`
- ✅ Split buttons removed from tab menu (verify they don't exist)
- ✅ Menu has proper dividers for organization
- ✅ All existing tab menu actions still work (detach, pop out, kill session)

### 7. **New Keyboard Shortcuts**
**Location**: `src/hooks/useKeyboardShortcuts.ts:176-199`

**What to test**:
- ✅ `Alt+U` → calls `swap-pane -U`
- ✅ `Alt+D` → calls `swap-pane -D`
- ✅ `Alt+M` → calls `select-pane -m`
- ✅ `Alt+S` → calls `swap-pane -s '{marked}'`
- ✅ `Alt+R` → calls `respawn-pane -k`
- ✅ All shortcuts only fire when terminal has sessionName
- ✅ Shortcuts preventDefault and stopPropagation
- ✅ Shortcuts work with both lowercase and uppercase

### 8. **Backend API Enhancements**

**GET /api/tmux/windows/:name** (`backend/routes/api.js:891-933`)
- ✅ Returns array of windows with {index, name, active}
- ✅ Returns 404 if session doesn't exist
- ✅ Parses tmux format string correctly
- ✅ Handles tmux errors gracefully

**GET /api/tmux/info/:name** (enhanced to return `paneMarked`)
- ✅ Returns `paneMarked: true` when pane is marked
- ✅ Returns `paneMarked: false` when pane is not marked
- ✅ Parses `#{pane_marked}` correctly ('1' → true, '0' → false)

## 🏗️ Test Structure

### Recommended Test Files

```
tests/
├── integration/
│   ├── pane-context-menu.test.ts        # NEW - Pane menu integration tests
│   ├── tmux-window-switcher.test.ts     # NEW - Window switcher tests
│   └── keyboard-shortcuts-tmux.test.ts   # NEW - New keyboard shortcuts
└── unit/
    └── hooks/
        └── useKeyboardShortcuts.test.ts  # ENHANCE - Add new shortcut tests
```

### Test Pattern (from existing tests)

```typescript
/**
 * Integration Tests: Pane Context Menu
 *
 * Tests the complete pane context menu workflow.
 *
 * Covered Workflows:
 * 1. Opening pane menu on right-click
 * 2. Fetching pane marked status
 * 3. Executing tmux pane commands
 * 4. Kill pane and UI cleanup
 *
 * Test Philosophy:
 * - Test FULL integration flow with real store state
 * - Mock WebSocket and fetch API calls
 * - Verify menu state updates
 * - Test both success and error paths
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSimpleTerminalStore } from '../../src/stores/simpleTerminalStore'

// Mock fetch globally
global.fetch = vi.fn()

describe('Pane Context Menu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSimpleTerminalStore.getState().clearTerminals()
  })

  it('fetches pane marked status before opening menu', async () => {
    // Setup: Add terminal with tmux session
    const store = useSimpleTerminalStore.getState()
    store.addTerminal({
      id: 'term-1',
      name: 'Test',
      sessionName: 'tt-bash-abc',
      // ...
    })

    // Mock API response
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, paneMarked: true })
    })

    // Simulate right-click
    const mockEvent = new MouseEvent('contextmenu', { clientX: 100, clientY: 200 })
    // await handlePaneContextMenu(mockEvent, 'term-1')

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith('/api/tmux/info/tt-bash-abc')

    // Verify paneMarked state
    // expect(paneMarked).toBe(true)
  })

  // More tests...
})
```

## 📚 Reference Materials

### Existing Test Files to Study
1. **`tests/integration/detach-reattach.test.ts`** - Great example of integration testing with mocked APIs
2. **`tests/integration/split-operations.test.ts`** - Tests split functionality
3. **`tests/unit/hooks/useKeyboardShortcuts.test.ts`** - If it exists, use as base for new shortcuts

### Test Commands
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/integration/pane-context-menu.test.ts

# Run in watch mode (during development)
npm run test:watch

# Run with UI
npm run test:ui
```

### Key Testing Principles (from CLAUDE.md)

1. **Always run tests before committing** - `npm test` should pass with no failures
2. **Write tests for complex bugs** - Prevents regressions
3. **Follow TDD when possible** - Write failing test → fix → test passes → commit
4. **Test both success and error paths** - Don't just test happy path

## 🚀 Suggested Approach

### Step 1: Start with Integration Tests
Focus on the **full user workflow** first:
1. Create `tests/integration/pane-context-menu.test.ts`
2. Test the complete flow: right-click → menu opens → action → API call → state update
3. Use existing integration test patterns (mock fetch, mock WebSocket)

### Step 2: Add Unit Tests for Handlers
Test individual handler functions:
1. `handlePaneContextMenu()` - Menu opening and state fetching
2. `executeTmuxPaneCommand()` - Command execution
3. `fetchTmuxWindows()` - Window list fetching
4. `handleKillPane()` - Pane removal

### Step 3: Enhance Keyboard Shortcut Tests
1. Update `tests/unit/hooks/useKeyboardShortcuts.test.ts` (or create if missing)
2. Test all 5 new shortcuts (U, D, M, S, R)
3. Verify they only fire when terminal has sessionName

### Step 4: Backend API Tests (Optional but Recommended)
If backend tests exist, add tests for:
1. `GET /api/tmux/windows/:name`
2. Enhanced `GET /api/tmux/info/:name` (paneMarked field)

## ✅ Success Criteria

- [ ] All new features have integration tests
- [ ] All new handlers have unit tests
- [ ] All new keyboard shortcuts are tested
- [ ] All tests pass: `npm test`
- [ ] Test coverage for critical paths (menu opening, command execution, error handling)
- [ ] No regressions in existing tests

## 🐛 Common Pitfalls to Avoid

1. **Don't forget to mock fetch** - All API calls need mocking
2. **Clear store state between tests** - Use `beforeEach(() => useSimpleTerminalStore.getState().clearTerminals())`
3. **Test error paths** - What happens when API returns 500? Network error?
4. **Test edge cases** - No sessionName, no terminalId, menu already open, etc.
5. **Verify cleanup** - Menu closes, state resets, no memory leaks

## 📝 Notes

- **Current test pass rate**: 253/257 (98.4%) - Let's keep it high!
- **Testing framework**: Vitest (compatible with Jest syntax)
- **Mocking**: Use `vi.fn()` from vitest for mocks
- **Store**: Real Zustand store (not mocked) - tests integration properly
- **See**: `LESSONS_LEARNED.md` for testing checklists and patterns

## 🔗 Related Files

### Implementation Files (Reference for Tests)
- `src/SimpleTerminalApp.tsx` - Main app with all handlers
- `src/hooks/useKeyboardShortcuts.ts` - Keyboard shortcut logic
- `backend/routes/api.js` - API endpoints

### Documentation
- `CHANGELOG.md` - v1.4.0 release notes (detailed feature list)
- `CLAUDE.md` - Architecture and testing workflow
- `LESSONS_LEARNED.md` - Testing patterns and checklists

---

**Good luck!** Focus on integration tests first (user workflows), then unit tests (individual functions). The goal is to prevent regressions and give confidence when refactoring. 🧪
