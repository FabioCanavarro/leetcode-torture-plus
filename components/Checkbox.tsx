import React from "react"

interface CheckboxProps {
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  name: string
  checked: boolean
}

const Checkbox: React.FC<CheckboxProps> = ({ handleChange, name, checked }) => {
  return (
    <div className="toggle-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        name={name}
        id={name}
        className="toggle-input"
      />
      <label htmlFor={name} className="toggle-label"></label>
    </div>
  )
}

export default Checkbox