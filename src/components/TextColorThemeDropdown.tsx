import React from 'react'
import './TextColorThemeDropdown.css'
import { GenericDropdown } from './GenericDropdown'

interface ThemeOption {
  value: string
  label: string
  color: string
  glowColor?: string
}

// Define available theme options with display names
const THEME_OPTIONS: ThemeOption[] = [
  { value: 'default', label: 'Default', color: '#d4d4d4' },
  { value: 'amber', label: 'Amber', color: '#ffb86c', glowColor: '#ff8800' },
  { value: 'matrix', label: 'Matrix Green', color: '#00ff00', glowColor: '#00ff00' },
  { value: 'dracula', label: 'Dracula', color: '#f8f8f2' },
  { value: 'cyberpunk', label: 'Cyberpunk Neon', color: '#00ffff', glowColor: '#00ffff' },
  { value: 'holographic', label: 'Holographic', color: '#00ff88', glowColor: '#00ff88' },
  { value: 'vaporwave', label: 'Vaporwave', color: '#ff71ce', glowColor: '#ff71ce' },
  { value: 'retro', label: 'Retro Amber', color: '#ffb000', glowColor: '#ffb000' },
  { value: 'synthwave', label: 'Synthwave', color: '#f92aad', glowColor: '#f92aad' },
  { value: 'aurora', label: 'Aurora Borealis', color: '#e0f7fa', glowColor: '#18ffff' },
]

interface TextColorThemeDropdownProps {
  value: string
  onChange: (value: string) => void
  openUpward?: boolean
}

export function TextColorThemeDropdown({ value, onChange, openUpward = false }: TextColorThemeDropdownProps) {
  const selectedOption = THEME_OPTIONS.find(opt => opt.value === value) || THEME_OPTIONS[0]

  return (
    <GenericDropdown<ThemeOption>
      value={selectedOption}
      onChange={(option) => onChange(option.value)}
      options={THEME_OPTIONS}
      getOptionKey={(option) => option.value}
      isSelected={(option, selected) => option.value === selected.value}
      openUpward={openUpward}
      className="text-color-theme-dropdown"
      renderTrigger={(option) => (
        <span
          className="theme-name"
          style={{
            color: option.color,
            textShadow: option.glowColor ? `0 0 8px ${option.glowColor}` : 'none'
          }}
        >
          {option.label}
        </span>
      )}
      renderOption={(option, isSelected) => (
        <span
          style={{
            color: option.color,
            textShadow: option.glowColor ? `0 0 8px ${option.glowColor}` : 'none'
          }}
        >
          {isSelected && <span className="checkmark">✓ </span>}
          {option.label}
        </span>
      )}
    />
  )
}
