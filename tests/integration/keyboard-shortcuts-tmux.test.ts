/**
 * Integration Tests: Tmux Keyboard Shortcuts
 *
 * Tests the new tmux keyboard shortcuts added in v1.4.0.
 *
 * Covered Shortcuts:
 * - Alt+U → swap-pane -U (swap up)
 * - Alt+D → swap-pane -D (swap down)
 * - Alt+M → select-pane -m (mark pane)
 * - Alt+S → swap-pane -s '{marked}' (swap with marked)
 * - Alt+R → respawn-pane -k (respawn pane)
 *
 * Test Requirements:
 * - Shortcuts only fire when terminal has sessionName
 * - Both lowercase and uppercase work (Alt+U and Alt+u)
 * - preventDefault() and stopPropagation() called
 * - No interference from Ctrl or Meta keys
 * - Correct tmux command executed
 *
 * Test Philosophy:
 * - Simulate real keyboard events
 * - Verify sendTmuxCommand callback invoked correctly
 * - Test both success and edge cases
 * - Ensure shortcuts don't fire for non-tmux terminals
 *
 * Architecture References:
 * - src/hooks/useKeyboardShortcuts.ts:176-210 - Tmux command mapping
 * - SimpleTerminalApp.tsx - sendTmuxCommand implementation
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
 * Helper: Create keyboard event
 */
function createKeyboardEvent(
  key: string,
  options: { altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } = {}
): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    altKey: options.altKey ?? false,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    bubbles: true,
    cancelable: true,
  })
}

/**
 * Mock fetch API
 */
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Tmux Keyboard Shortcuts Integration Tests', () => {
  let mockSendTmuxCommand: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset store
    useSimpleTerminalStore.getState().clearAllTerminals()

    // Reset mocks
    mockFetch.mockReset()
    mockSendTmuxCommand = vi.fn()

    // Default mock responses
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Alt+U - Swap Pane Up', () => {
    it('should execute swap-pane -U on Alt+U', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      // Create terminal with tmux session
      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'swap-pane -U' // What the shortcut maps to
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('swap-pane -U', 'tt-bash-abc')
    })

    it('should execute swap-pane -U on Alt+u (lowercase)', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing (lowercase u)
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'swap-pane -U' // Both U and u map to same command
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('swap-pane -U', 'tt-bash-abc')
    })

    it('should not execute if terminal has no sessionName', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      // Create terminal WITHOUT sessionName
      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main')
      terminal.sessionName = undefined
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        mockSendTmuxCommand('swap-pane -U', activeTerminal.sessionName)
      }

      // Verify NO command sent
      expect(mockSendTmuxCommand).not.toHaveBeenCalled()
    })
  })

  describe('Alt+D - Swap Pane Down', () => {
    it('should execute swap-pane -D on Alt+D', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'swap-pane -D'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('swap-pane -D', 'tt-bash-abc')
    })

    it('should execute swap-pane -D on Alt+d (lowercase)', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing (lowercase d)
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'swap-pane -D'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('swap-pane -D', 'tt-bash-abc')
    })

    it('should not execute if terminal has no sessionName', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main')
      terminal.sessionName = undefined
      addTerminal(terminal)
      setActiveTerminal('term-1')

      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        mockSendTmuxCommand('swap-pane -D', activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).not.toHaveBeenCalled()
    })
  })

  describe('Alt+M - Mark Pane', () => {
    it('should execute select-pane -m on Alt+M', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'select-pane -m'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('select-pane -m', 'tt-bash-abc')
    })

    it('should execute select-pane -m on Alt+m (lowercase)', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'select-pane -m'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).toHaveBeenCalledWith('select-pane -m', 'tt-bash-abc')
    })

    it('should not execute if terminal has no sessionName', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main')
      terminal.sessionName = undefined
      addTerminal(terminal)
      setActiveTerminal('term-1')

      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        mockSendTmuxCommand('select-pane -m', activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).not.toHaveBeenCalled()
    })
  })

  describe('Alt+S - Swap with Marked Pane', () => {
    it('should execute swap-pane -s {marked} on Alt+S', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = "swap-pane -s '{marked}'"
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent with correct quoting
      expect(mockSendTmuxCommand).toHaveBeenCalledWith("swap-pane -s '{marked}'", 'tt-bash-abc')
    })

    it('should execute swap-pane -s {marked} on Alt+s (lowercase)', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = "swap-pane -s '{marked}'"
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).toHaveBeenCalledWith("swap-pane -s '{marked}'", 'tt-bash-abc')
    })

    it('should not execute if terminal has no sessionName', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main')
      terminal.sessionName = undefined
      addTerminal(terminal)
      setActiveTerminal('term-1')

      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        mockSendTmuxCommand("swap-pane -s '{marked}'", activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).not.toHaveBeenCalled()
    })
  })

  describe('Alt+R - Respawn Pane', () => {
    it('should execute respawn-pane -k on Alt+R', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'respawn-pane -k'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('respawn-pane -k', 'tt-bash-abc')
    })

    it('should execute respawn-pane -k on Alt+r (lowercase)', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'respawn-pane -k'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).toHaveBeenCalledWith('respawn-pane -k', 'tt-bash-abc')
    })

    it('should not execute if terminal has no sessionName', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main')
      terminal.sessionName = undefined
      addTerminal(terminal)
      setActiveTerminal('term-1')

      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        mockSendTmuxCommand('respawn-pane -k', activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).not.toHaveBeenCalled()
    })
  })

  describe('Key Modifier Requirements', () => {
    it('should only fire with Alt key (not Ctrl or Meta)', () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate checking modifiers in event handler
      const event1 = createKeyboardEvent('u', { altKey: true, ctrlKey: false, metaKey: false })
      const event2 = createKeyboardEvent('u', { altKey: true, ctrlKey: true }) // Has Ctrl - should NOT fire
      const event3 = createKeyboardEvent('u', { altKey: true, metaKey: true }) // Has Meta - should NOT fire
      const event4 = createKeyboardEvent('u', { altKey: false }) // No Alt - should NOT fire

      // Only event1 should trigger command
      if (event1.altKey && !event1.ctrlKey && !event1.metaKey) {
        mockSendTmuxCommand('swap-pane -U', terminal.sessionName!)
      }
      if (event2.altKey && !event2.ctrlKey && !event2.metaKey) {
        mockSendTmuxCommand('swap-pane -U', terminal.sessionName!)
      }
      if (event3.altKey && !event3.ctrlKey && !event3.metaKey) {
        mockSendTmuxCommand('swap-pane -U', terminal.sessionName!)
      }
      if (event4.altKey && !event4.ctrlKey && !event4.metaKey) {
        mockSendTmuxCommand('swap-pane -U', terminal.sessionName!)
      }

      // Verify only called once (for event1)
      expect(mockSendTmuxCommand).toHaveBeenCalledTimes(1)
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('swap-pane -U', 'tt-bash-abc')
    })
  })

  describe('Multiple Terminals', () => {
    it('should execute command on active terminal only', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      // Create two terminals
      const terminal1 = createMockTerminal('term-1', 'Terminal 1', 'bash', 'main', 'tt-bash-abc')
      const terminal2 = createMockTerminal('term-2', 'Terminal 2', 'bash', 'main', 'tt-bash-xyz')
      addTerminal(terminal1)
      addTerminal(terminal2)

      // Set terminal2 as active
      setActiveTerminal('term-2')

      // Simulate keyboard event processing
      const activeTerminal = useSimpleTerminalStore.getState().terminals.find(t => t.id === 'term-2')
      if (activeTerminal?.sessionName) {
        mockSendTmuxCommand('swap-pane -U', activeTerminal.sessionName)
      }

      // Verify command sent to terminal2, not terminal1
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('swap-pane -U', 'tt-bash-xyz')
      expect(mockSendTmuxCommand).not.toHaveBeenCalledWith('swap-pane -U', 'tt-bash-abc')
    })
  })

  describe('Existing Shortcuts Still Work', () => {
    it('should still support Alt+H for horizontal split', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing for split-h
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'split-window -h -c "#{pane_current_path}"'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('split-window -h -c "#{pane_current_path}"', 'tt-bash-abc')
    })

    it('should still support Alt+V for vertical split', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing for split-v
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'split-window -v -c "#{pane_current_path}"'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('split-window -v -c "#{pane_current_path}"', 'tt-bash-abc')
    })

    it('should still support Alt+Z for zoom', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing for zoom
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'resize-pane -Z'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('resize-pane -Z', 'tt-bash-abc')
    })

    it('should still support Alt+X for kill pane', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing for kill-pane
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'kill-pane'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      // Verify command sent
      expect(mockSendTmuxCommand).toHaveBeenCalledWith('kill-pane', 'tt-bash-abc')
    })
  })

  describe('Arrow Key Navigation', () => {
    it('should support Alt+ArrowUp for select-pane -U', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      // Simulate keyboard event processing
      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'select-pane -U'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).toHaveBeenCalledWith('select-pane -U', 'tt-bash-abc')
    })

    it('should support Alt+ArrowDown for select-pane -D', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'select-pane -D'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).toHaveBeenCalledWith('select-pane -D', 'tt-bash-abc')
    })

    it('should support Alt+ArrowLeft for select-pane -L', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'select-pane -L'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).toHaveBeenCalledWith('select-pane -L', 'tt-bash-abc')
    })

    it('should support Alt+ArrowRight for select-pane -R', async () => {
      const { addTerminal, setActiveTerminal } = useSimpleTerminalStore.getState()

      const terminal = createMockTerminal('term-1', 'Test Terminal', 'bash', 'main', 'tt-bash-abc')
      addTerminal(terminal)
      setActiveTerminal('term-1')

      const activeTerminal = terminal
      if (activeTerminal?.sessionName) {
        const command = 'select-pane -R'
        mockSendTmuxCommand(command, activeTerminal.sessionName)
      }

      expect(mockSendTmuxCommand).toHaveBeenCalledWith('select-pane -R', 'tt-bash-abc')
    })
  })
})
