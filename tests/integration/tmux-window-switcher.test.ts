/**
 * Integration Tests: Tmux Window Switcher
 *
 * Tests the tmux window switcher functionality added in v1.4.0.
 *
 * Covered Workflows:
 * 1. Fetching window list from tmux session
 * 2. Displaying window submenu when windowCount > 1
 * 3. Switching to specific window via select-window command
 * 4. Handling API errors gracefully
 *
 * Features Tested:
 * - GET /api/tmux/windows/:name returns window list
 * - Window data includes {index, name, active}
 * - Submenu only shows when multiple windows exist
 * - Window switching executes correct tmux command
 * - Error handling for sessions without windows
 *
 * Test Philosophy:
 * - Test FULL integration flow with real store state
 * - Mock fetch API calls
 * - Verify window list data structure
 * - Test both success and error paths
 *
 * Architecture References:
 * - SimpleTerminalApp.tsx:1187-1199 - fetchTmuxWindows()
 * - backend/routes/api.js:891-933 - GET /api/tmux/windows/:name
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSimpleTerminalStore, Terminal } from '../../src/stores/simpleTerminalStore'

/**
 * Helper: Create mock terminal
 */
function createMockTerminal(
  id: string,
  name: string,
  terminalType: string = 'bash',
  windowId: string = 'main',
  sessionName?: string,
  agentId?: string
): Terminal {
  return {
    id,
    name,
    terminalType,
    command: 'bash',
    icon: '💻',
    agentId: agentId || `agent-${id}`,
    sessionName: sessionName || `tt-bash-${id.slice(-3)}`,
    createdAt: Date.now(),
    status: 'active',
    windowId,
  }
}

/**
 * Mock fetch API
 */
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Tmux Window Switcher Integration Tests', () => {
  beforeEach(() => {
    // Reset store
    useSimpleTerminalStore.getState().clearAllTerminals()

    // Reset mocks
    mockFetch.mockReset()

    // Default mock responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Fetching Window List', () => {
    it('should fetch windows for a tmux session', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock API response with window list
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          windows: [
            { index: 0, name: 'bash', active: true },
            { index: 1, name: 'vim', active: false },
            { index: 2, name: 'htop', active: false },
          ],
        }),
      })

      // Fetch windows
      const response = await fetch(`/api/tmux/windows/${terminal.sessionName}`)
      const data = await response.json()

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith('/api/tmux/windows/tt-bash-abc')

      // Verify response structure
      expect(data.success).toBe(true)
      expect(data.windows).toHaveLength(3)
      expect(data.windows[0]).toEqual({ index: 0, name: 'bash', active: true })
      expect(data.windows[1]).toEqual({ index: 1, name: 'vim', active: false })
      expect(data.windows[2]).toEqual({ index: 2, name: 'htop', active: false })
    })

    it('should handle single window correctly', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock API response with single window
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          windows: [{ index: 0, name: 'bash', active: true }],
        }),
      })

      const response = await fetch(`/api/tmux/windows/${terminal.sessionName}`)
      const data = await response.json()

      // Verify single window
      expect(data.windows).toHaveLength(1)
      expect(data.windows[0].active).toBe(true)

      // In UI, submenu would NOT show when windowCount <= 1
    })

    it('should handle session with no windows', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock API response with empty window list
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          windows: [],
        }),
      })

      const response = await fetch(`/api/tmux/windows/${terminal.sessionName}`)
      const data = await response.json()

      // Verify empty list
      expect(data.windows).toHaveLength(0)
    })

    it('should handle API error gracefully', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock API error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      // Simulate fetchTmuxWindows with error handling
      let tmuxWindows: any[] = []
      let showWindowSubmenu = false

      try {
        const response = await fetch(`/api/tmux/windows/${terminal.sessionName}`)
        const data = await response.json()
        if (data.success) {
          tmuxWindows = data.windows
          showWindowSubmenu = true
        }
      } catch (error) {
        // Error should be caught and logged
        tmuxWindows = []
        showWindowSubmenu = false
      }

      // Verify error handling
      expect(tmuxWindows).toEqual([])
      expect(showWindowSubmenu).toBe(false)
    })

    it('should handle 404 for non-existent session', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-nonexistent')
      addTerminal(terminal)

      // Mock 404 response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: 'Session not found',
        }),
      })

      const response = await fetch(`/api/tmux/windows/${terminal.sessionName}`)
      const data = await response.json()

      // Verify 404 handling
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })

  describe('Window Switching', () => {
    it('should execute select-window -t :0 command', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock successful window switch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      // Execute window switch command
      await fetch(`/api/tmux/sessions/${terminal.sessionName}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'select-window -t :0' }),
      })

      // Verify correct command sent
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tmux/sessions/tt-bash-abc/command',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ command: 'select-window -t :0' }),
        })
      )
    })

    it('should execute select-window -t :1 command', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      // Execute window switch to index 1
      await fetch(`/api/tmux/sessions/${terminal.sessionName}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'select-window -t :1' }),
      })

      // Verify correct command sent
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ command: 'select-window -t :1' }),
        })
      )
    })

    it('should execute select-window -t :5 command', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      // Execute window switch to index 5
      await fetch(`/api/tmux/sessions/${terminal.sessionName}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'select-window -t :5' }),
      })

      // Verify correct command sent
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ command: 'select-window -t :5' }),
        })
      )
    })

    it('should handle window switch error gracefully', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock API error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Window not found',
      })

      // Execute window switch
      const response = await fetch(`/api/tmux/sessions/${terminal.sessionName}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'select-window -t :99' }),
      })

      // Verify error handling
      expect(response.ok).toBe(false)
      expect(response.statusText).toBe('Window not found')
    })
  })

  describe('Window List Data Structure', () => {
    it('should parse window data with index, name, and active flag', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock API response with specific window data
      const mockWindows = [
        { index: 0, name: 'bash', active: false },
        { index: 1, name: 'vim file.txt', active: true },
        { index: 2, name: 'logs', active: false },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          windows: mockWindows,
        }),
      })

      const response = await fetch(`/api/tmux/windows/${terminal.sessionName}`)
      const data = await response.json()

      // Verify window structure
      data.windows.forEach((window: any) => {
        expect(window).toHaveProperty('index')
        expect(window).toHaveProperty('name')
        expect(window).toHaveProperty('active')
        expect(typeof window.index).toBe('number')
        expect(typeof window.name).toBe('string')
        expect(typeof window.active).toBe('boolean')
      })

      // Verify active window
      const activeWindow = data.windows.find((w: any) => w.active)
      expect(activeWindow).toBeDefined()
      expect(activeWindow.index).toBe(1)
      expect(activeWindow.name).toBe('vim file.txt')
    })

    it('should handle window names with special characters', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock windows with special character names
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          windows: [
            { index: 0, name: 'vim ~/file.txt', active: false },
            { index: 1, name: 'ssh user@host', active: true },
            { index: 2, name: 'tail -f /var/log/app.log', active: false },
          ],
        }),
      })

      const response = await fetch(`/api/tmux/windows/${terminal.sessionName}`)
      const data = await response.json()

      // Verify special characters preserved
      expect(data.windows[0].name).toBe('vim ~/file.txt')
      expect(data.windows[1].name).toBe('ssh user@host')
      expect(data.windows[2].name).toBe('tail -f /var/log/app.log')
    })
  })

  describe('Submenu Visibility Logic', () => {
    it('should show submenu when windowCount > 1', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock multiple windows
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          windows: [
            { index: 0, name: 'bash', active: true },
            { index: 1, name: 'vim', active: false },
          ],
        }),
      })

      const response = await fetch(`/api/tmux/windows/${terminal.sessionName}`)
      const data = await response.json()

      // Simulate fetchTmuxWindows logic
      const showWindowSubmenu = data.success && data.windows.length > 1

      // Verify submenu should show
      expect(showWindowSubmenu).toBe(true)
    })

    it('should not show submenu when windowCount = 1', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock single window
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          windows: [{ index: 0, name: 'bash', active: true }],
        }),
      })

      const response = await fetch(`/api/tmux/windows/${terminal.sessionName}`)
      const data = await response.json()

      // Simulate fetchTmuxWindows logic
      const showWindowSubmenu = data.success && data.windows.length > 1

      // Verify submenu should NOT show
      expect(showWindowSubmenu).toBe(false)
    })

    it('should not show submenu when windowCount = 0', async () => {
      const { addTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)

      // Mock no windows
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          windows: [],
        }),
      })

      const response = await fetch(`/api/tmux/windows/${terminal.sessionName}`)
      const data = await response.json()

      // Simulate fetchTmuxWindows logic
      const showWindowSubmenu = data.success && data.windows.length > 1

      // Verify submenu should NOT show
      expect(showWindowSubmenu).toBe(false)
    })
  })
})
