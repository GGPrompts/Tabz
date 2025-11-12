# Next Session: Terminal Padding & Split Divider Improvements

Please fix two visual issues with the split terminals:

1. **Add left padding to terminals** - Text currently starts at the very left edge of the terminal. Add a small amount of padding (maybe 8-12px) to the left side of each terminal pane so text has some breathing room.

2. **Make split divider more visible** - The divider between split panes is very hard to see, and it seems like the terminals might be slightly overlapping (right pane appears to be under or right on the edge of the left pane). Please:
   - Make the divider more visible/prominent
   - Ensure there's no overlap between panes
   - Add a clear visual gap or border between left/right (or top/bottom) panes

The split layout code is in:
- `src/components/SplitLayout.tsx` 
- `src/components/SplitLayout.css`

The terminal wrapper/container styles might be in:
- `src/components/Terminal.css`
- `src/components/Terminal.tsx`

Current setup uses `react-resizable` with ResizableBox for the resize handle.
