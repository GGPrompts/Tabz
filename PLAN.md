# PLAN.md - Tabz Roadmap

## Current Status

**Version**: 1.4.0
**Status**: Production Ready
**Last Updated**: December 2025

All core features are complete. The items below are **nice-to-have** enhancements for future sessions.

---

## Remaining Tasks

### High Priority (UX Improvements)

#### 1. Tab Reordering (Drag & Drop)
**Why**: Users want to organize tabs visually

Currently tabs can only be dragged to create splits. True tab reordering is not implemented.

**Implementation**:
- Modify dnd-kit usage to support reordering (not just splits)
- Update terminal order in store on drop
- Persist new order to localStorage

**Estimate**: 3-4 hours

---

#### 2. Session Manager UI
**Why**: Reconnect to orphaned tmux sessions after refresh

**Features**:
- Query backend for active `tt-*` sessions on mount
- Show "Reconnect" banner for orphaned sessions
- Click session → reattach to existing tmux session
- Optional: auto-reconnect setting

**Backend API**: Already exists (`/api/tmux/sessions`)

**Estimate**: 2-3 hours

---

### Medium Priority (Visual Polish)

#### 3. Tab Bar Overflow
**Why**: Tab bar doesn't handle many tabs well (>10)

**Options**:
- Scrollable tab bar with arrows
- Tab compression (shorter names)
- Tab dropdown for overflow

**Estimate**: 2-3 hours

---

#### 4. Mobile Responsiveness
**Why**: Make it work on tablets/phones

**Tasks**:
- Test on iPad (1024x768)
- Test on iPhone (375x667)
- Fix tab bar for small screens
- Touch-friendly controls
- Virtual keyboard handling

**Estimate**: 6-8 hours

---

### Low Priority (Future)

#### 5. Light Theme Support
**Why**: Some users prefer light backgrounds

**Tasks**:
- Create light color palettes
- Create light background gradients
- Add light/dark mode toggle
- Ensure contrast meets WCAG AA

**Estimate**: 4-5 hours

---

#### 6. Claude Code Theme Integration
**Why**: 6 specialized color palettes for Claude output

**Implementation**:
- Use existing `src/styles/claude-code-themes.ts`
- Add palette picker to customize modal
- Show palette variant (dark/light/high-contrast)

**Estimate**: 2-3 hours

---

## Anti-Roadmap (Things We Won't Do)

1. **No Canvas Features** - Dragging terminals on infinite workspace, zooming, panning
2. **No Desktop App** - Web-first, not Electron
3. **No Multiplayer** - Single-user experience
4. **No Complex Layouts** - Splits are enough, no tiling window manager

---

## Deployment Notes

### Frontend Deployment (Vercel/Netlify)
```bash
npm run build
vercel --prod
```

### Backend Deployment (VPS with PM2)
```bash
pm2 start backend/server.js --name tabz-backend
```

### Environment Variables
```bash
# Backend
PORT=8127
NODE_ENV=production

# Frontend (Vite)
VITE_WS_URL=wss://your-domain.com/ws
```

---

## Historical Reference

For completed features, bug fixes, and session notes, see:
- **[CHANGELOG.md](CHANGELOG.md)** - All completed features organized by version
- **[LESSONS_LEARNED.md](LESSONS_LEARNED.md)** - Technical insights and debugging patterns

**Repository**: https://github.com/GGPrompts/Tabz
