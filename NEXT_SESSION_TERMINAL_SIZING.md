# Terminal Sizing & Spawn Fixes - Next Session Plan

**Date:** 2025-11-15
**Issue:** Terminals spawn at 800x600, fullscreen button corrupts display
**Root Cause:** Frontend doesn't send size in spawn config, relying on backend fallback

---

## 🔍 Findings from Subagent Exploration

### **Working Project** (`~/projects/terminal-tabs`)
✅ Never specifies initial size in spawn requests
✅ Uses tmux sessions (dimensions managed by tmux, not PTY)
✅ FitAddon auto-sizes terminals to fill containers
✅ ResizeObserver + window listeners keep sync
✅ Container-first design (`flex-1` fills space)
✅ Multiple fit retries (50ms, 150ms, 300ms delays)

**Key insight:** Let the **container drive the size**, not upfront dimensions!

### **Current Project** (`terminal-tabs-tmux-only`)
❌ Frontend sends NO size to backend
❌ Backend defaults to hardcoded 800x600 (unified-spawn.js:433)
❌ spawn-options.json missing `defaultSize` fields
❌ "Fullscreen" button just refits (no actual fullscreen)
❌ No ResizeObserver on terminal containers

---

## 🎯 Solution: Match Working Architecture

### **Option 1: Container-Based Sizing** (Recommended - matches working project)

**DO NOT send size in spawn config!** Instead:

1. **Remove size fallback reliance**
   - Backend: Accept that initial tmux size doesn't matter
   - Tmux sessions will resize on first `fit()`

2. **Ensure FitAddon is used correctly**
   - Load FitAddon BEFORE `term.open()`
   - Call `fit()` immediately after opening
   - Add delayed retries: `setTimeout(() => fit(), 50/150/300)`

3. **Add ResizeObserver to terminal containers**
   ```typescript
   const resizeObserver = new ResizeObserver(() => {
     fitAddon.fit();
   });
   resizeObserver.observe(containerRef.current);
   ```

4. **Fix "fullscreen" button**
   - Either remove it (just use refit/refresh)
   - OR implement real fullscreen with state toggle

### **Option 2: Explicit Size Configuration** (More work, less flexible)

If you want control over initial spawn sizes:

1. **Add to spawn-options.json:**
   ```json
   {
     "label": "TFE",
     "defaultSize": { "width": 1200, "height": 800 },
     ...
   }
   ```

2. **Update SimpleTmuxApp.tsx spawn logic (lines 75-91):**
   ```typescript
   const spawnConfig = {
     name: name,
     terminalType: template.terminalType,
     workingDir: template.workingDir || globalDefaults.workingDirectory,
     size: template.defaultSize || { width: 1200, height: 800 }, // ADD THIS
     ...(template.command && { prompt: template.command }),
   };
   ```

3. **Still use FitAddon** for responsive resizing after spawn

---

## 📋 Action Items for Next Session

### **High Priority** (Fixes the immediate issues)

- [ ] **Fix 1: Add ResizeObserver to MinimalTerminalView.tsx**
  - File: `src/components/MinimalTerminalView.tsx`
  - Add ResizeObserver on terminal container div
  - Call `fitAddon.fit()` when container resizes

- [ ] **Fix 2: Add delayed fit retries to useTerminalInstance.ts**
  - File: `src/hooks/useTerminalInstance.ts`
  - After `term.open()`, add:
    ```typescript
    fitAddon.fit();
    setTimeout(() => fitAddon.fit(), 50);
    setTimeout(() => fitAddon.fit(), 150);
    setTimeout(() => fitAddon.fit(), 300);
    ```

- [ ] **Fix 3: Remove misleading "Fullscreen" button**
  - File: `src/components/MinimalTerminalView.tsx:190-195`
  - Either remove Maximize2 button OR implement real fullscreen
  - Keep just the Refresh button (refit is useful)

### **Medium Priority** (Nice to have)

- [ ] **Optional: Add defaultSize to spawn-options.json**
  - File: `public/spawn-options.json`
  - Add for TFE, Claude Code, etc. if you want control
  - Only needed if you go with Option 2

- [ ] **Optional: Send size in spawn config**
  - File: `src/SimpleTmuxApp.tsx:75-91`
  - Only if you added defaultSize to spawn-options
  - Otherwise, rely on FitAddon (recommended)

### **Low Priority** (Documentation)

- [ ] **Update unified-spawn.js comment**
  - File: `backend/modules/unified-spawn.js:430-442`
  - Clarify that 800x600 fallback is intentional for tmux
  - Or remove it if frontend starts sending size

---

## 🔧 Code Snippets

### Fix 1: ResizeObserver in MinimalTerminalView.tsx

**Location:** After `useTerminalInstance` hook (around line 80)

```typescript
// Add ResizeObserver to handle container size changes
useEffect(() => {
  if (!terminalRef.current || !terminal) return;

  const resizeObserver = new ResizeObserver(() => {
    console.log('[MinimalTerminalView] Container resized, refitting...');
    terminal.fit();
  });

  resizeObserver.observe(terminalRef.current);

  return () => resizeObserver.disconnect();
}, [terminal]);
```

### Fix 2: Delayed Fit Retries in useTerminalInstance.ts

**Location:** After `term.open(container)` (around line 66)

```typescript
term.open(container);
fitAddon.fit(); // Immediate fit

// Delayed retries to handle async layout settling
setTimeout(() => {
  console.log('[useTerminalInstance] Delayed fit (50ms)');
  fitAddon.fit();
}, 50);

setTimeout(() => {
  console.log('[useTerminalInstance] Delayed fit (150ms)');
  fitAddon.fit();
}, 150);

setTimeout(() => {
  console.log('[useTerminalInstance] Delayed fit (300ms)');
  fitAddon.fit();
}, 300);
```

### Fix 3: Remove Fullscreen Button

**Location:** MinimalTerminalView.tsx:190-195

**Option A - Remove it:**
```typescript
{/* Removed misleading fullscreen button - just refresh now */}
<Button onClick={handleRefit} variant="ghost" size="sm" title="Refresh terminal">
  <RefreshCw className="h-4 w-4" />
</Button>
```

**Option B - Implement real fullscreen:**
```typescript
const [isFullscreen, setIsFullscreen] = useState(false);

const handleFullscreen = () => {
  setIsFullscreen(!isFullscreen);
  // Apply fullscreen class to terminal container
  // Then call handleRefit() to resize
};

<Button onClick={handleFullscreen} variant="ghost" size="sm" title="Toggle fullscreen">
  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
</Button>
```

---

## 📊 Testing Checklist

After implementing fixes:

- [ ] Spawn TFE - should fill container (not 800x600)
- [ ] Resize browser window - terminal should resize automatically
- [ ] Click refresh button - terminal should refit cleanly
- [ ] Spawn Claude Code - should also fill container
- [ ] Try different spawn options - all should size correctly
- [ ] Check backend logs - no errors about dimensions

---

## 🎯 Expected Outcome

**Before:**
- Terminals spawn at 800x600 (small, scrollbars)
- Fullscreen button duplicates/corrupts display
- Manual refit needed after every spawn

**After:**
- Terminals spawn filling available container space
- ResizeObserver auto-refits on container changes
- No manual intervention needed
- Fullscreen button removed or properly implemented

---

## 📁 Key Files Reference

| File | Purpose | Lines to Change |
|------|---------|-----------------|
| `src/components/MinimalTerminalView.tsx` | Add ResizeObserver, fix fullscreen button | ~80, 190-195 |
| `src/hooks/useTerminalInstance.ts` | Add delayed fit retries | ~66 |
| `public/spawn-options.json` | (Optional) Add defaultSize | All entries |
| `src/SimpleTmuxApp.tsx` | (Optional) Send size in spawn config | 75-91 |
| `backend/modules/unified-spawn.js` | (Optional) Update fallback comment | 430-442 |

---

## 💡 Quick Start for Next Session

1. Read this plan
2. Start with **High Priority** fixes (ResizeObserver + delayed retries)
3. Test spawning TFE - should fill container now
4. If still issues, consider **Medium Priority** (explicit sizes)
5. Run tests: `npm test`

**Estimated time:** 30-60 minutes for high priority fixes

Good luck! 🚀
