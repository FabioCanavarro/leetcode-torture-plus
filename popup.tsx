import "styles.css"

import SettingDrawer from "components/SettingDrawer"
import React, { useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import HyperTortureMode from "~components/HyperTortureMode"
import NoPermissions from "~components/NoPermissions"
import SettingsIcon from "~components/SettingsIcon"

import {
  generateRandomLeetCodeProblem,
  handleAdditionalProblemRedirect,
  handleRedirectRule,
  updateProblemState
} from "./background"

const IndexPopup = () => {
  const unSolvedMessages = [
    "One LeetCode problem a day keeps unemployment away.",
    "Your future tech lead is watching. Prove your algorithmic worth.",
    "Another day, another trial. Put your recursion to work.",
    "Brute force won't save you today. Optimize or perish.",
    "Your keyboard is waiting. Time to conquer the daily trial.",
    "Never back down, never what? Never stop solving."
  ]

  const solvedMessages = [
    "The LeetCode Torture gods are pleased. Freedom is granted.",
    "One problem down! You've cheated unemployment for another 24 hours.",
    "Accepted on the first try? We'll pretend you didn't check solutions.",
    "Today's trial is conquered. Rest now, tomorrow brings another beast.",
    "Clean code, optimal complexity. You survived another day."
  ]

  const hyperTortureMessages = [
    "Infinite recursion into misery. Keep those functions running.",
    "Tab closed? Another problem spawned. Resistance is futile.",
    "Error 404: Social life deleted. Compiling eternal algorithms.",
    "Commit to the grind, your compiler is your only confidant."
  ]

  const [unsolvedMessage, setUnsolvedMessage] = useState("")
  const [solvedMessage, setSolvedMessage] = useState("")
  const [hyperTortureMessage, setHyperTortureMessage] = useState("")
  const [isRerolling, setIsRerolling] = useState(false)

  const [problemName] = useStorage<string>("problemName")
  const [problemURL] = useStorage<string>("problemURL")
  const [problemDifficulty] = useStorage<string>("problemDifficulty", "Medium")
  const [problemCategory] = useStorage<string>("problemCategory", "General")
  const [originalDestinationUrl] = useStorage<string>("originalDestinationUrl")
  const [leetcodeProblemSolved] = useStorage<boolean>("leetCodeProblemSolved", false)
  const [hyperTortureMode] = useStorage<boolean>("hyperTortureMode", false)
  const [disabled, setDisabled] = useStorage<boolean>("disabled", false)
  const [currentStreak] = useStorage<number>("currentStreak", 0)
  const [bestStreak] = useStorage<number>("bestStreak", 0)
  const [HT_currentStreak] = useStorage<number>("HT_currentStreak", 0)
  const [HT_bestStreak] = useStorage<number>("HT_bestStreak", 0)
  const [permissionsEnabled] = useStorage<boolean>("permissionsEnabled", true)
  const [drawerClosed, setDrawerClosed] = useState(true)

  const getRandomInt = (max: number) => Math.floor(Math.random() * max)

  const rerollProblem = async () => {
    try {
      setIsRerolling(true)
      const problem = await generateRandomLeetCodeProblem()
      if (problem) {
        await updateProblemState(problem)
        await handleAdditionalProblemRedirect(problem.url)
      }
    } finally {
      setTimeout(() => setIsRerolling(false), 300)
    }
  }

  const toggleEmergencyPause = async () => {
    const nextState = !disabled
    setDisabled(nextState)
    setTimeout(() => handleRedirectRule(), 50)
  }

  useEffect(() => {
    setSolvedMessage(solvedMessages[getRandomInt(solvedMessages.length)])
    setHyperTortureMessage(hyperTortureMessages[getRandomInt(hyperTortureMessages.length)])
    setUnsolvedMessage(unSolvedMessages[getRandomInt(unSolvedMessages.length)])
  }, [])

  if (!permissionsEnabled) {
    return <NoPermissions permissionsEnabled={permissionsEnabled} />
  }

  const diffClass =
    problemDifficulty?.toLowerCase() === "easy"
      ? "diff-easy"
      : problemDifficulty?.toLowerCase() === "hard"
      ? "diff-hard"
      : "diff-medium"

  // Status pill logic
  let statusText = "ACTIVE TORTURE 🔒"
  let statusClass = "status-active"
  if (disabled) {
    statusText = "TORTURE PAUSED ⏸️"
    statusClass = "status-paused"
  } else if (hyperTortureMode) {
    statusText = "HYPER TORTURE ⚡"
    statusClass = "status-hyper"
  } else if (leetcodeProblemSolved) {
    statusText = "CONQUERED 🎉"
    statusClass = "status-solved"
  }

  return (
    <div className="popup">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="brand-group">
          <div className="brand-logo">⚔️</div>
          <div className="brand-titles">
            <h1 className="brand-name">LeetCode Torture</h1>
            <span className="brand-tag">ENCHANTED</span>
          </div>
        </div>

        <div className="nav-actions">
          <button
            className={`icon-button pause-toggle-btn ${disabled ? "is-paused" : ""}`}
            title={disabled ? "Resume Torture Redirects" : "Emergency Pause"}
            onClick={toggleEmergencyPause}>
            {disabled ? "▶️" : "⏸️"}
          </button>
          <button
            className="icon-button settings-btn"
            title="Settings & Problem Sets"
            onClick={() => setDrawerClosed(false)}>
            <SettingsIcon />
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="popup-body">
        {/* Status & Streak Row */}
        <div className="status-row">
          <div className={`status-pill ${statusClass}`}>{statusText}</div>

          <div className="streaks-group">
            <div className="streak-badge current-streak-pill" title="Current Solving Streak">
              <span className="flame-icon">🔥</span>
              <span className="streak-num">
                {hyperTortureMode ? HT_currentStreak ?? 0 : currentStreak ?? 0}
              </span>
            </div>
            <div className="streak-badge best-streak-pill" title="Best Solving Streak">
              <span className="trophy-icon">🏆</span>
              <span className="streak-num">
                {hyperTortureMode ? HT_bestStreak ?? 0 : bestStreak ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {!problemName && (
          <div className="loading-card">
            <span className="spinner"></span>
            <p>Summoning your algorithmic trial...</p>
          </div>
        )}

        {/* Hyper Torture Mode View */}
        {problemName && hyperTortureMode && (
          <HyperTortureMode
            message={hyperTortureMessage}
            problemName={problemName}
            problemURL={problemURL}
            problemDifficulty={problemDifficulty}
            problemCategory={problemCategory}
          />
        )}

        {/* Standard Unsolved View */}
        {problemName && !leetcodeProblemSolved && !hyperTortureMode && (
          <div className="problem-card">
            <p className="roast-subtitle">{unsolvedMessage}</p>

            <div className="spotlight-box">
              <div className="problem-meta-row">
                <span className={`diff-pill ${diffClass}`}>{problemDifficulty}</span>
                <span className="category-pill">{problemCategory}</span>
              </div>

              <h2 className="problem-headline">{problemName}</h2>

              <div className="action-buttons-row">
                <button
                  className="primary-action-btn"
                  onClick={() => {
                    if (problemURL) chrome.tabs.create({ url: problemURL })
                  }}>
                  <span>⚔️</span> Solve Trial
                </button>
                <button
                  className={`secondary-action-btn ${isRerolling ? "spinning" : ""}`}
                  title="Roll a different problem from your set"
                  onClick={rerollProblem}>
                  <span>🎲</span> Reroll
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Solved View */}
        {problemName && leetcodeProblemSolved && !hyperTortureMode && (
          <div className="solved-card">
            <div className="solved-badge">✨</div>
            <h2 className="solved-heading">Freedom Earned!</h2>
            <p className="solved-msg">{solvedMessage}</p>

            <div className="solved-actions">
              <button
                className="primary-action-btn"
                onClick={rerollProblem}>
                <span>🚀</span> Solve Another Problem
              </button>

              {originalDestinationUrl && (
                <button
                  className="secondary-action-btn return-orig-btn"
                  onClick={() => {
                    chrome.tabs.create({ url: originalDestinationUrl })
                  }}>
                  <span>🔗</span> Jump to Original Page
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Emergency Control Footer */}
        <div className="footer-bar">
          <button
            className={`footer-pause-btn ${disabled ? "resume-mode" : ""}`}
            onClick={toggleEmergencyPause}>
            {disabled ? "▶️ Resume Torture (Enforce Redirects)" : "⏸️ Quick Emergency Pause"}
          </button>
        </div>
      </div>

      {/* Settings Drawer */}
      <SettingDrawer close={drawerClosed} setClose={setDrawerClosed} />
    </div>
  )
}

export default IndexPopup
