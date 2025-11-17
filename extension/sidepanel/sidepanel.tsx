import React, { useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { Terminal as TerminalIcon, Pin, PinOff, Settings, Plus } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Terminal } from '../components/Terminal'
import { connectToBackground, sendMessage } from '../shared/messaging'
import { getLocal, setLocal } from '../shared/storage'
import '../styles/globals.css'

interface TerminalSession {
  id: string
  name: string
  type: string
  active: boolean
}

function SidePanelTerminal() {
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [pinned, setPinned] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const portRef = useRef<chrome.runtime.Port | null>(null)

  useEffect(() => {
    // Load pinned state from storage
    getLocal(['settings']).then(({ settings }) => {
      if (settings?.sidePanelPinned !== undefined) {
        setPinned(settings.sidePanelPinned)
      }
    })

    // Connect to background worker via port for broadcasts
    const port = connectToBackground('sidepanel', (message) => {
      // ✅ Handle initial state sent immediately on connection
      if (message.type === 'INITIAL_STATE') {
        setWsConnected(message.wsConnected)
      } else if (message.type === 'WS_CONNECTED') {
        setWsConnected(true)
      } else if (message.type === 'WS_DISCONNECTED') {
        setWsConnected(false)
      } else if (message.type === 'WS_MESSAGE') {
        handleWebSocketMessage(message.data)
      } else if (message.type === 'TERMINAL_OUTPUT') {
        // Terminal component will handle this
      }
    })

    portRef.current = port

    // Cleanup
    return () => {
      port.disconnect()
      portRef.current = null
    }
  }, [])

  const handleWebSocketMessage = (data: any) => {
    console.log('[Sidepanel] handleWebSocketMessage:', data.type, data.type === 'terminal-spawned' ? JSON.stringify(data).slice(0, 200) : '')
    switch (data.type) {
      case 'session-list':
        setSessions(data.sessions || [])
        break
      case 'terminal-spawned':
        // Backend sends: { type: 'terminal-spawned', data: terminalObject, requestId }
        // terminalObject has: { id, name, terminalType, ... }
        const terminal = data.data || data
        console.log('[Sidepanel] 📥 Terminal spawned:', {
          id: terminal.id,
          name: terminal.name,
          type: terminal.terminalType,
        })
        setSessions(prev => [...prev, {
          id: terminal.id,
          name: terminal.name || terminal.id,
          type: terminal.terminalType || 'bash',
          active: false,
        }])
        setCurrentSession(terminal.id)
        break
      case 'terminal-closed':
        setSessions(prev => prev.filter(s => s.id !== data.terminalId))
        if (currentSession === data.terminalId) {
          setCurrentSession(sessions[0]?.id || null)
        }
        break
    }
  }

  const handleTogglePin = () => {
    const newPinned = !pinned
    setPinned(newPinned)
    setLocal({
      settings: {
        sidePanelPinned: newPinned,
      },
    })
  }

  const handleSpawnTerminal = () => {
    sendMessage({
      type: 'SPAWN_TERMINAL',
      spawnOption: 'bash',
    })
  }

  const handleOpenSettings = () => {
    // TODO: Create options page
    // For now, do nothing
    console.log('[Sidepanel] Settings clicked - options page not yet implemented')
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Toolbar - compact controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-card/50">
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <Badge variant="secondary" className="text-xs">Connected</Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">Disconnected</Badge>
          )}
          {sessions.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleSpawnTerminal}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="New Terminal"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={handleOpenSettings}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Session Tabs */}
      {sessions.length > 0 && (
        <div className="flex gap-1 p-2 border-b bg-muted/30 overflow-x-auto">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setCurrentSession(session.id)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                ${currentSession === session.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent text-foreground'
                }
              `}
            >
              {session.name}
            </button>
          ))}
        </div>
      )}

      {/* Terminal View */}
      <div className="flex-1 relative overflow-hidden">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <TerminalIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">No active terminals</p>
            <p className="text-sm mb-4">Spawn a terminal to get started</p>
            <button
              onClick={handleSpawnTerminal}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="inline-block h-4 w-4 mr-2" />
              New Terminal
            </button>
          </div>
        ) : (
          <div className="h-full">
            {sessions.map(session => (
              <div
                key={session.id}
                className="h-full"
                style={{ display: session.id === currentSession ? 'block' : 'none' }}
              >
                <Terminal
                  terminalId={session.id}
                  sessionName={session.name}
                  terminalType={session.type}
                  onClose={() => {
                    sendMessage({
                      type: 'CLOSE_TERMINAL',
                      terminalId: session.id,
                    })
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// Mount the sidepanel
ReactDOM.createRoot(document.getElementById('sidepanel-root')!).render(
  <React.StrictMode>
    <SidePanelTerminal />
  </React.StrictMode>
)
