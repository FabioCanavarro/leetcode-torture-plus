import "styles.css"

import SettingDrawer from "components/SettingDrawer"
import React, { useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import HyperTortureMode from "~components/HyperTortureMode"
import GithubIcon from "~components/GithubIcon"
import NoPermissions from "~components/NoPermissions"
import SettingsIcon from "~components/SettingsIcon"
import { storage } from "~storage"
import { extractProblemSlug } from "~urlUtils"

import {
  generateInsanelyHardProblem,
  generateRandomLeetCodeProblem,
  handleAdditionalProblemRedirect,
  handleRedirectRule,
  updateProblemState
} from "./background"

const MAX_REROLLS = 3

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
  const [isSkipping, setIsSkipping] = useState(false)

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

  // 3-Chance Reroll & Insanely Hard state
  const [rerollsUsed, setRerollsUsed] = useStorage<number>("rerollsUsed", 0)
  const [isInsanelyHard, setIsInsanelyHard] = useStorage<boolean>("isInsanelyHard", false)

  // LeetCode account & solved tracking
  const [leetcodeUsername] = useStorage<string>("leetcodeUsername", "")
  const [solvedProblemSlugs] = useStorage<string[]>("solvedProblemSlugs", [])

  const getRandomInt = (max: number) => Math.floor(Math.random() * max)

  const chancesRemaining = Math.max(0, MAX_REROLLS - (rerollsUsed ?? 0))

  const rerollProblem = async () => {
    if (chancesRemaining <= 0 || isRerolling) return

    try {
      setIsRerolling(true)
      const nextUsed = (rerollsUsed ?? 0) + 1
      await setRerollsUsed(nextUsed)

      // On the 3rd reroll (when nextUsed reaches 3), unleash the insanely hard problem!
      const isThirdChance = nextUsed >= MAX_REROLLS
      const problem = isThirdChance
        ? await generateInsanelyHardProblem()
        : await generateRandomLeetCodeProblem()

      if (problem) {
        if (isThirdChance) {
          setIsInsanelyHard(true)
        }
        await updateProblemState(problem)
        await handleAdditionalProblemRedirect(problem.url)
      }
    } finally {
      setTimeout(() => setIsRerolling(false), 350)
    }
  }

  // Quick skip for already solved problems
  const markCurrentAsAlreadySolvedAndSkip = async () => {
    if (!problemURL || isSkipping) return
    try {
      setIsSkipping(true)
      const slug = extractProblemSlug(problemURL)
      if (slug) {
        await storage.addSolvedProblemSlug(slug)
      }
      const problem = await generateRandomLeetCodeProblem()
      if (problem) {
        await updateProblemState(problem)
        await handleAdditionalProblemRedirect(problem.url)
      }
    } finally {
      setTimeout(() => setIsSkipping(false), 300)
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

  const diffClass = isInsanelyHard
    ? "diff-hard diff-insane"
    : problemDifficulty?.toLowerCase() === "easy"
    ? "diff-easy"
    : problemDifficulty?.toLowerCase() === "hard"
    ? "diff-hard"
    : "diff-medium"

  // Status pill logic
  let statusText = "ACTIVE TORTURE"
  let statusClass = "status-active"
  if (disabled) {
    statusText = "TORTURE PAUSED"
    statusClass = "status-paused"
  } else if (hyperTortureMode) {
    statusText = "HYPER TORTURE"
    statusClass = "status-hyper"
  } else if (leetcodeProblemSolved) {
    statusText = "CONQUERED"
    statusClass = "status-solved"
  }

  return (
    <div className="popup">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="brand-group">
          <div className="brand-logo">LT+</div>
          <div className="brand-titles">
            <h1 className="brand-name">LeetCode Torture</h1>
            <span className="brand-tag">v1.0.1</span>
          </div>
        </div>

        <div className="nav-actions">
          {leetcodeUsername && (
            <div
              className="user-nav-chip"
              title={`Linked to LeetCode @${leetcodeUsername}. Tracked solved: ${solvedProblemSlugs?.length || 0}`}
              onClick={() => setDrawerClosed(false)}>
              <span className="user-name">@{leetcodeUsername}</span>
            </div>
          )}
          <button
            className="icon-button github-btn"
            title="GitHub Repository"
            onClick={() => chrome.tabs.create({ url: "https://github.com/FabioCanavarro/leetcode-torture-plus" })}>
            <GithubIcon size={16} />
          </button>
          <button
            className={`icon-button pause-toggle-btn ${disabled ? "is-paused" : ""}`}
            title={disabled ? "Resume Torture Redirects" : "Emergency Pause"}
            onClick={toggleEmergencyPause}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700 }}>
              {disabled ? "RES" : "PAU"}
            </span>
          </button>
          <button
            className="icon-button settings-btn"
            title="Settings, LeetCode Sync & Problem Sets"
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
              <span className="streak-tag">STREAK</span>
              <span className="streak-num">
                {hyperTortureMode ? HT_currentStreak ?? 0 : currentStreak ?? 0}
              </span>
            </div>
            <div className="streak-badge best-streak-pill" title="Best Solving Streak">
              <span className="streak-tag">BEST</span>
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

            {/* Insanely Hard Penalty Banner */}
            {isInsanelyHard && (
              <div className="insanely-hard-banner">
                <div className="insanely-hard-text">
                  <strong>INSANELY HARD QUESTION SUMMONED</strong>
                  <p>3 rerolls exhausted. No more escape routes - defeat this problem.</p>
                </div>
              </div>
            )}

            {/* 2nd reroll warning (1 chance remaining before penalty) */}
            {!isInsanelyHard && chancesRemaining === 1 && (
              <div className="reroll-warning-banner">
                <span>
                  <strong>Warning:</strong> Next reroll is your 3rd chance. It will summon an <em>insanely hard question</em>.
                </span>
              </div>
            )}

            <div className={`spotlight-box ${isInsanelyHard ? "insanely-hard-box" : ""}`}>
              <div className="problem-meta-row">
                <span className={`diff-pill ${diffClass}`}>
                  {isInsanelyHard ? "NIGHTMARE HARD" : problemDifficulty}
                </span>
                <span className="category-pill">{problemCategory}</span>
                {chancesRemaining > 0 && !isInsanelyHard && (
                  <span className="chances-pill">
                    {chancesRemaining}/3 rerolls
                  </span>
                )}
              </div>

              <h2 className="problem-headline">{problemName}</h2>

              <div className="action-buttons-row">
                <button
                  className="primary-action-btn"
                  onClick={() => {
                    if (problemURL) chrome.tabs.create({ url: problemURL })
                  }}>
                  Solve Trial
                </button>

                {chancesRemaining > 0 ? (
                  <button
                    className={`secondary-action-btn ${
                      chancesRemaining === 1 ? "danger-reroll-btn" : ""
                    } ${isRerolling ? "spinning" : ""}`}
                    title={
                      chancesRemaining === 1
                        ? "DANGER: 3rd and final reroll will trigger an insanely hard question!"
                        : `Reroll problem (${chancesRemaining} chances left)`
                    }
                    onClick={rerollProblem}>
                    <span>
                      {chancesRemaining === 1
                        ? "Reroll (1/3 left)"
                        : `Reroll (${chancesRemaining}/3)`}
                    </span>
                  </button>
                ) : (
                  <button
                    className="secondary-action-btn locked-reroll-btn"
                    disabled={true}
                    title="No rerolls left. 3 rerolls have been used. Solve this problem to unlock freedom.">
                    0 Rerolls Left
                  </button>
                )}
              </div>

              {/* Already Solved Quick-Skip */}
              <div className="quick-actions-row">
                <button
                  className="quick-skip-btn"
                  title="Already solved this question before? Mark it solved so it won't appear again, and get a fresh problem."
                  onClick={markCurrentAsAlreadySolvedAndSkip}
                  disabled={isSkipping}>
                  Already solved? Mark and skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Solved View */}
        {problemName && leetcodeProblemSolved && !hyperTortureMode && (
          <div className="solved-card">
            <div className="solved-badge">SOLVED</div>
            <h2 className="solved-heading">Freedom Earned!</h2>
            <p className="solved-msg">{solvedMessage}</p>

            <div className="solved-actions">
              <button
                className="primary-action-btn"
                onClick={rerollProblem}>
                Solve Another Problem
              </button>

              {originalDestinationUrl && (
                <button
                  className="secondary-action-btn return-orig-btn"
                  onClick={() => {
                    chrome.tabs.create({ url: originalDestinationUrl })
                  }}>
                  Jump to Original Page
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
            {disabled ? "Resume Torture (Enforce Redirects)" : "Quick Emergency Pause"}
          </button>
        </div>
      </div>

      {/* Settings Drawer */}
      <SettingDrawer close={drawerClosed} setClose={setDrawerClosed} />
    </div>
  )
}

export default IndexPopup
