import React, { useState, useRef, useEffect } from 'react'
import './BackgroundGradientDropdown.css'
import { backgroundGradients, BackgroundGradient } from '../styles/terminal-backgrounds'

interface BackgroundGradientDropdownProps {
  value: string
  onChange: (value: string) => void
  openUpward?: boolean // Open menu above trigger instead of below
}

export function BackgroundGradientDropdown({ value, onChange, openUpward = false }: BackgroundGradientDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedKey = value || 'dark-neutral'
  const selectedBg = backgroundGradients[selectedKey] || backgroundGradients['dark-neutral']

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

  const handleSelect = (key: string) => {
    onChange(key)
    setIsOpen(false)
  }

  const renderGradientPreview = (bg: BackgroundGradient) => {
    return (
      <div className="gradient-preview-swatch" style={{ background: bg.gradient }}>
        {/* Dots showing key colors */}
        <div className="gradient-preview-dots">
          {bg.preview.map((color, idx) => (
            <div
              key={idx}
              className="gradient-preview-dot"
              style={{ background: color }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="background-gradient-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="gradient-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="gradient-trigger-content">
          {renderGradientPreview(selectedBg)}
          <span className="gradient-name">{selectedBg.name}</span>
        </div>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={`gradient-dropdown-menu ${openUpward ? 'open-upward' : ''}`}>
          {Object.entries(backgroundGradients).map(([key, bg]) => (
            <button
              key={key}
              type="button"
              className={`gradient-dropdown-option ${key === selectedKey ? 'selected' : ''}`}
              onClick={() => handleSelect(key)}
            >
              {renderGradientPreview(bg)}
              <div className="gradient-option-info">
                <div className="gradient-option-name">{bg.name}</div>
                {bg.description && (
                  <div className="gradient-option-description">{bg.description}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
