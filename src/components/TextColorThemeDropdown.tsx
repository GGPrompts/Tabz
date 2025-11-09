import React, { useState, useRef, useEffect } from 'react'
import './TextColorThemeDropdown.css'
import { terminalThemes, getThemeForTerminalType } from '../styles/terminal-themes'

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
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = THEME_OPTIONS.find(opt => opt.value === value) || THEME_OPTIONS[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (option: ThemeOption) => {
    onChange(option.value)
    setIsOpen(false)
  }

  return (
    <div className="text-color-theme-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="theme-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className="theme-name"
          style={{
            color: selectedOption.color,
            textShadow: selectedOption.glowColor
              ? `0 0 8px ${selectedOption.glowColor}`
              : 'none'
          }}
        >
          {selectedOption.label}
        </span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={`theme-dropdown-menu ${openUpward ? 'open-upward' : ''}`}>
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`theme-dropdown-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
              style={{
                color: option.color,
                textShadow: option.glowColor
                  ? `0 0 8px ${option.glowColor}`
                  : 'none'
              }}
            >
              {option.value === value && <span className="checkmark">✓ </span>}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
