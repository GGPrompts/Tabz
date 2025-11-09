# Next Session: Enhance Spawn Options Manager UX

## Goal
Improve the spawn options manager UI to make font and background selections more visual and user-friendly.

## Current State
The spawn options manager (⚙️ Settings button) allows editing `spawn-options.json` entries. Currently:
- Font family dropdown shows plain text names (e.g., "Fira Code", "JetBrains Mono")
- Background gradient dropdown shows plain text names (e.g., "dark-neutral", "amber-warmth", "matrix-code")

## Desired Changes

### 1. Font Family Dropdown - Show Fonts in Their Own Style
**File**: `src/components/SettingsModal.tsx` (lines ~150-180 for font family dropdown)

**Current**:
```tsx
<option value="Fira Code">Fira Code</option>
```

**Desired**:
- Each option should display in its actual font
- Use inline styles or CSS to apply the font to each option
- Example: The "Fira Code" option should render in Fira Code font

### 2. Background Gradient Dropdown - Show Visual Previews
**File**: `src/components/SettingsModal.tsx` (background dropdown)

**Current**:
```tsx
<option value="dark-neutral">dark-neutral</option>
<option value="amber-warmth">amber-warmth</option>
```

**Desired**:
- Show actual gradient preview next to/instead of text name
- Options:
  - Use colored background on the option element
  - Add a small gradient swatch/box before the text
  - Consider custom dropdown with gradient previews

**Background Gradient Mapping** (from `src/SimpleTerminalApp.tsx` around line 65):
```typescript
const BACKGROUND_GRADIENTS = {
  'dark-neutral': 'linear-gradient(135deg, #1a1b26 0%, #16161e 100%)',
  'amber-warmth': 'linear-gradient(135deg, #1a1b26 0%, #2a1810 50%, #1a1b26 100%)',
  'matrix-code': 'linear-gradient(135deg, #0a120a 0%, #001a00 50%, #0a120a 100%)',
  'cyberpunk-neon': 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #1a0a2e 100%)',
  'vaporwave-dreams': 'linear-gradient(135deg, #1a0a2e 0%, #2a1a3e 50%, #1a0a2e 100%)',
  'holographic': 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0f1419 100%)',
  'deep-ocean': 'linear-gradient(135deg, #0a1628 0%, #001f3f 50%, #0a1628 100%)',
  // ... etc
}
```

## Implementation Approach

### Option A: Style Native Dropdowns
- Simple: Add inline styles to `<option>` elements
- Pro: No UI library needed
- Con: Limited browser support for option styling

### Option B: Custom Dropdown Component
- Create a custom styled dropdown with better visual previews
- Pro: Full control, can show gradient swatches
- Con: More work, need to handle accessibility

### Option C: React Select or Similar
- Use a library for custom dropdowns
- Pro: Professional, accessible, customizable
- Con: New dependency

## Files to Modify
- `src/components/SettingsModal.tsx` - Main settings modal with dropdowns
- `src/components/SettingsModal.css` - Styling for the modal
- Possibly create new component: `src/components/FontDropdown.tsx` and `BackgroundDropdown.tsx`

## Reference Locations
- Current font family list: `SettingsModal.tsx` around line 150-180
- Background gradients: `SimpleTerminalApp.tsx` line ~65 (`BACKGROUND_GRADIENTS`)
- Theme backgrounds mapping: `SimpleTerminalApp.tsx` line ~50 (`THEME_BACKGROUNDS`)

## Success Criteria
1. Font dropdown shows each font name in its actual typeface
2. Background dropdown shows visual gradient preview for each option
3. Selections remain functional (saving to spawn-options.json works)
4. UI is more intuitive - users can see what they're selecting

## Tips
- The SettingsModal already has access to spawn options and handles editing
- Font families used: "Fira Code", "JetBrains Mono", "Monaco", "Consolas", "Courier New", "monospace"
- Background gradients are defined in `BACKGROUND_GRADIENTS` constant
- Consider showing a live preview of the selected font/background combination
