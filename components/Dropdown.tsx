import React, { useEffect, useState } from "react"

interface DropdownProps {
  options: Record<string, string>
  defaultValue: string
  handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  name: string
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  defaultValue,
  handleChange,
  name
}) => {
  const [value, setValue] = useState(defaultValue || "")

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(e.target.value)
    handleChange(e)
  }

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  return (
    <div className="select-container">
      <select
        name={name}
        onChange={onChange}
        id={name}
        className="setting-dropdown"
        value={value}>
        {Object.keys(options).map((key) => (
          <option value={key} key={key}>
            {options[key]}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Dropdown
