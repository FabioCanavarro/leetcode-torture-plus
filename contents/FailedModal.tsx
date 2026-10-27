import styleText from "data-text:./modal.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState } from "react"

import FailImage from "~components/FailImage"

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/*", "https://leetcode.cn/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

const FailedModal = () => {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message?.action === "userFailedProblem") {
        setShowModal(true)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showModal) {
        setShowModal(false)
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [showModal])

  if (!showModal) return null

  return (
    <div className="modal-background fail-modal" onClick={() => setShowModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon-badge">💀</div>
        <h1>Fatal Mistake!</h1>
        <p className="modal-roast">Hyper Torture streak reset to 0. The grind never forgives.</p>

        <div style={{ margin: "1rem 0", maxWidth: "200px" }}>
          <FailImage />
        </div>

        <div className="modal-actions">
          <button
            className="primary-modal-button"
            style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}
            onClick={() => setShowModal(false)}>
            Back to Agony
          </button>
        </div>
      </div>
    </div>
  )
}

export default FailedModal
