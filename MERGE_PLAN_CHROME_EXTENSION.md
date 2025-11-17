# Chrome Extension Merge Plan

**Branch**: `feat/chrome-extension`
**Target**: `master`
**Date Prepared**: November 17, 2025
**Last Updated**: November 17, 2025 (Post-Audit)
**Status**: ⚠️ BLOCKED - Critical fixes required (see Audit Findings)

---

## Summary

The Chrome extension is now fully functional with all critical bugs fixed. This document outlines what needs to happen before merging to `master`.

## What's Working

- ✅ Full terminal rendering with xterm.js
- ✅ Keyboard input and output
- ✅ Unicode11 addon for emoji/TUI support
- ✅ WebSocket communication to backend (port 8128)
- ✅ Session management (spawn, close, switch)
- ✅ Simplified UI without redundant headers
- ✅ Clean message flow from backend to terminal component

## Critical Bug Fixed

**Issue**: Terminals spawned but only showed blinking cursor  
**Root Cause**: Message type mismatch in `extension/background/background.ts`  
**Fix**: Check for both `'output'` and `'terminal-output'` message types  
**Documentation**: https://gist.github.com/GGPrompts/94d74552271412bd1374f1122f7d20da

---

## 🔍 Audit Findings (November 17, 2025)

Two comprehensive audits were performed:
1. **Main Codebase Audit** - Checked for conflicts and dependencies
2. **Extension Branch Audit** - Checked for edge cases and production readiness

### Executive Summary

**Main Codebase**: ✅ **SAFE TO MERGE**
- Minimal conflicts (only 1 file modified: backend/server.js with debug logging)
- Clean separation via independent build configs
- Extension can run simultaneously with main app on different ports (8127 vs 8128)

**Extension Branch**: ⚠️ **NOT READY**
- Core functionality works, but **7 critical issues** need fixing first
- Multiple edge cases discovered (rapid spawns, backend restart, storage errors)
- Production readiness gaps (error handling, performance, cleanup)

### 🚨 BLOCKING ISSUES (Must Fix Before Merge)

#### 1. **Multiple Simultaneous Terminal Spawns** - `extension/background/background.ts:144-169`
**Severity**: CRITICAL
**Issue**: No request deduplication - clicking "New Bash" 3x rapidly creates 3 terminals
**Impact**: Badge count incorrect, storage inconsistent, user confusion
**Fix Required**: Add spawn request tracking Map + debounce (500ms)

#### 2. **Storage API Error Handling** - `extension/shared/storage.ts` (all functions)
**Severity**: CRITICAL
**Issue**: No chrome.runtime.lastError checks - corrupted storage crashes extension
**Impact**: Extension breaks on storage quota exceeded or corruption
**Fix Required**: Add error handling to all getLocal/setLocal/getSync/setSync functions

#### 3. **Content Script Performance** - `extension/content/content.ts:236-243`
**Severity**: CRITICAL
**Issue**: MutationObserver runs on `<all_urls>` forever, never disconnected
**Impact**: High CPU usage on all pages, memory leak
**Fix Required**: Limit to relevant domains (github.com, gitlab.com, localhost) + disconnect observer

#### 4. **DevTools Panel Placeholder** - `extension/devtools/panel.tsx:185`
**Severity**: BLOCKER
**Issue**: Shows "TODO: Integrate actual xterm.js terminal component" instead of working terminal
**Impact**: Misleading to users, broken feature in production
**Fix Required**: Either remove DevTools panel from manifest OR implement Terminal component

#### 5. **Message Queue for Offline Spawns** - `extension/background/background.ts:89-95`
**Severity**: CRITICAL
**Issue**: Spawn requests while disconnected are logged and lost (silent failure)
**Impact**: User clicks "New Terminal" → nothing happens → no feedback
**Fix Required**: Queue messages while offline, replay on reconnect + show notification

#### 6. **Terminal Resize Race Condition** - `extension/components/Terminal.tsx:101-114`
**Severity**: HIGH
**Issue**: Resize triggered at fixed 100ms timeout before xterm initialized
**Impact**: Wrong terminal dimensions, requires manual resize button click
**Fix Required**: Replace setTimeout with ResizeObserver + debounce (100ms)

#### 7. **spawn-options.json Not Accessible** - `vite.config.extension.ts`
**Severity**: HIGH
**Issue**: Extension cannot access spawn-options.json (not copied to dist-extension/)
**Impact**: Terminal types won't match main app, user customization lost
**Fix Required**: Add copy plugin to vite.config.extension.ts

### ⚠️ IMPORTANT EDGE CASES

#### Backend Restart Scenario
**Current Behavior**: Extension shows "Connecting..." forever, terminals never recover
**Recommendation**: On reconnect, query backend for active sessions + re-establish port mappings

#### Extension Reload/Update Scenario
**Issue**: Service worker restart clears in-memory state (WebSocket, connectedClients)
**Risk**: Sidepanel still open but no longer receives messages
**Recommendation**: Add chrome.runtime.onInstalled handler to notify panels to reconnect

#### WebSocket Reconnect Strategy
**Current**: Fixed 5s delay, infinite retries
**Issue**: Too aggressive, logs spam console
**Recommendation**: Exponential backoff (5s → 10s → 30s → 60s max)

#### Port Conflicts (8128)
**Current**: Hardcoded ws://localhost:8128
**Issue**: No fallback if port in use or backend on different port
**Recommendation**: Make backend URL configurable in extension options

#### Terminal Output to Wrong Terminal
**Issue**: Backend sends output for closed terminal → broadcasts to all clients (wasted bandwidth)
**Recommendation**: Track terminal ownership per port, only send to interested clients

### 📊 Dependency Analysis

#### Backend Files Modified
- ✅ **backend/server.js** - Only change: Added debug logging (line 196)
- ✅ **No other backend files modified** - Extension reuses existing modules

#### Port Configuration
- **Main App**: 8127 (VITE_BACKEND_PORT)
- **Extension**: 8128 (hardcoded in background.ts:9)
- **Conflict**: NONE - Intentionally different for simultaneous operation

#### Build System Conflicts
- **Main**: vite.config.ts → dist/
- **Extension**: vite.config.extension.ts → dist-extension/
- **Conflict**: NONE - Separate configs, separate outputs

#### TypeScript Configuration
- **Main**: tsconfig.json (includes: ["src"])
- **Extension**: tsconfig.extension.json (includes: ["extension/**/*"], extends main)
- **Conflict**: NONE - Extension excludes src/, backend/, tests/

#### Package.json Changes
- **Added**: @crxjs/vite-plugin (Chrome extension build tool)
- **Added Scripts**: dev:extension, build:extension, zip:extension
- **Conflict**: NONE - Scripts namespaced with :extension suffix

#### Shared Code Analysis
**Duplicated Components**:
1. Terminal.tsx - Main (full-featured) vs Extension (simplified, Chrome APIs)
2. WebSocket management - Main (Zustand) vs Extension (Chrome runtime messaging)

**Reason**: Different runtime environments (React vs Chrome Extension)
**Recommendation**: Future refactoring to extract shared terminal protocol types

#### spawn-options.json Sharing
**Current**: Main app fetches from /public/spawn-options.json
**Extension**: Needs copy to dist-extension/ (NOT IMPLEMENTED)
**Fix**: Add copy plugin to vite.config.extension.ts (see blocking issue #7)

### 🧪 Testing Gaps

**No Extension-Specific Tests**:
- ❌ Background WebSocket reconnection
- ❌ Message routing (extension ↔ background ↔ backend)
- ❌ Port connection/disconnection
- ❌ Terminal spawn with various options
- ❌ Storage operations

**Recommendation**: Add `/extension/__tests__/` with mocked chrome.runtime, chrome.storage

### 🔒 Security Review

**Findings**:
- ✅ No eval() or unsafe innerHTML
- ✅ No external script injection
- ✅ CSP compatible
- ✅ Command injection safe (context menu uses parsed URLs, not user input)
- ⚠️ Content script runs on `<all_urls>` (should limit to relevant domains)
- ⚠️ If WebSocket URL made configurable, needs validation (localhost only)

### 🧹 Code Cleanup Required

**Debug Logging**: 60+ console.log statements
- **Keep**: Errors, warnings, state changes
- **Remove**: Render loop logging, verbose message logging
- **Recommendation**: Add DEBUG flag controlled by extension options

**TODO Comments**: 5 items
1. popup.tsx:80 - Options page (not implemented)
2. sidepanel.tsx:107 - Options page (not implemented)
3. devtools/panel.tsx:90 - Toast notification (minor)
4. **devtools/panel.tsx:185** - Terminal integration (CRITICAL - see blocking issue #4)
5. extension/README.md:100 - Icon assets (cosmetic)

**Hardcoded Values**: 5 items need configuration
1. WebSocket URL (ws://localhost:8128)
2. Reconnect delay (5000ms)
3. Keepalive interval (25000ms)
4. Recent sessions limit (5)
5. Network requests limit (50)

### 📋 Pre-Merge Requirements

**MUST COMPLETE** (Blocking Issues):
- [ ] Fix #1: Multiple simultaneous spawns (deduplication)
- [ ] Fix #2: Storage API error handling (all functions)
- [ ] Fix #3: Content script performance (limit domains + disconnect observer)
- [ ] Fix #4: DevTools panel (remove OR implement)
- [ ] Fix #5: Message queue for offline spawns
- [ ] Fix #6: Terminal resize race condition (ResizeObserver)
- [ ] Fix #7: spawn-options.json copy to dist-extension/

**SHOULD COMPLETE** (Important Edge Cases):
- [ ] Backend restart recovery (re-attach to sessions)
- [ ] Extension reload handling (reconnect notification)
- [ ] Exponential backoff for WebSocket reconnect
- [ ] Configurable backend URL (extension options)
- [ ] Terminal output ownership tracking

**NICE TO HAVE** (Post-Merge OK):
- [ ] Extension-specific tests (background, Terminal, storage)
- [ ] Theme system port from main app
- [ ] Keyboard shortcuts configuration
- [ ] Options page implementation
- [ ] Notification system (chrome.notifications)

### 🎯 Merge Criteria

**Extension branch is ready to merge when**:
1. ✅ All 7 blocking issues fixed
2. ✅ Manual test scenarios pass (rapid spawn, backend restart, extension reload)
3. ✅ No console errors in service worker or sidepanel
4. ✅ Production logging cleaned up (DEBUG flag added)
5. ✅ Error messages user-friendly (not just "Connecting...")
6. ✅ No memory leaks detected (port cleanup, observer disconnect)

**Estimated work**: 1-2 days for fixes + testing

---

## Pre-Merge Checklist

**⚠️ UPDATE**: See "Audit Findings" section above for comprehensive pre-merge requirements. This checklist has been supplemented with critical issues discovered during audit.

### 1. Critical Issues (BLOCKING - see Audit Findings above)

- [ ] **Issue #1**: Fix multiple simultaneous spawns (add deduplication)
- [ ] **Issue #2**: Add storage API error handling (chrome.runtime.lastError)
- [ ] **Issue #3**: Fix content script performance (limit domains, disconnect observer)
- [ ] **Issue #4**: Remove or implement DevTools panel (currently placeholder)
- [ ] **Issue #5**: Add message queue for offline spawn requests
- [ ] **Issue #6**: Fix terminal resize race condition (use ResizeObserver)
- [ ] **Issue #7**: Copy spawn-options.json to dist-extension/ (vite plugin)

### 2. Code Cleanup

- [ ] Remove debug logging from:
  - `extension/background/background.ts` - Lines with `console.log('📨 WS message received')`
  - `extension/components/Terminal.tsx` - Lines with `console.log('[Terminal]')`
  - `extension/sidepanel/sidepanel.tsx` - Lines with `console.log('[Sidepanel]')`
  - `backend/server.js` - Line with `console.log('[Server] 📤 Broadcasting terminal-spawned')`

- [ ] Or decide to keep debug logs with environment flag:
  ```typescript
  const DEBUG = import.meta.env.DEV
  if (DEBUG) console.log(...)
  ```

### 3. Documentation

- [x] Update `FEATURE_BRANCHES.md` - Status changed to "READY FOR MERGE"
- [x] Create GitHub Gist with bug fix documentation
- [ ] Update main repo `CHANGELOG.md` with extension release notes
- [ ] Update main repo `README.md` with extension usage instructions
- [ ] Add `extension/README.md` with build/install instructions

### 4. Testing (Including Critical Scenarios from Audit)

**High Priority (From Audit)**:
- [ ] **Rapid Spawn Test**: Click "New Bash" 5x rapidly → Should create only 1 terminal
- [ ] **Backend Restart Test**: Open 3 terminals → Stop backend → Wait 10s → Start backend → Terminals should reconnect
- [ ] **Extension Reload Test**: Open sidepanel with 2 terminals → Reload extension → Sidepanel should reconnect
- [ ] **Slow Network Test**: Throttle network (Slow 3G) → Spawn terminal → Type commands → Input should buffer and send when connected
- [ ] **Storage Corruption Test**: Manually corrupt chrome.storage.local → Open extension → Should fallback gracefully

**Standard Testing**:
- [ ] Test on fresh Chrome profile (no extension data)
- [ ] Test spawning all terminal types (bash, claude-code, etc.)
- [ ] Test multiple terminals with tabs
- [ ] Test terminal resize
- [ ] Test TUI apps (htop, lazygit, etc.)
- [ ] Test connection recovery (restart backend while extension running)
- [ ] Test on Windows (already working)
- [ ] Test on Mac (if available)
- [ ] Test on Linux

### 5. Build Verification

- [ ] Run `npm run build:extension` without errors
- [ ] Verify `dist-extension/` contains all files:
  - manifest.json
  - icons/ (16x16, 48x48, 128x128)
  - popup/, sidepanel/, background/, components/
  - All bundled JS/CSS files

- [ ] Load unpacked extension in Chrome
- [ ] Verify no console errors in:
  - Service worker console
  - Sidepanel console
  - Popup console (if used)

### 6. Backend Compatibility

- [ ] Verify backend on port 8128 works correctly
- [ ] Confirm main app (port 8127) and extension (port 8128) can run simultaneously
- [ ] Test that terminals from extension don't interfere with main app terminals
- [ ] Verify spawn-options.json works for extension

---

## Merge Steps

**⚠️ CRITICAL WARNING**: DO NOT merge until all 7 blocking issues from "Audit Findings" are resolved. The extension has critical bugs that will affect production users.

**Merge Readiness Check**:
1. ✅ All blocking issues (#1-#7) fixed
2. ✅ High-priority test scenarios pass
3. ✅ No console errors in production build
4. ✅ spawn-options.json copied to dist-extension/
5. ✅ DevTools panel removed or implemented

Only proceed with merge when all checks pass.

### Option A: Clean Merge (Recommended)

```bash
cd ~/projects/terminal-tabs

# 1. Ensure master is up to date
git checkout master
git pull origin master

# 2. Merge the extension branch
git merge feat/chrome-extension

# 3. Resolve any conflicts (unlikely since this is new code)

# 4. Test build
npm run build:extension

# 5. Commit the merge
git commit -m "feat: add Chrome extension support

- Full terminal functionality in Chrome side panel
- Unicode11 addon for emoji/TUI support
- Simplified UI without redundant headers
- Fixed message routing bug (terminal output now displays)
- Documentation: https://gist.github.com/GGPrompts/94d74552271412bd1374f1122f7d20da

Closes #XXX (if there's an issue)"

# 6. Push to GitHub
git push origin master
```

### Option B: Cherry-Pick Key Commits

If you want more control, cherry-pick specific commits:

```bash
cd ~/projects/terminal-tabs
git checkout master

# View commits to cherry-pick
cd ~/projects/terminal-tabs-extension
git log --oneline

# Cherry-pick the fix commit
cd ~/projects/terminal-tabs
git cherry-pick <commit-hash>

# Or merge specific files
git checkout feat/chrome-extension -- extension/
```

---

## Post-Merge Tasks

### Immediate

- [ ] Update CHANGELOG.md with version bump
- [ ] Tag release: `git tag v1.4.0-extension` (or appropriate version)
- [ ] Push tag: `git push origin v1.4.0-extension`
- [ ] Announce in README.md

### Short-term

- [ ] Package for Chrome Web Store
  - Create developer account
  - Prepare store listing (screenshots, description)
  - Upload `dist-extension.zip`
  - Submit for review

- [ ] Add extension-specific features:
  - Settings page for backend URL configuration
  - Custom spawn options UI
  - Keyboard shortcuts configuration

### Long-term

- [ ] Consider Firefox port (WebExtensions API is similar)
- [ ] Add sync settings via `chrome.storage.sync`
- [ ] Integrate with Chrome's command palette
- [ ] Add DevTools integration (currently stubbed out)

---

## Known Limitations

- Popup is currently grayed out (not implemented)
- DevTools integration is stubbed but not functional
- Settings page not yet built
- No keyboard shortcuts configured
- Backend URL is hardcoded to `localhost:8128`

These are non-blocking for initial merge - can be added in future PRs.

---

## Rollback Plan

If issues are discovered after merge:

```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>

# Or reset to before merge (if no one has pulled yet)
git reset --hard HEAD~1
git push --force origin master  # ⚠️ Only if safe!
```

---

## Files Changed

Key files added/modified in this branch:

```
extension/
├── manifest.json                    # Chrome extension config
├── background/
│   └── background.ts               # Service worker (WebSocket, message routing)
├── components/
│   ├── Terminal.tsx                # xterm.js terminal (Unicode11 addon)
│   └── ui/                         # shadcn/ui components
├── popup/
│   └── popup.tsx                   # Popup UI
├── sidepanel/
│   └── sidepanel.tsx              # Side panel UI (simplified layout)
├── shared/
│   ├── messaging.ts               # Message type definitions
│   ├── storage.ts                 # Chrome storage helpers
│   └── utils.ts                   # Utilities
└── styles/
    └── globals.css                # Global styles

vite.config.extension.ts            # Extension build config
tsconfig.extension.json             # TypeScript config for extension
package.json                        # Updated with extension dependencies
```

---

## 📊 Audit Summary

### Conflict Analysis
- **Main Codebase**: ✅ Safe - Only 1 file modified (backend/server.js debug logging)
- **Build System**: ✅ Safe - Separate configs (vite.config.extension.ts)
- **Port Conflicts**: ✅ Safe - Different ports (8127 vs 8128)
- **TypeScript**: ✅ Safe - Extension extends main config
- **Dependencies**: ✅ Safe - Only @crxjs/vite-plugin added

### Blocking Issues Count
- **Critical**: 5 issues (spawns, storage, content script, offline queue, resize)
- **Blocker**: 1 issue (DevTools panel placeholder)
- **High**: 1 issue (spawn-options.json not copied)
- **Total**: 7 blocking issues

### Edge Cases Count
- **Critical**: 5 scenarios (backend restart, extension reload, reconnect, port conflicts, output routing)
- **Testing Gaps**: Extension-specific tests needed
- **Code Cleanup**: 60+ debug logs, 5 TODOs, 5 hardcoded values

### Recommended Timeline
- **Fix blocking issues**: 1-2 days
- **Testing**: 0.5 days
- **Documentation updates**: 0.5 days
- **Total estimated time**: 2-3 days before merge-ready

### Decision
**DO NOT MERGE** until all blocking issues resolved. Extension has solid foundation but needs production hardening.

---

## References

- **Bug Fix Gist**: https://gist.github.com/GGPrompts/94d74552271412bd1374f1122f7d20da
- **Feature Branch Doc**: `FEATURE_BRANCHES.md` (section 4)
- **Main Repo**: `~/projects/terminal-tabs` (master)
- **Extension Repo**: `~/projects/terminal-tabs-extension` (feat/chrome-extension)

---

**Prepared by**: Claude  
**Date**: November 17, 2025  
**Ready for**: Merge to master after final testing and cleanup
