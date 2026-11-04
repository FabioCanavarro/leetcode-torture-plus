import styleText from "data-text:./modal.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState } from "react"

import { getRoastMessage } from "../constants"

export const config: PlasmoCSConfig = {
  matches: ["https://leetcode.com/*", "https://leetcode.cn/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

function getDomainFromUrl(url: string | undefined): string {
  if (!url) return "your page"
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, "")
  } catch {
    return "your page"
  }
}

const CongratulationsModal = () => {
  const [showModal, setShowModal] = useState(false)
  const [language, setLanguage] = useState("")
  const [originalUrl, setOriginalUrl] = useState("")

  useEffect(() => {
    // 1. Click-based submission detection (supports new and legacy LeetCode layouts)
    const handleClick = (event: MouseEvent) => {
      let currentTarget = event.target as HTMLElement | null
      while (currentTarget && currentTarget !== document.body) {
        const isSubmitBtn =
          currentTarget.matches?.('button[data-e2e-locator="console-submit-button"]') ||
          currentTarget.matches?.('button[data-cy="submit-code-btn"]') ||
          currentTarget.matches?.('[data-testid="submit-btn"]') ||
          (currentTarget.tagName === "BUTTON" &&
            currentTarget.textContent?.trim()?.toLowerCase() === "submit")

        if (isSubmitBtn) {
          chrome.runtime.sendMessage({ action: "userClickedSubmit" }).catch(() => {})
          break
        }
        currentTarget = currentTarget.parentElement
      }
    }

    // 2. Keyboard shortcut submission (Ctrl+Enter or Cmd+Enter on LeetCode)
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        chrome.runtime.sendMessage({ action: "userClickedSubmit" }).catch(() => {})
      }
      if (event.key === "Escape" && showModal) {
        setShowModal(false)
      }
    }

    // 3. Fallback DOM observer for "Accepted" banner on modern LeetCode
    let observer: MutationObserver | null = null
    try {
      observer = new MutationObserver(() => {
        const acceptedElem =
          document.querySelector('[data-e2e-locator="submission-result"]') ||
          document.querySelector('span[class*="text-green"]') ||
          document.querySelector('div[class*="status-accepted"]')

        if (
          acceptedElem &&
          acceptedElem.textContent?.trim()?.toLowerCase().includes("accepted")
        ) {
          chrome.runtime.sendMessage({
            action: "userSolvedProblemDetected"
          }).catch(() => {})
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })
    } catch (e) {
      console.warn("DOM observer init failed:", e)
    }

    // 4. Background message listener
    const handleMessage = (message: any) => {
      if (message?.action === "userSolvedProblem") {
        setShowModal(true)
        setLanguage(message.language || "")
        if (message.originalUrl) {
          setOriginalUrl(message.originalUrl)
        }
      }
    }

    document.addEventListener("click", handleClick, true)
    document.addEventListener("keydown", handleKeyDown)
    chrome.runtime.onMessage.addListener(handleMessage)

    return () => {
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("keydown", handleKeyDown)
      chrome.runtime.onMessage.removeListener(handleMessage)
      if (observer) observer.disconnect()
    }
  }, [showModal])

  if (!showModal) return null

  const targetDomain = getDomainFromUrl(originalUrl)

  return (
    <div className="modal-background" onClick={() => setShowModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon-badge" style={{ fontSize: "0.85rem", fontWeight: 800 }}>SOLVED</div>
        <h1>Problem Conquered!</h1>
        <p className="modal-roast">{getRoastMessage(language)}</p>

        <div className="modal-actions">
          {originalUrl && (
            <button
              className="primary-modal-button"
              onClick={() => {
                window.location.href = originalUrl
              }}>
              Continue to {targetDomain}
            </button>
          )}

          <button
            className={originalUrl ? "secondary-modal-button" : "primary-modal-button"}
            onClick={() => setShowModal(false)}>
            {originalUrl ? "Stay on LeetCode" : "Claim Freedom"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CongratulationsModal
