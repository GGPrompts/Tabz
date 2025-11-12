import { useEffect, useRef } from 'react'
import { useSimpleTerminalStore, Terminal } from '../stores/simpleTerminalStore'

/**
 * Hook to automatically sync terminal names from tmux pane titles
 * Polls tmux sessions every 2 seconds and updates tab names
 */
export function useTerminalNameSync(
  currentWindowId: string,
  useTmux: boolean
) {
  const { terminals, updateTerminal } = useSimpleTerminalStore()
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only poll if tmux is enabled
    if (!useTmux) return

    // Filter terminals that belong to this window and have tmux sessions
    const syncTerminals = async () => {
      const terminalsToSync = terminals.filter(t =>
        (t.windowId || 'main') === currentWindowId &&
        t.sessionName &&
        t.status === 'active' &&
        t.autoUpdateName !== false // Default to true if undefined
      )

      if (terminalsToSync.length === 0) return

      // Batch fetch all terminal info
      await Promise.all(
        terminalsToSync.map(async (terminal) => {
          try {
            const response = await fetch(`/api/tmux/info/${terminal.sessionName}`)
            const result = await response.json()

            if (result.success) {
              // Format name with window count if multiple windows exist
              let newName = result.paneTitle || terminal.name
              if (result.windowCount > 1) {
                newName = `${newName} (${result.windowCount})`
              }

              // Only update if name actually changed to avoid unnecessary re-renders
              if (newName !== terminal.name) {
                console.log(`[NameSync] Updating ${terminal.id.slice(-8)}: "${terminal.name}" → "${newName}"`)
                updateTerminal(terminal.id, { name: newName })
              }
            }
          } catch (error) {
            // Silently fail - don't spam console for disconnected terminals
            if (error instanceof Error && !error.message.includes('404')) {
              console.warn(`[NameSync] Failed to sync ${terminal.sessionName}:`, error.message)
            }
          }
        })
      )
    }

    // Initial sync
    syncTerminals()

    // Poll every 2 seconds
    pollIntervalRef.current = setInterval(syncTerminals, 2000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [terminals, currentWindowId, useTmux, updateTerminal])
}
