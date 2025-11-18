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
  fontSize?: number
  theme?: 'dark' | 'light'
  onClose?: () => void
}

export function Terminal({ terminalId, sessionName, terminalType = 'bash', fontSize = 14, theme = 'dark', onClose }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Initialize xterm.js
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return

    console.log('[Terminal] Initializing xterm for terminal:', terminalId)

    // Theme definitions
    const darkTheme = {
      background: '#0a0a0a',
      foreground: '#00ff88',
      cursor: '#00ff88',
      black: '#000000',
      red: '#ff5555',
      green: '#00ff88',
      yellow: '#ffff55',
      blue: '#5555ff',
      magenta: '#ff55ff',
      cyan: '#00c8ff',
      white: '#bbbbbb',
      brightBlack: '#555555',
      brightRed: '#ff5555',
      brightGreen: '#00ff88',
      brightYellow: '#ffff55',
      brightBlue: '#5555ff',
      brightMagenta: '#ff55ff',
      brightCyan: '#00c8ff',
      brightWhite: '#ffffff',
    }

    const lightTheme = {
      background: '#ffffff',
      foreground: '#24292e',
      cursor: '#24292e',
      black: '#24292e',
      red: '#d73a49',
      green: '#22863a',
      yellow: '#b08800',
      blue: '#0366d6',
      magenta: '#6f42c1',
      cyan: '#1b7c83',
      white: '#6a737d',
      brightBlack: '#959da5',
      brightRed: '#cb2431',
      brightGreen: '#22863a',
      brightYellow: '#b08800',
      brightBlue: '#0366d6',
      brightMagenta: '#6f42c1',
      brightCyan: '#1b7c83',
      brightWhite: '#24292e',
    }

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize,
      fontFamily: 'monospace',
      theme: theme === 'dark' ? darkTheme : lightTheme,
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

  // Update terminal settings when props change
  useEffect(() => {
    const xterm = xtermRef.current
    if (!xterm) return

    console.log('[Terminal] Updating settings:', { fontSize, theme })

    // Theme definitions (same as initialization)
    const darkTheme = {
      background: '#0a0a0a',
      foreground: '#00ff88',
      cursor: '#00ff88',
      black: '#000000',
      red: '#ff5555',
      green: '#00ff88',
      yellow: '#ffff55',
      blue: '#5555ff',
      magenta: '#ff55ff',
      cyan: '#00c8ff',
      white: '#bbbbbb',
      brightBlack: '#555555',
      brightRed: '#ff5555',
      brightGreen: '#00ff88',
      brightYellow: '#ffff55',
      brightBlue: '#5555ff',
      brightMagenta: '#ff55ff',
      brightCyan: '#00c8ff',
      brightWhite: '#ffffff',
    }

    const lightTheme = {
      background: '#ffffff',
      foreground: '#24292e',
      cursor: '#24292e',
      black: '#24292e',
      red: '#d73a49',
      green: '#22863a',
      yellow: '#b08800',
      blue: '#0366d6',
      magenta: '#6f42c1',
      cyan: '#1b7c83',
      white: '#6a737d',
      brightBlack: '#959da5',
      brightRed: '#cb2431',
      brightGreen: '#22863a',
      brightYellow: '#b08800',
      brightBlue: '#0366d6',
      brightMagenta: '#6f42c1',
      brightCyan: '#1b7c83',
      brightWhite: '#24292e',
    }

    // Update font size first
    if (xterm.options.fontSize !== fontSize) {
      console.log('[Terminal] Changing font size from', xterm.options.fontSize, 'to', fontSize)
      xterm.options.fontSize = fontSize
    }

    // Update theme
    const currentTheme = theme === 'dark' ? darkTheme : lightTheme
    xterm.options.theme = currentTheme

    // Force refresh the terminal content
    xterm.refresh(0, xterm.rows - 1)
    console.log('[Terminal] Settings updated - fontSize:', fontSize, 'theme:', theme)

    // Use resize trick to force complete redraw (prevents visual artifacts)
    // This works by temporarily resizing the terminal, which forces xterm.js to redraw everything
    setTimeout(() => {
      if (xtermRef.current && fitAddonRef.current) {
        const currentCols = xtermRef.current.cols
        const currentRows = xtermRef.current.rows

        // Step 1: Resize down by 1 column
        xtermRef.current.resize(currentCols - 1, currentRows)
        sendMessage({
          type: 'TERMINAL_RESIZE',
          terminalId,
          cols: currentCols - 1,
          rows: currentRows,
        })

        // Step 2: Wait then resize back to original size
        setTimeout(() => {
          if (xtermRef.current) {
            xtermRef.current.resize(currentCols, currentRows)
            sendMessage({
              type: 'TERMINAL_RESIZE',
              terminalId,
              cols: currentCols,
              rows: currentRows,
            })
            console.log('[Terminal] Resize trick completed - settings fully applied')
          }
        }, 100)
      }
    }, 50)
  }, [fontSize, theme, terminalId])

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
