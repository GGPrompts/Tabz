/**
 * BroadcastChannel Middleware for Zustand
 *
 * Synchronizes state across browser windows/tabs in real-time.
 * Eliminates race conditions by broadcasting synchronously after state updates.
 *
 * Architecture:
 * - Wraps Zustand state creator
 * - Listens for broadcasts from other windows
 * - Broadcasts after every state mutation (no setTimeout delays!)
 * - Uses replace mode to prevent infinite broadcast loops
 *
 * Benefits:
 * - No setTimeout race conditions
 * - Guaranteed ordering (broadcast after set)
 * - Centralized sync logic (not scattered across components)
 * - Easier to test
 *
 * @see CLAUDE.md "Option B: Move Sync Logic to Zustand Middleware"
 */

import { StateCreator, StoreMutatorIdentifier } from 'zustand'

type BroadcastMessage = {
  type: 'state-changed' | 'reload-all'
  state?: any
  from: string
  at: number
}

/**
 * BroadcastChannel middleware that syncs state across windows.
 *
 * CRITICAL: This middleware intercepts ALL setState calls and broadcasts
 * changes to other windows. Uses replace mode to prevent infinite loops.
 *
 * @param currentWindowId - Unique ID for this window (prevents echo)
 * @returns Middleware function
 */
export const broadcastMiddleware = <T extends object>(
  currentWindowId: string
): (<
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  config: StateCreator<T, Mps, Mcs>
) => StateCreator<T, Mps, Mcs>) => {
  return (config) => (set, get, api) => {
    // Setup BroadcastChannel for cross-window communication
    // CRITICAL: Check if BroadcastChannel is available (might be mocked or unavailable in tests)
    let channel: BroadcastChannel | null = null

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('tabz-sync')

        // Listen for messages from other windows
        channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
          const data = event.data

          // Ignore messages from our own window (prevents echo)
          if (data.from === currentWindowId) {
            console.log('[BroadcastMiddleware] ⏭️ Ignoring broadcast from self')
            return
          }

          // Handle reload-all message
          if (data.type === 'reload-all') {
            console.log('[BroadcastMiddleware] 🔄 Received reload-all message from another window')
            if (typeof window !== 'undefined') {
              window.location.reload()
            }
            return
          }

          // Handle state-changed message
          if (data.type === 'state-changed' && data.state) {
            console.log('[BroadcastMiddleware] 🔄 Applying state from another window:', {
              from: data.from,
              terminalsCount: data.state.terminals?.length || 0,
              detachedCount: data.state.terminals?.filter((t: any) => t.status === 'detached').length || 0
            })

            // CRITICAL: Filter state changes by windowId
            // Don't let other windows modify our own terminals or set our active/focused IDs
            const currentState = get() as any
            const incomingState = { ...data.state }

            // CRITICAL FIX: Preserve status/agentId for terminals that belong to THIS window
            // Other windows should not be able to change the status of our terminals
            // EXCEPTION: Detached terminals (windowId cleared) should ALWAYS be accepted
            if (incomingState.terminals && currentState.terminals) {
              incomingState.terminals = incomingState.terminals.map((incomingT: any) => {
                // ALWAYS accept detached status - detachment clears windowId and should be shared
                if (incomingT.status === 'detached') {
                  return incomingT
                }

                const terminalWindow = incomingT.windowId || 'main'

                // If this terminal belongs to the current window, preserve its current status and agentId
                if (terminalWindow === currentWindowId) {
                  const currentT = currentState.terminals.find((t: any) => t.id === incomingT.id)
                  if (currentT) {
                    // Keep current status and agentId - don't let other windows change them
                    return {
                      ...incomingT,
                      status: currentT.status,
                      agentId: currentT.agentId,
                    }
                  }
                }

                // For terminals from other windows, accept the incoming state
                return incomingT
              })
            }

            // Check if incoming activeTerminalId belongs to this window
            if (incomingState.activeTerminalId) {
              const activeTerminal = incomingState.terminals?.find((t: any) => t.id === incomingState.activeTerminalId)
              const activeTerminalWindow = activeTerminal?.windowId || 'main'
              if (activeTerminalWindow !== currentWindowId) {
                console.log('[BroadcastMiddleware] ⏭️ Ignoring activeTerminalId from other window:', {
                  terminalId: incomingState.activeTerminalId,
                  terminalWindow: activeTerminalWindow,
                  currentWindow: currentWindowId
                })
                // Keep our current activeTerminalId instead of applying the broadcast one
                incomingState.activeTerminalId = currentState.activeTerminalId
              }
            }

            // Check if incoming focusedTerminalId belongs to this window
            if (incomingState.focusedTerminalId) {
              const focusedTerminal = incomingState.terminals?.find((t: any) => t.id === incomingState.focusedTerminalId)
              const focusedTerminalWindow = focusedTerminal?.windowId || 'main'
              if (focusedTerminalWindow !== currentWindowId) {
                console.log('[BroadcastMiddleware] ⏭️ Ignoring focusedTerminalId from other window:', {
                  terminalId: incomingState.focusedTerminalId,
                  terminalWindow: focusedTerminalWindow,
                  currentWindow: currentWindowId
                })
                // Keep our current focusedTerminalId instead of applying the broadcast one
                incomingState.focusedTerminalId = currentState.focusedTerminalId
              }
            }

            // Apply state using replace mode to prevent infinite broadcast loop
            // replace = true means this setState won't trigger our broadcast logic below
            // IMPORTANT: Only update data properties, preserve all function properties from current state

            // Debug: Log terminal status changes
            const currentTerminals = currentState.terminals || []
            const incomingTerminals = incomingState.terminals || []
            const statusChanges = incomingTerminals
              .map((incomingT: any) => {
                const currentT = currentTerminals.find((t: any) => t.id === incomingT.id)
                if (currentT && currentT.status !== incomingT.status) {
                  return `${incomingT.name} [${incomingT.id.slice(-8)}]: ${currentT.status} → ${incomingT.status} (window: ${incomingT.windowId || 'none'})`
                }
                return null
              })
              .filter(Boolean)

            if (statusChanges.length > 0) {
              console.log('[BroadcastMiddleware] 🔄 Status changes from broadcast:', statusChanges)
            }

            // Debug: Log detached terminals being received
            const detachedTerminals = incomingTerminals.filter((t: any) => t.status === 'detached')
            if (detachedTerminals.length > 0) {
              console.log('[BroadcastMiddleware] 📌 Receiving detached terminals:', detachedTerminals.map((t: any) => `${t.name} [${t.id.slice(-8)}]`))
            }

            // Debug: Log if terminals with wrong windowId are being updated
            const wrongWindowUpdates = incomingTerminals
              .filter((t: any) => {
                const terminalWindow = t.windowId || 'main'
                return terminalWindow === currentWindowId && t.status === 'spawning'
              })
            if (wrongWindowUpdates.length > 0) {
              console.warn('[BroadcastMiddleware] ⚠️ Receiving spawning status for OUR window terminals:', wrongWindowUpdates.map((t: any) => `${t.name} [${t.id.slice(-8)}]`))
            }

            api.setState({
              ...currentState,  // Keep all existing properties (including functions)
              ...incomingState, // Override with incoming data
            }, true)
          }
        }

        console.log('[BroadcastMiddleware] 📡 Initialized for window:', currentWindowId)

        // Cleanup on unmount
        if (typeof window !== 'undefined') {
          const cleanup = () => channel?.close()
          window.addEventListener('beforeunload', cleanup)
        }
      } catch (error) {
        console.warn('[BroadcastMiddleware] Failed to initialize BroadcastChannel:', error)
        channel = null
      }
    } else {
      console.log('[BroadcastMiddleware] ⚠️ BroadcastChannel not available (test environment?)')
    }

    // Wrap the original config's set function
    return config(
      (args, replace) => {
        // Call original set
        set(args, replace)

        // Broadcast to other windows (only for user-initiated changes, not incoming syncs)
        // If replace=true, this is an incoming broadcast, so don't re-broadcast
        if (!replace && channel) {
          const state = get()

          // Strip functions from state (BroadcastChannel can't serialize functions)
          const serializableState = Object.fromEntries(
            Object.entries(state).filter(([_, value]) => typeof value !== 'function')
          )

          try {
            // Broadcast synchronously after state update (NO setTimeout!)
            channel.postMessage({
              type: 'state-changed',
              state: serializableState,
              from: currentWindowId,
              at: Date.now()
            } as BroadcastMessage)

            console.log('[BroadcastMiddleware] 📡 Broadcasted state change to other windows:', {
              terminalsCount: (serializableState as any).terminals?.length || 0,
              detachedCount: (serializableState as any).terminals?.filter((t: any) => t.status === 'detached').length || 0
            })
          } catch (error) {
            // Filter out benign "channel closed" errors
            if (error instanceof DOMException && error.name === 'InvalidStateError') {
              // Channel closed - this is expected during window close/navigation
              console.log('[BroadcastMiddleware] Channel closed (expected during window close)')
            } else {
              // Log actual error with proper message
              const errorMsg = error instanceof Error ? error.message : String(error)
              console.warn('[BroadcastMiddleware] Failed to broadcast:', errorMsg, {
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                stateSize: JSON.stringify(serializableState).length,
                terminalsCount: (serializableState as any).terminals?.length || 0
              })
            }
          }
        }
      },
      get,
      api
    )
  }
}
