import React, { useState, useRef, useEffect } from 'react'
import './FontFamilyDropdown.css'

interface FontOption {
  value: string
  label: string
  fontFamily: string
}

const FONT_OPTIONS: FontOption[] = [
  { value: 'monospace', label: 'Monospace (Default)', fontFamily: 'monospace' },
  { value: 'Consolas, monospace', label: 'Consolas', fontFamily: 'Consolas, monospace' },
  { value: 'Courier New, monospace', label: 'Courier New', fontFamily: 'Courier New, monospace' },
  { value: "'Cascadia Code', monospace", label: 'Cascadia Code', fontFamily: "'Cascadia Code', monospace" },
  { value: "'Cascadia Mono', monospace", label: 'Cascadia Mono', fontFamily: "'Cascadia Mono', monospace" },
  { value: "'JetBrainsMono Nerd Font', 'JetBrainsMono NF', monospace", label: 'JetBrains Mono NF', fontFamily: "'JetBrainsMono Nerd Font', 'JetBrainsMono NF', monospace" },
  { value: "'FiraCode Nerd Font', 'FiraCode NF', monospace", label: 'Fira Code NF', fontFamily: "'FiraCode Nerd Font', 'FiraCode NF', monospace" },
  { value: "'SauceCodePro Nerd Font', 'SauceCodePro NF', monospace", label: 'Source Code Pro NF', fontFamily: "'SauceCodePro Nerd Font', 'SauceCodePro NF', monospace" },
  { value: "'CaskaydiaCove Nerd Font Mono', 'CaskaydiaCove NFM', monospace", label: 'Caskaydia Cove NF', fontFamily: "'CaskaydiaCove Nerd Font Mono', 'CaskaydiaCove NFM', monospace" },
  { value: "'Hack Nerd Font', monospace", label: 'Hack NF', fontFamily: "'Hack Nerd Font', monospace" },
  { value: "'MesloLGS Nerd Font', monospace", label: 'MesloLGS NF', fontFamily: "'MesloLGS Nerd Font', monospace" },
]

interface FontFamilyDropdownProps {
  value: string
  onChange: (value: string) => void
  openUpward?: boolean // Open menu above trigger instead of below
}

export function FontFamilyDropdown({ value, onChange, openUpward = false }: FontFamilyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = FONT_OPTIONS.find(opt => opt.value === value) || FONT_OPTIONS[0]

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

  const handleSelect = (option: FontOption) => {
    onChange(option.value)
    setIsOpen(false)
  }

  return (
    <div className="font-family-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="font-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ fontFamily: selectedOption.fontFamily }}>
          {selectedOption.label}
        </span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={`font-dropdown-menu ${openUpward ? 'open-upward' : ''}`}>
          {FONT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`font-dropdown-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
              style={{ fontFamily: option.fontFamily }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
