import React, { useState, useEffect } from 'react'
import { Terminal, Copy, Play, ChevronDown, ChevronRight, Check, Settings } from 'lucide-react'
import { sendMessage } from '../shared/messaging'
import { CommandEditorModal } from './CommandEditorModal'

interface Command {
  label: string
  command: string
  description: string
  category: string
  type: 'spawn' | 'clipboard'
  isCustom?: boolean
}

export function QuickCommandsPanel() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Terminal Spawning', 'Development'])
  )
  const [lastCopied, setLastCopied] = useState<string | null>(null)
  const [customCommands, setCustomCommands] = useState<Command[]>([])
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Load custom commands from storage on mount
  useEffect(() => {
    chrome.storage.local.get(['customCommands'], (result) => {
      if (result.customCommands && Array.isArray(result.customCommands)) {
        setCustomCommands(result.customCommands as Command[])
      }
    })
  }, [])

  const handleSaveCommands = (commands: Command[]) => {
    setCustomCommands(commands)
    chrome.storage.local.set({ customCommands: commands }, () => {
      console.log('Custom commands saved:', commands.length)
    })
  }

  const defaultCommands: Command[] = [
    // Terminal Spawning
    { label: 'Claude Code', command: 'claude-code', description: 'Start Claude Code interactive session', category: 'Terminal Spawning', type: 'spawn' },
    { label: 'Bash Terminal', command: 'bash', description: 'Standard Bash shell', category: 'Terminal Spawning', type: 'spawn' },
    { label: 'TFE (Terminal File Editor)', command: 'tfe', description: 'Terminal File Explorer', category: 'Terminal Spawning', type: 'spawn' },
    { label: 'LazyGit', command: 'lazygit', description: 'Git TUI interface', category: 'Terminal Spawning', type: 'spawn' },
    { label: 'Htop', command: 'htop', description: 'Interactive process viewer', category: 'Terminal Spawning', type: 'spawn' },

    // Git Commands (copy to clipboard)
    { label: 'Git Status', command: 'git status', description: 'Show working tree status', category: 'Git', type: 'clipboard' },
    { label: 'Git Pull', command: 'git pull', description: 'Pull from remote', category: 'Git', type: 'clipboard' },
    { label: 'Git Push', command: 'git push', description: 'Push to remote', category: 'Git', type: 'clipboard' },
    { label: 'Stage All', command: 'git add .', description: 'Stage all changes', category: 'Git', type: 'clipboard' },
    { label: 'Commit', command: 'git commit -m "message"', description: 'Commit with message', category: 'Git', type: 'clipboard' },
    { label: 'New Branch', command: 'git checkout -b feature-branch', description: 'Create and switch branch', category: 'Git', type: 'clipboard' },

    // Development Commands
    { label: 'Start Dev Server', command: 'npm run dev', description: 'Start development server', category: 'Development', type: 'clipboard' },
    { label: 'Install Dependencies', command: 'npm install', description: 'Install node modules', category: 'Development', type: 'clipboard' },
    { label: 'Build', command: 'npm run build', description: 'Build for production', category: 'Development', type: 'clipboard' },
    { label: 'Test', command: 'npm test', description: 'Run tests', category: 'Development', type: 'clipboard' },
    { label: 'Clean Install', command: 'rm -rf node_modules && npm install', description: 'Delete node_modules and reinstall', category: 'Development', type: 'clipboard' },

    // Shell Commands
    { label: 'List Files', command: 'ls -la', description: 'List directory contents with details', category: 'Shell', type: 'clipboard' },
    { label: 'Create Folder', command: 'mkdir new-folder', description: 'Create new directory', category: 'Shell', type: 'clipboard' },
    { label: 'Find Files', command: 'find . -name "*.ts"', description: 'Find TypeScript files', category: 'Shell', type: 'clipboard' },
    { label: 'Disk Usage', command: 'du -sh *', description: 'Show disk usage by directory', category: 'Shell', type: 'clipboard' },
    { label: 'Process List', command: 'ps aux | grep node', description: 'List Node.js processes', category: 'Shell', type: 'clipboard' },
  ]

  // Merge default commands with custom commands
  const commands: Command[] = [...defaultCommands, ...customCommands]

  // Get all unique categories
  const categories = [...new Set(commands.map(c => c.category))]
  const allCategories = [...new Set([...defaultCommands.map(c => c.category), ...customCommands.map(c => c.category)])]

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const handleCommandClick = async (command: Command) => {
    if (command.type === 'spawn') {
      // Spawn a new terminal
      sendMessage({
        type: 'SPAWN_TERMINAL',
        spawnOption: command.command,
      })
      setLastCopied(`Spawning: ${command.label}`)
      setTimeout(() => setLastCopied(null), 2000)
    } else {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(command.command)
        setLastCopied(`Copied: ${command.command}`)
        setTimeout(() => setLastCopied(null), 3000)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  const getCommandIcon = (command: Command) => {
    if (command.type === 'spawn') return Play
    return Copy
  }

  return (
    <>
      <div className="h-full flex flex-col bg-[#0a0a0a] text-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-[#00ff88]" />
            <h3 className="font-semibold text-white">Quick Commands</h3>
            {customCommands.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30">
                {customCommands.length} custom
              </span>
            )}
          </div>
          <button
            onClick={() => setIsEditorOpen(true)}
            className="p-1.5 hover:bg-[#00ff88]/10 rounded transition-colors text-gray-400 hover:text-[#00ff88]"
            title="Edit Commands"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

      {/* Notification */}
      {lastCopied && (
        <div className="mx-4 mt-3 px-3 py-2 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-md flex items-center gap-2 text-sm text-[#00ff88]">
          <Check className="h-4 w-4" />
          <span>{lastCopied}</span>
        </div>
      )}

      {/* Commands List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {categories.map(category => {
          const categoryCommands = commands.filter(c => c.category === category)
          const isExpanded = expandedCategories.has(category)
          const Icon = isExpanded ? ChevronDown : ChevronRight

          return (
            <div key={category} className="mb-3">
              {/* Category Header */}
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors text-sm font-medium text-gray-200"
                onClick={() => toggleCategory(category)}
              >
                <Icon className="h-4 w-4 text-gray-400" />
                <span className="text-white">{category}</span>
                <span className="ml-auto text-gray-500 text-xs">
                  ({categoryCommands.length})
                </span>
              </button>

              {/* Category Commands */}
              {isExpanded && (
                <div className="mt-1 ml-6 space-y-1">
                  {categoryCommands.map((command, index) => {
                    const CommandIcon = getCommandIcon(command)

                    return (
                      <button
                        key={index}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-white/5 transition-colors group"
                        onClick={() => handleCommandClick(command)}
                        title={`${command.type === 'spawn' ? 'Spawn' : 'Copy'}: ${command.command}`}
                      >
                        <div className="flex items-start gap-2">
                          <CommandIcon className="h-4 w-4 mt-0.5 text-[#00ff88] group-hover:text-[#00c8ff] transition-colors" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-white">{command.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {command.description}
                            </div>
                            <div className="mt-1 px-2 py-1 bg-black/30 rounded text-xs font-mono truncate text-gray-300 border border-gray-800">
                              {command.command}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      </div>

      {/* Command Editor Modal */}
      <CommandEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveCommands}
        customCommands={customCommands}
        allCategories={allCategories}
      />
    </>
  )
}
