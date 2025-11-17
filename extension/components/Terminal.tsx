import React, { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import '@xterm/xterm/css/xterm.css'
import { sendMessage, connectToBackground } from '../shared/messaging'

interface TerminalProps {
  terminalId: string
  sessionName?: string
  terminalType?: string
  onClose?: () => void
}

export function Terminal({ terminalId, sessionName, terminalType = 'bash', onClose }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Initialize xterm.js
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return

    console.log('[Terminal] Initializing xterm for terminal:', terminalId)

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'monospace',
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5',
      },
      scrollback: 10000,
      convertEol: false,
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    const unicode11Addon = new Unicode11Addon()

    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)
    xterm.loadAddon(unicode11Addon)
    xterm.unicode.activeVersion = '11'

    // Open terminal
    xterm.open(terminalRef.current)
    console.log('[Terminal] xterm opened successfully')

    // Handle terminal input - send to background worker
    xterm.onData((data) => {
      sendMessage({
        type: 'TERMINAL_INPUT',
        terminalId,
        data,
      })
    })

    // Enable Shift+Ctrl+C/V for copy/paste
    xterm.attachCustomKeyEventHandler((event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'C' && xterm.hasSelection()) {
        event.preventDefault()
        document.execCommand('copy')
        return false
      }
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault()
        navigator.clipboard.readText().then((text) => {
          xterm.paste(text)
        })
        return false
      }
      return true
    })

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // Fit terminal to container
    setTimeout(() => {
      if (fitAddonRef.current && terminalRef.current?.offsetWidth) {
        fitAddonRef.current.fit()
        console.log('[Terminal] Initial fit:', xterm.cols, 'x', xterm.rows)

        // Send resize to backend
        sendMessage({
          type: 'TERMINAL_RESIZE',
          terminalId,
          cols: xterm.cols,
          rows: xterm.rows,
        })
      }
    }, 100)

    // Focus terminal
    setTimeout(() => {
      xterm.focus()
    }, 150)

    // Cleanup
    return () => {
      console.log('[Terminal] Cleaning up xterm for terminal:', terminalId)
      xterm.dispose()
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, [terminalId])

  // Listen for terminal output from background worker via port
  useEffect(() => {
    console.log('[Terminal] Connecting to background for terminal:', terminalId)

    const port = connectToBackground(`terminal-${terminalId}`, (message) => {
      // ✅ Handle initial state sent immediately on connection
      if (message.type === 'INITIAL_STATE') {
        console.log('[Terminal] 📥 Received initial state - WebSocket:', message.wsConnected ? 'connected' : 'disconnected')
        setIsConnected(message.wsConnected)
      } else if (message.type === 'TERMINAL_OUTPUT' && message.terminalId === terminalId) {
        console.log('[Terminal] 📟 TERMINAL_OUTPUT received:', {
          terminalId: message.terminalId,
          dataLength: message.data?.length,
          hasXterm: !!xtermRef.current,
          data: message.data?.slice(0, 50)
        })
        if (xtermRef.current && message.data) {
          xtermRef.current.write(message.data)
          console.log('[Terminal] ✍️ Wrote to xterm:', message.data.length, 'bytes')
        } else {
          console.warn('[Terminal] ⚠️ Cannot write - xterm:', !!xtermRef.current, 'data:', !!message.data)
        }
      } else if (message.type === 'WS_CONNECTED') {
        console.log('[Terminal] WebSocket connected')
        setIsConnected(true)
      } else if (message.type === 'WS_DISCONNECTED') {
        console.log('[Terminal] WebSocket disconnected')
        setIsConnected(false)
      }
    })

    // Cleanup
    return () => {
      console.log('[Terminal] Disconnecting from background')
      port.disconnect()
    }
  }, [terminalId])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit()
        sendMessage({
          type: 'TERMINAL_RESIZE',
          terminalId,
          cols: xtermRef.current.cols,
          rows: xtermRef.current.rows,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [terminalId])

  return (
    <div className="h-full flex flex-col">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-800 bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-white">{sessionName || terminalId}</span>
          <span className="text-gray-400">({terminalType})</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-2 py-0.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
            title="Close terminal"
          >
            ✕
          </button>
        )}
      </div>

      {/* Terminal body */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={terminalRef}
          className="absolute inset-0"
          style={{ padding: '8px', paddingBottom: '4px' }}
        />
      </div>

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Connecting...</div>
            <div className="animate-pulse">⚡</div>
          </div>
        </div>
      )}
    </div>
  )
}
