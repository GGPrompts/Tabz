import { useEffect, useState } from 'react'

/**
 * Custom hook to track Alt key state (pressed/released).
 *
 * Returns true when Alt key is held down, false when released.
 * Useful for showing alternative UI states while Alt is pressed
 * (e.g., showing tab numbers instead of icons for Alt+1-9 shortcuts).
 */
export function useAltKeyState() {
  const [isAltPressed, setIsAltPressed] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsAltPressed(false)
      }
    }

    // Handle window blur to reset state (in case Alt is released while window is unfocused)
    const handleBlur = () => {
      setIsAltPressed(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return isAltPressed
}
