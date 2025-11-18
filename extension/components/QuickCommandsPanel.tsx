import React, { useState, useEffect } from 'react'
import { Terminal, Copy, Play, ChevronDown, ChevronRight, Check, Settings, Search, Folder, Edit, ExternalLink } from 'lucide-react'
import { sendMessage } from '../shared/messaging'
import { CommandEditorModal } from './CommandEditorModal'

interface Command {
  label: string
  command: string
  description: string
  category: string
  type: 'spawn' | 'clipboard'
  isCustom?: boolean
  workingDir?: string
  url?: string
}

export function QuickCommandsPanel() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Terminal Spawning', 'Development'])
  )
  const [lastCopied, setLastCopied] = useState<string | null>(null)
  const [customCommands, setCustomCommands] = useState<Command[]>([])
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [workingDirOverride, setWorkingDirOverride] = useState('')
  const [commandToEdit, setCommandToEdit] = useState<Command | null>(null)

  // Load custom commands and working dir override from storage on mount
  useEffect(() => {
    chrome.storage.local.get(['customCommands', 'commandsWorkingDirectory'], (result) => {
      if (result.customCommands && Array.isArray(result.customCommands)) {
        setCustomCommands(result.customCommands as Command[])
      }
      if (result.commandsWorkingDirectory && typeof result.commandsWorkingDirectory === 'string') {
        setWorkingDirOverride(result.commandsWorkingDirectory)
      }
    })
  }, [])

  // Save working directory override to storage when it changes
  useEffect(() => {
    chrome.storage.local.set({ commandsWorkingDirectory: workingDirOverride }, () => {
      console.log('Working directory override saved:', workingDirOverride)
    })
  }, [workingDirOverride])

  const handleSaveCommands = (commands: Command[]) => {
    setCustomCommands(commands)
    chrome.storage.local.set({ customCommands: commands }, () => {
      console.log('Custom commands saved:', commands.length)
    })
  }

  const defaultCommands: Command[] = [
    // Terminal Spawning
    { label: 'Claude Code', command: 'claude-code', description: 'Start Claude Code interactive session', category: 'Terminal Spawning', type: 'spawn', url: 'https://github.com/anthropics/claude-code' },
    { label: 'Bash Terminal', command: 'bash', description: 'Standard Bash shell', category: 'Terminal Spawning', type: 'spawn' },
    { label: 'TFE (Terminal File Editor)', command: 'tfe', description: 'Terminal File Explorer', category: 'Terminal Spawning', type: 'spawn', url: 'https://github.com/GGPrompts/tfe' },
    { label: 'LazyGit', command: 'lazygit', description: 'Git TUI interface', category: 'Terminal Spawning', type: 'spawn', url: 'https://github.com/jesseduffield/lazygit' },
    { label: 'Htop', command: 'htop', description: 'Interactive process viewer', category: 'Terminal Spawning', type: 'spawn', url: 'https://htop.dev' },

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

  // Filter commands based on search query
  const filteredCommands = searchQuery.trim()
    ? commands.filter(cmd => {
        const query = searchQuery.toLowerCase()
        return (
          cmd.label.toLowerCase().includes(query) ||
          cmd.command.toLowerCase().includes(query) ||
          cmd.description.toLowerCase().includes(query) ||
          cmd.category.toLowerCase().includes(query)
        )
      })
    : commands

  // Get all unique categories from filtered commands
  const categories = [...new Set(filteredCommands.map(c => c.category))]
  const allCategories = [...new Set([...defaultCommands.map(c => c.category), ...customCommands.map(c => c.category)])]

  // Auto-expand categories with matches when searching
  useEffect(() => {
    if (searchQuery.trim()) {
      // Expand all categories that have matching commands
      setExpandedCategories(new Set(categories))
    } else {
      // Reset to default expanded categories when search is cleared
      setExpandedCategories(new Set(['Terminal Spawning', 'Development']))
    }
  }, [searchQuery, categories.join(',')])

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
      // Determine working directory with priority logic:
      // 1. Command-specific working dir (highest priority)
      // 2. Global override
      // 3. Undefined (backend will use default)
      const workingDir = command.workingDir || workingDirOverride || undefined

      // Spawn a new terminal
      sendMessage({
        type: 'SPAWN_TERMINAL',
        spawnOption: command.command,
        cwd: workingDir,
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

  const handleEditCommand = (command: Command, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent command execution
    setCommandToEdit(command)
    setIsEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setIsEditorOpen(false)
    setCommandToEdit(null)
  }

  const handleOpenUrl = (url: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent command execution
    chrome.tabs.create({ url, active: false }) // Open in background tab
  }

  return (
    <>
      <div className="h-full flex flex-col bg-[#0a0a0a] text-gray-200 overflow-hidden">
      {/* Notification */}
      {lastCopied && (
        <div className="mx-4 mt-3 px-3 py-2 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-md flex items-center gap-2 text-sm text-[#00ff88]">
          <Check className="h-4 w-4" />
          <span>{lastCopied}</span>
        </div>
      )}

      {/* Working Directory Override */}
      <div className="px-4 py-3 border-b border-gray-800 bg-[#0a0a0a]">
        <label className="block text-xs text-gray-400 mb-2">
          Working Directory (global override)
        </label>
        <div className="relative">
          <Folder className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={workingDirOverride}
            onChange={(e) => setWorkingDirOverride(e.target.value)}
            placeholder="/home/user/projects/..."
            className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700 rounded-md text-white text-sm font-mono placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Used for spawned terminals unless command has specific working directory
        </p>
      </div>

      {/* Search Input */}
      <div className="px-4 py-3 border-b border-gray-800 bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands..."
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-gray-700 rounded-md text-white text-sm placeholder-gray-500 focus:border-[#00ff88] focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => setIsEditorOpen(true)}
            className="p-2 hover:bg-[#00ff88]/10 rounded transition-colors text-gray-400 hover:text-[#00ff88] border border-gray-700 hover:border-[#00ff88]"
            title="Edit Commands"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Commands List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No commands found matching "{searchQuery}"
          </div>
        ) : (
          categories.map(category => {
            const categoryCommands = filteredCommands.filter(c => c.category === category)
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
                      <div key={index} className="relative group">
                        <button
                          className="w-full text-left px-3 py-2 pr-20 rounded-md hover:bg-white/5 transition-colors"
                          onClick={() => handleCommandClick(command)}
                          title={`${command.type === 'spawn' ? 'Spawn' : 'Copy'}: ${command.command}`}
                        >
                          <div className="flex items-start gap-2">
                            <CommandIcon className="h-4 w-4 mt-0.5 text-[#00ff88] transition-colors" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-sm text-white">{command.label}</div>
                                {command.isCustom && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    custom
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {command.description}
                              </div>
                              <div className="mt-1 px-2 py-1 bg-black/30 rounded text-xs font-mono truncate text-gray-300 border border-gray-800">
                                {command.command}
                              </div>
                              {command.workingDir && (
                                <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                                  <Folder className="h-3 w-3" />
                                  <span className="font-mono truncate">{command.workingDir}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                        <div className="absolute right-2 top-2 flex items-center gap-1">
                          {command.url && (
                            <button
                              onClick={(e) => handleOpenUrl(command.url!, e)}
                              className="p-1.5 rounded bg-black/80 border border-gray-700 opacity-40 group-hover:opacity-100 hover:bg-blue-500/10 hover:border-blue-500 transition-all"
                              title={`Open: ${command.url}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-blue-400" />
                            </button>
                          )}
                          {command.isCustom && (
                            <button
                              onClick={(e) => handleEditCommand(command, e)}
                              className="p-1.5 rounded bg-black/80 border border-gray-700 opacity-40 group-hover:opacity-100 hover:bg-[#00ff88]/10 hover:border-[#00ff88] transition-all"
                              title="Edit command"
                            >
                              <Edit className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#00ff88]" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
          })
        )}
      </div>
      </div>

      {/* Command Editor Modal */}
      <CommandEditorModal
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveCommands}
        customCommands={customCommands}
        allCategories={allCategories}
        initialEditCommand={commandToEdit}
      />
    </>
  )
}
