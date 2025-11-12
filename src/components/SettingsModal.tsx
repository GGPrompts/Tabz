import React, { useState, useEffect } from 'react'
import './SettingsModal.css'
import { backgroundGradients } from '../styles/terminal-backgrounds'
import { FontFamilyDropdown } from './FontFamilyDropdown'
import { BackgroundGradientDropdown } from './BackgroundGradientDropdown'
import { TextColorThemeDropdown } from './TextColorThemeDropdown'
import { useSettingsStore } from '../stores/useSettingsStore'

interface SpawnOption {
  label: string
  command: string
  terminalType: string
  icon: string
  description: string
  workingDir?: string
  defaultTheme?: string
  defaultBackground?: string // Background gradient key
  defaultTransparency?: number
  defaultFontFamily?: string
  defaultFontSize?: number
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

// Curated emoji icons for terminal spawn options
const ICON_OPTIONS = [
  '💻', '🖥️', '⌨️', '🖱️', // Computers & Peripherals
  '🤖', '🧠', '👾', '🎮', // AI & Tech
  '📁', '📂', '📄', '📝', // Files
  '⚡', '🔥', '💎', '⭐', // Energy & Quality
  '🚀', '🛸', '🌌', '🌠', // Space
  '🎨', '🎭', '🎪', '🎯', // Arts & Goals
  '🔧', '⚙️', '🔨', '🛠️', // Tools
  '🐚', '🐧', '🐍', '🦀', // Shell & Languages
  '📊', '📈', '📉', '💹', // Data & Charts
  '🔒', '🔓', '🔑', '🛡️', // Security
  '🌐', '🌍', '🗺️', '📡', // Network & World
  '⏱️', '⏰', '⌛', '⏳', // Time
]

export function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'spawn-options' | 'global-defaults'>('spawn-options')
  const [spawnOptions, setSpawnOptions] = useState<SpawnOption[]>([])
  const [originalOptions, setOriginalOptions] = useState<SpawnOption[]>([]) // Track original state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Global settings
  const settings = useSettingsStore()
  const [formData, setFormData] = useState<SpawnOption>({
    label: '',
    command: '',
    terminalType: 'bash',
    icon: '💻',
    description: '',
    workingDir: '', // Empty = use global default
    defaultTheme: 'default',
    defaultBackground: 'dark-neutral',
    defaultTransparency: 100,
    defaultFontFamily: 'monospace',
    defaultFontSize: 14,
  })

  useEffect(() => {
    if (isOpen) {
      loadSpawnOptions()
    }
  }, [isOpen])

  // Close icon picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (showIconPicker && !target.closest('.icon-picker-wrapper')) {
        setShowIconPicker(false)
      }
    }
    if (showIconPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showIconPicker])

  const loadSpawnOptions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/spawn-options')
      const result = await response.json()
      if (result.success) {
        setSpawnOptions(result.data)
        setOriginalOptions(JSON.parse(JSON.stringify(result.data))) // Deep copy for comparison

        // Load global defaults from file and apply to settings store
        if (result.globalDefaults) {
          const defaults = result.globalDefaults
          settings.updateSettings({
            workingDirectory: defaults.workingDirectory ?? settings.workingDirectory,
            terminalDefaultFontFamily: defaults.fontFamily ?? settings.terminalDefaultFontFamily,
            terminalDefaultFontSize: defaults.fontSize ?? settings.terminalDefaultFontSize,
            terminalDefaultTheme: defaults.theme ?? settings.terminalDefaultTheme,
            terminalDefaultBackground: defaults.background ?? settings.terminalDefaultBackground,
            terminalDefaultTransparency: (defaults.transparency ?? 100) / 100, // Convert % to 0-1
            useTmux: defaults.useTmux ?? settings.useTmux,
          })
        }
      } else {
        setError('Failed to load spawn options')
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return JSON.stringify(spawnOptions) !== JSON.stringify(originalOptions)
  }

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const saveSpawnOptions = async () => {
    setIsSaving(true)
    setError(null)
    try {
      // Build globalDefaults from current settings store
      const globalDefaults = {
        workingDirectory: settings.workingDirectory,
        fontFamily: settings.terminalDefaultFontFamily,
        fontSize: settings.terminalDefaultFontSize,
        theme: settings.terminalDefaultTheme,
        background: settings.terminalDefaultBackground,
        transparency: Math.round(settings.terminalDefaultTransparency * 100), // Convert 0-1 to %
        useTmux: settings.useTmux,
      }

      const response = await fetch('/api/spawn-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spawnOptions, globalDefaults }),
      })
      const result = await response.json()
      if (result.success) {
        onSave()
        onClose()
      } else {
        setError('Failed to save: ' + result.message)
      }
    } catch (err) {
      setError('Save error: ' + (err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddOption = () => {
    if (!formData.label || !formData.command) {
      alert('Label and Command are required')
      return
    }
    // Clean up empty workingDir (convert to undefined for cleaner JSON)
    const cleanedData = { ...formData }
    if (!cleanedData.workingDir) {
      delete cleanedData.workingDir
    }
    setSpawnOptions([...spawnOptions, cleanedData])
    resetForm()
  }

  const handleUpdateOption = () => {
    if (editingIndex === null) return
    if (!formData.label || !formData.command) {
      alert('Label and Command are required')
      return
    }
    // Clean up empty workingDir (convert to undefined for cleaner JSON)
    const cleanedData = { ...formData }
    if (!cleanedData.workingDir) {
      delete cleanedData.workingDir
    }
    const updated = [...spawnOptions]
    updated[editingIndex] = cleanedData
    setSpawnOptions(updated)
    resetForm()
  }

  const handleEditOption = (index: number) => {
    const option = spawnOptions[index]
    // Fill in global defaults for any undefined fields
    setFormData({
      ...option,
      workingDir: option.workingDir || '', // Convert undefined to empty string to show placeholder
      defaultFontSize: option.defaultFontSize ?? 16, // Use global default if not set
      defaultFontFamily: option.defaultFontFamily ?? 'monospace',
      defaultTheme: option.defaultTheme ?? 'default',
      defaultBackground: option.defaultBackground ?? 'dark-neutral',
      defaultTransparency: option.defaultTransparency ?? 100,
    })
    setEditingIndex(index)
    setIsAdding(true)
  }

  const handleDeleteOption = (index: number) => {
    if (confirm('Delete this spawn option?')) {
      setSpawnOptions(spawnOptions.filter((_, i) => i !== index))
    }
  }

  const moveOption = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= spawnOptions.length) return

    const updated = [...spawnOptions]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setSpawnOptions(updated)
  }

  const resetForm = () => {
    setFormData({
      label: '',
      command: '',
      terminalType: 'bash',
      icon: '💻',
      description: '',
      workingDir: '', // Empty = use global default
      defaultTheme: 'default',
      defaultBackground: 'dark-neutral',
      defaultTransparency: 100,
      defaultFontFamily: 'monospace',
      defaultFontSize: 14,
    })
    setIsAdding(false)
    setEditingIndex(null)
    setShowIconPicker(false)
  }

  const handleIconSelect = (icon: string) => {
    setFormData({ ...formData, icon })
    setShowIconPicker(false)
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Add a subtle opacity to the dragged element
    ;(e.target as HTMLElement).style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    ;(e.target as HTMLElement).style.opacity = '1'
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault() // Allow drop
    e.dataTransfer.dropEffect = 'move'

    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null)
      return
    }

    const updated = [...spawnOptions]
    const draggedItem = updated[draggedIndex]

    // Remove from old position
    updated.splice(draggedIndex, 1)
    // Insert at new position
    updated.splice(dropIndex, 0, draggedItem)

    setSpawnOptions(updated)
    setDragOverIndex(null)
  }

  if (!isOpen) return null

  return (
    <div className="settings-modal-overlay" onClick={handleClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'spawn-options' ? 'active' : ''}`}
            onClick={() => setActiveTab('spawn-options')}
          >
            Spawn Options
          </button>
          <button
            className={`settings-tab ${activeTab === 'global-defaults' ? 'active' : ''}`}
            onClick={() => setActiveTab('global-defaults')}
          >
            Global Defaults
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="settings-body">
          {activeTab === 'global-defaults' ? (
            <div className="global-defaults-panel">
              <div className="settings-section">
                <h3>📁 Default Working Directory</h3>
                <p className="setting-description">Used when spawn options don't specify a directory</p>
                <input
                  type="text"
                  value={settings.workingDirectory}
                  onChange={(e) => settings.updateSettings({ workingDirectory: e.target.value })}
                  placeholder="/home/matt"
                />
              </div>

              <div className="settings-section">
                <h3>🔤 Default Font Family</h3>
                <p className="setting-description">Used when spawn options don't specify a font</p>
                <FontFamilyDropdown
                  value={settings.terminalDefaultFontFamily}
                  onChange={(family) => settings.updateSettings({ terminalDefaultFontFamily: family })}
                />
              </div>

              <div className="settings-section">
                <h3>📏 Default Font Size</h3>
                <p className="setting-description">Used when spawn options don't specify a size</p>
                <input
                  type="number"
                  min="8"
                  max="48"
                  value={settings.terminalDefaultFontSize}
                  onChange={(e) => settings.updateSettings({ terminalDefaultFontSize: Number(e.target.value) })}
                />
              </div>

              <div className="settings-section">
                <h3>🎨 Default Text Color Theme</h3>
                <p className="setting-description">Used when spawn options don't specify a theme</p>
                <TextColorThemeDropdown
                  value={settings.terminalDefaultTheme}
                  onChange={(theme) => settings.updateSettings({ terminalDefaultTheme: theme as any })}
                />
              </div>

              <div className="settings-section">
                <h3>🌈 Default Background Gradient</h3>
                <p className="setting-description">Used when spawn options don't specify a background</p>
                <BackgroundGradientDropdown
                  value={settings.terminalDefaultBackground}
                  onChange={(background) => settings.updateSettings({ terminalDefaultBackground: background })}
                />
              </div>

              <div className="settings-section">
                <h3>✨ Default Transparency</h3>
                <p className="setting-description">Used when spawn options don't specify transparency</p>
                <div className="transparency-control">
                  <span className="transparency-label">{Math.round(settings.terminalDefaultTransparency * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(settings.terminalDefaultTransparency * 100)}
                    onChange={(e) => settings.updateSettings({ terminalDefaultTransparency: Number(e.target.value) / 100 })}
                  />
                </div>
              </div>

              <div className="settings-section">
                <h3>📜 Use Tmux</h3>
                <p className="setting-description">Enable tmux for session persistence</p>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.useTmux}
                    onChange={(e) => settings.updateSettings({ useTmux: e.target.checked })}
                  />
                  Enable tmux by default
                </label>
              </div>

              <div className="priority-info">
                <h4>⚡ Priority System</h4>
                <p>Settings are applied in this order:</p>
                <ol>
                  <li><strong>Per-terminal overrides</strong> (footer controls) - highest priority</li>
                  <li><strong>Spawn option defaults</strong> (Spawn Options tab)</li>
                  <li><strong>Global defaults</strong> (this tab) - lowest priority</li>
                </ol>
              </div>
            </div>
          ) : isLoading ? (
            <div className="loading">Loading...</div>
          ) : !isAdding ? (
            <>
              <div className="options-list-header">
                <h3>Spawn Options ({spawnOptions.length})</h3>
                <button className="add-btn" onClick={() => setIsAdding(true)}>
                  + Add New
                </button>
              </div>

              <div className="options-list">
                {spawnOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`option-item ${dragOverIndex === index ? 'drag-over' : ''} ${draggedIndex === index ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="option-drag-handle" title="Drag to reorder">⋮⋮</div>
                    <div className="option-main">
                      <span className="option-icon">{option.icon}</span>
                      <div className="option-details">
                        <div className="option-label">
                          {option.label}
                          {index === 0 && <span className="default-badge">DEFAULT</span>}
                        </div>
                        <div className="option-meta">
                          {option.command || 'bash'} • {option.terminalType}
                          {(option.workingDir || settings.workingDirectory) && ` • ${option.workingDir || settings.workingDirectory}`}
                        </div>
                      </div>
                    </div>
                    <div className="option-actions">
                      <button
                        className="move-btn"
                        onClick={() => moveOption(index, 'up')}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        className="move-btn"
                        onClick={() => moveOption(index, 'down')}
                        disabled={index === spawnOptions.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => handleEditOption(index)}
                        title="Edit"
                      >
                        🎨
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteOption(index)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="settings-footer">
                <button className="cancel-btn" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  className="save-btn"
                  onClick={saveSpawnOptions}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          ) : (
            <div className="option-form">
              <h3>{editingIndex !== null ? 'Edit Option' : 'New Spawn Option'}</h3>

              <div className="form-row">
                <label>
                  Label *
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g., Claude Code"
                  />
                </label>
                <label>
                  Icon
                  <div className="icon-picker-wrapper">
                    <button
                      type="button"
                      className="icon-picker-trigger"
                      onClick={() => setShowIconPicker(!showIconPicker)}
                    >
                      <span className="selected-icon">{formData.icon}</span>
                      <span className="picker-arrow">▼</span>
                    </button>
                    {showIconPicker && (
                      <div className="icon-picker-dropdown">
                        {ICON_OPTIONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                            onClick={() => handleIconSelect(icon)}
                            title={icon}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <label>
                Command *
                <input
                  type="text"
                  value={formData.command}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  placeholder="e.g., claude, bash, lazygit"
                />
              </label>

              <div className="form-row">
                <label>
                  Terminal Type
                  <select
                    value={formData.terminalType}
                    onChange={(e) => setFormData({ ...formData, terminalType: e.target.value })}
                  >
                    <option value="bash">bash</option>
                    <option value="claude-code">claude-code</option>
                    <option value="opencode">opencode</option>
                    <option value="codex">codex</option>
                    <option value="gemini">gemini</option>
                    <option value="tui-tool">tui-tool</option>
                  </select>
                </label>
                <label>
                  Working Directory
                  <input
                    type="text"
                    value={formData.workingDir}
                    onChange={(e) => setFormData({ ...formData, workingDir: e.target.value })}
                    placeholder={settings.workingDirectory || '/home/matt'}
                  />
                </label>
              </div>

              <label>
                Description
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </label>

              <div className="form-row">
                <label>
                  Text Color Theme
                  <TextColorThemeDropdown
                    value={formData.defaultTheme}
                    onChange={(value) => setFormData({ ...formData, defaultTheme: value })}
                  />
                </label>
                <label>
                  Background Gradient
                  <BackgroundGradientDropdown
                    value={formData.defaultBackground}
                    onChange={(value) => setFormData({ ...formData, defaultBackground: value })}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Transparency
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.defaultTransparency}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultTransparency: parseInt(e.target.value) })
                    }
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Font Family
                  <FontFamilyDropdown
                    value={formData.defaultFontFamily}
                    onChange={(value) => setFormData({ ...formData, defaultFontFamily: value })}
                  />
                </label>
                <label>
                  Font Size (px)
                  <input
                    type="number"
                    min="10"
                    max="24"
                    placeholder="16 (default)"
                    value={formData.defaultFontSize}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultFontSize: parseInt(e.target.value) })
                    }
                  />
                </label>
              </div>

              <div className="form-actions">
                <button className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
                <button
                  className="save-btn"
                  onClick={editingIndex !== null ? handleUpdateOption : handleAddOption}
                >
                  {editingIndex !== null ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
