import { useStorage } from "@plasmohq/storage/hook"
import React, { useState } from "react"

import {
  checkLeetCodeSession,
  fetchLeetCodeProfile,
  syncUserSolvedProblems
} from "~leetcodeApi"
import { storage } from "~storage"

const LeetCodeAccountCard: React.FC = () => {
  const [leetcodeUsername, setLeetCodeUsername] = useStorage<string>(
    "leetcodeUsername",
    ""
  )
  const [leetcodeAvatar, setLeetCodeAvatar] = useStorage<string>(
    "leetcodeAvatar",
    ""
  )
  const [leetcodeStats, setLeetCodeStats] = useStorage<any>(
    "leetcodeStats",
    null
  )
  const [solvedProblemSlugs] = useStorage<string[]>("solvedProblemSlugs", [])

  const [inputUsername, setInputUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null)

  const handleLinkUsername = async (targetUsername?: string) => {
    const uname = (targetUsername || inputUsername).trim()
    if (!uname) {
      setMessage({ text: "Please enter a valid LeetCode username.", type: "error" })
      return
    }

    try {
      setIsLoading(true)
      setMessage({ text: "Verifying LeetCode profile...", type: "info" })

      const profile = await fetchLeetCodeProfile(uname)
      await setLeetCodeUsername(profile.username)
      await setLeetCodeAvatar(profile.userAvatar || "")
      await setLeetCodeStats(profile.solvedStats)

      // Sync recent solved questions right away
      const syncResult = await syncUserSolvedProblems(profile.username)

      setMessage({
        text: `Connected to @${profile.username}! Synced ${syncResult.totalCount} solved problems.`,
        type: "success"
      })
      setInputUsername("")
    } catch (err: any) {
      console.error(err)
      setMessage({
        text: err?.message || "Failed to verify LeetCode account. Check username and try again.",
        type: "error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAutoDetect = async () => {
    try {
      setIsLoading(true)
      setMessage({ text: "Checking browser LeetCode session...", type: "info" })
      const session = await checkLeetCodeSession()

      if (session.isSignedIn && session.username) {
        await handleLinkUsername(session.username)
      } else {
        setMessage({
          text: "No active LeetCode browser login detected. Please enter your username manually.",
          type: "info"
        })
      }
    } catch (err: any) {
      setMessage({
        text: "Auto-detect unavailable. Please enter your username manually.",
        type: "error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncNow = async () => {
    try {
      setIsLoading(true)
      setMessage({ text: "Syncing solved problems from LeetCode...", type: "info" })
      const res = await syncUserSolvedProblems(leetcodeUsername)
      setMessage({
        text: `Sync complete! Total tracked solved problems: ${res.totalCount} (+${res.newAdded} new).`,
        type: "success"
      })
    } catch (err: any) {
      setMessage({ text: "Sync failed. Try again later.", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlink = async () => {
    await setLeetCodeUsername("")
    await setLeetCodeAvatar("")
    await setLeetCodeStats(null)
    setMessage({ text: "LeetCode account unlinked.", type: "info" })
  }

  const handleClearHistory = async () => {
    if (confirm("Reset tracked solved problems history?")) {
      await storage.clearSolvedProblemSlugs()
      setMessage({ text: "Solved history cleared.", type: "info" })
    }
  }

  return (
    <div className="lc-account-card">
      <div className="lc-card-header">
        <div className="lc-card-title-group">
          <span className="lc-icon">⚡</span>
          <div>
            <h3 className="lc-title">LeetCode Profile & Solved Sync</h3>
            <p className="lc-subtitle">
              Link your LeetCode account so already solved problems won't be assigned.
            </p>
          </div>
        </div>
      </div>

      {leetcodeUsername ? (
        <div className="lc-linked-section">
          <div className="lc-user-profile-row">
            {leetcodeAvatar ? (
              <img src={leetcodeAvatar} alt="Avatar" className="lc-avatar" />
            ) : (
              <div className="lc-avatar-fallback">👤</div>
            )}
            <div className="lc-user-meta">
              <span className="lc-username">@{leetcodeUsername}</span>
              {leetcodeStats && (
                <div className="lc-stats-breakdown">
                  <span className="stat-pill stat-easy">
                    🟢 {leetcodeStats.easy ?? 0} Easy
                  </span>
                  <span className="stat-pill stat-medium">
                    🟡 {leetcodeStats.medium ?? 0} Med
                  </span>
                  <span className="stat-pill stat-hard">
                    🔴 {leetcodeStats.hard ?? 0} Hard
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="lc-tracked-row">
            <span className="lc-tracked-label">
              📚 Tracked Solved Problems: <strong>{solvedProblemSlugs?.length || 0}</strong>
            </span>
          </div>

          <div className="lc-button-group">
            <button
              className="lc-btn lc-btn-sync"
              onClick={handleSyncNow}
              disabled={isLoading}>
              <span>🔄</span> {isLoading ? "Syncing..." : "Sync Solved"}
            </button>
            <button
              className="lc-btn lc-btn-unlink"
              onClick={handleUnlink}
              disabled={isLoading}>
              <span>✕</span> Unlink
            </button>
            <button
              className="lc-btn lc-btn-clear"
              onClick={handleClearHistory}
              title="Reset tracked solved problems list"
              disabled={isLoading}>
              <span>🗑️</span> Clear History
            </button>
          </div>
        </div>
      ) : (
        <div className="lc-unlinked-section">
          <div className="lc-input-group">
            <input
              type="text"
              className="lc-input"
              placeholder="e.g. FabioCanavarro or lee215"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLinkUsername()}
              disabled={isLoading}
            />
            <button
              className="lc-btn lc-btn-link"
              onClick={() => handleLinkUsername()}
              disabled={isLoading || !inputUsername.trim()}>
              <span>🔗</span> Link
            </button>
          </div>

          <button
            className="lc-btn lc-btn-detect"
            onClick={handleAutoDetect}
            disabled={isLoading}>
            <span>🔍</span> One-Click Auto-Detect from Browser
          </button>
        </div>
      )}

      {message && (
        <div className={`lc-status-message lc-msg-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

export default LeetCodeAccountCard
