import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`w-11 h-6 rounded-full transition-colors shrink-0 flex items-center px-0.5 active:scale-95 disabled:opacity-50 ${
      checked ? 'bg-primary' : 'bg-border'
    }`}
  >
    <div
      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
)

export default Toggle
