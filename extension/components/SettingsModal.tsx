import React, { useState, useEffect } from 'react'
import { X, Type, Moon, Sun } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface TerminalSettings {
  fontSize: number
  theme: 'dark' | 'light'
}

const DEFAULT_SETTINGS: TerminalSettings = {
  fontSize: 14,
  theme: 'dark',
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<TerminalSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    // Load settings from Chrome storage
    chrome.storage.local.get(['terminalSettings'], (result) => {
      if (result.terminalSettings) {
        setSettings(result.terminalSettings as TerminalSettings)
      }
    })
  }, [isOpen])

  const handleSave = () => {
    chrome.storage.local.set({ terminalSettings: settings }, () => {
      console.log('[Settings] Saved:', settings)
      // Broadcast settings change to trigger terminal updates
      chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        settings,
      })
      onClose()
    })
  }

  const handleFontSizeChange = (value: number) => {
    setSettings({ ...settings, fontSize: value })
  }

  const handleThemeToggle = () => {
    setSettings({
      ...settings,
      theme: settings.theme === 'dark' ? 'light' : 'dark',
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Terminal Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Font Size */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
              <Type className="h-4 w-4 text-[#00ff88]" />
              Font Size: {settings.fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="24"
              step="1"
              value={settings.fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00ff88]"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>12px</span>
              <span>18px</span>
              <span>24px</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white mb-3">
              {settings.theme === 'dark' ? (
                <Moon className="h-4 w-4 text-[#00ff88]" />
              ) : (
                <Sun className="h-4 w-4 text-[#00ff88]" />
              )}
              Theme
            </label>
            <button
              onClick={handleThemeToggle}
              className={`
                w-full px-4 py-3 rounded-lg border transition-all flex items-center justify-between
                ${
                  settings.theme === 'dark'
                    ? 'bg-gray-900 border-gray-700 hover:border-gray-600'
                    : 'bg-gray-100 border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <span
                className={
                  settings.theme === 'dark' ? 'text-white' : 'text-gray-900'
                }
              >
                {settings.theme === 'dark' ? 'Dark Theme' : 'Light Theme'}
              </span>
              {settings.theme === 'dark' ? (
                <Moon className="h-5 w-5 text-[#00ff88]" />
              ) : (
                <Sun className="h-5 w-5 text-orange-500" />
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {settings.theme === 'dark'
                ? 'Black background with green text'
                : 'White background with dark text'}
            </p>
          </div>

          {/* Preview */}
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Preview
            </label>
            <div
              className={`
                p-4 rounded-lg border font-mono
                ${
                  settings.theme === 'dark'
                    ? 'bg-black border-gray-800 text-[#00ff88]'
                    : 'bg-white border-gray-300 text-gray-900'
                }
              `}
              style={{ fontSize: `${settings.fontSize}px` }}
            >
              $ echo "Hello, Terminal!"
              <br />
              Hello, Terminal!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#00ff88] hover:bg-[#00c8ff] text-black rounded text-sm font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for loading terminal settings
export function useTerminalSettings() {
  const [settings, setSettings] = useState<TerminalSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    // Load initial settings
    chrome.storage.local.get(['terminalSettings'], (result) => {
      if (result.terminalSettings) {
        setSettings(result.terminalSettings as TerminalSettings)
      }
    })

    // Listen for settings updates
    const handleMessage = (message: any) => {
      if (message.type === 'SETTINGS_UPDATED') {
        setSettings(message.settings as TerminalSettings)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])

  return settings
}
