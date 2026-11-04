import React, { useState } from "react"

interface HyperTortureModeProps {
  message: string
  problemName: string
  problemURL?: string
  problemDifficulty?: string
  problemCategory?: string
}

const HyperTortureMode: React.FC<HyperTortureModeProps> = ({
  message,
  problemName,
  problemURL,
  problemDifficulty = "Medium",
  problemCategory = "General"
}) => {
  const [hoverText, setHoverText] = useState("")

  const diffClass =
    problemDifficulty?.toLowerCase() === "easy"
      ? "diff-easy"
      : problemDifficulty?.toLowerCase() === "hard"
      ? "diff-hard"
      : "diff-medium"

  return (
    <div className="hyper-torture-card">
      <div className="hyper-banner">
        <span className="pulse-dot"></span>
        <span className="hyper-badge">HYPER TORTURE ACTIVE</span>
      </div>

      <p className="hyper-message">{message}</p>

      <div className="problem-spotlight">
        <div className="problem-meta-row">
          <span className={`diff-pill ${diffClass}`}>{problemDifficulty}</span>
          <span className="category-pill">{problemCategory}</span>
        </div>

        <h2 className="spotlight-title">{problemName}</h2>

        <button
          className="solve-btn hyper-btn"
          onMouseEnter={() => setHoverText("No Escape")}
          onMouseLeave={() => setHoverText("")}
          onClick={() => {
            if (problemURL) {
              chrome.tabs.create({ url: problemURL })
            }
          }}>
          {hoverText || "Face the Gauntlet"}
        </button>
      </div>
    </div>
  )
}

export default HyperTortureMode
