# Chrome Extension Merge Plan

**Branch**: `feat/chrome-extension`  
**Target**: `master`  
**Date Prepared**: November 17, 2025  
**Status**: ✅ Ready for merge

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

## Pre-Merge Checklist

### 1. Code Cleanup

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

### 2. Documentation

- [x] Update `FEATURE_BRANCHES.md` - Status changed to "READY FOR MERGE"
- [x] Create GitHub Gist with bug fix documentation
- [ ] Update main repo `CHANGELOG.md` with extension release notes
- [ ] Update main repo `README.md` with extension usage instructions
- [ ] Add `extension/README.md` with build/install instructions

### 3. Testing

- [ ] Test on fresh Chrome profile (no extension data)
- [ ] Test spawning all terminal types (bash, claude-code, etc.)
- [ ] Test multiple terminals with tabs
- [ ] Test terminal resize
- [ ] Test TUI apps (htop, lazygit, etc.)
- [ ] Test connection recovery (restart backend while extension running)
- [ ] Test on Windows (already working)
- [ ] Test on Mac (if available)
- [ ] Test on Linux

### 4. Build Verification

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

### 5. Backend Compatibility

- [ ] Verify backend on port 8128 works correctly
- [ ] Confirm main app (port 8127) and extension (port 8128) can run simultaneously
- [ ] Test that terminals from extension don't interfere with main app terminals
- [ ] Verify spawn-options.json works for extension

---

## Merge Steps

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

## References

- **Bug Fix Gist**: https://gist.github.com/GGPrompts/94d74552271412bd1374f1122f7d20da
- **Feature Branch Doc**: `FEATURE_BRANCHES.md` (section 4)
- **Main Repo**: `~/projects/terminal-tabs` (master)
- **Extension Repo**: `~/projects/terminal-tabs-extension` (feat/chrome-extension)

---

**Prepared by**: Claude  
**Date**: November 17, 2025  
**Ready for**: Merge to master after final testing and cleanup
