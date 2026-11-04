import { useStorage } from "@plasmohq/storage/hook"
import React from "react"

import {
  handleRedirectRule,
  toggleUrlListener,
  updateStorage
} from "~background"
import { storage } from "~storage"

import BackIcon from "./BackIcon"
import LeetCodeAccountCard from "./LeetCodeAccountCard"
import SettingLabel from "./SettingLabel"

interface SettingDrawerProps {
  close: boolean
  setClose: (close: boolean) => void
}

const SettingDrawer: React.FC<SettingDrawerProps> = ({ close, setClose }) => {
  const [problemSets, setProblemSets] = useStorage<string>("problemSets", "all")
  const [difficulty, setDifficulty] = useStorage<string>("difficulty", "all")
  const [category, setCategory] = useStorage<string>("category", "all")
  const [leetcodeProblemSolved] = useStorage<boolean>("leetCodeProblemSolved", false)
  const [includePremium, setIncludePremium] = useStorage<boolean>("includePremium", false)
  const [disabled, setDisabled] = useStorage<boolean>("disabled", false)
  const [hyperTortureMode, setHyperTortureMode] = useStorage<boolean>("hyperTortureMode", false)
  const [_, setHTcurrentStreak] = useStorage<number>("HT_currentStreak", 0)

  // Exclude solved problems setting
  const [excludeSolvedProblems, setExcludeSolvedProblems] = useStorage<boolean>(
    "excludeSolvedProblems",
    true
  )

  // Reroll tracker in drawer
  const [rerollsUsed, setRerollsUsed] = useStorage<number>("rerollsUsed", 0)

  const handleResetRerolls = async () => {
    await setRerollsUsed(0)
    await storage.setIsInsanelyHard(false)
  }

  const settingList = [
    {
      name: "Exclude Solved Problems 🚫",
      description: "Never assign problems you've already completed on LeetCode",
      checkboxProps: {
        checked: excludeSolvedProblems ?? true,
        handleChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
          setExcludeSolvedProblems(e.target.checked)
          if (!leetcodeProblemSolved) {
            await updateStorage()
          }
        }
      }
    },
    {
      name: "Emergency Pause ⏸️",
      description: "Temporarily pause redirect rules without losing streaks",
      checkboxProps: {
        checked: disabled ?? false,
        handleChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
          setDisabled(e.target.checked)
          setTimeout(() => handleRedirectRule(), 50)
        }
      }
    },
    {
      name: "Problem Set 📚",
      description: "Choose your practice curriculum",
      dropdownProps: {
        options: {
          all: "All LeetCode Problems",
          algomapRoadmap: "AlgoMap Roadmap (100 Free)",
          NeetCode150: "NeetCode 150",
          Blind75: "Blind 75",
          metaTop100: "Meta Top 100",
          allNeetcode: "All NeetCode Problems",
          "lg-5htp6xyg": "LeetCode Curated SQL 70",
          "lg-79h8rn6": "Top 100 Liked Questions",
          "lg-wpwgkgt": "Top Interview Questions",
          "lg-o9exaktc": "Tayomide's Questions"
        },
        defaultValue: problemSets,
        handleChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
          setProblemSets(e.target.value)
          if (!leetcodeProblemSolved) {
            await updateStorage()
          }
        }
      }
    },
    {
      name: "Problem Difficulty 🎯",
      description: "Target your challenge level",
      dropdownProps: {
        options: {
          all: "All Difficulties",
          EASY: "Easy (Warmup)",
          MEDIUM: "Medium (Standard)",
          HARD: "Hard (Nightmare)"
        },
        defaultValue: difficulty,
        handleChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
          setDifficulty(e.target.value)
          if (!leetcodeProblemSolved) {
            await updateStorage()
          }
        }
      }
    },
    {
      name: "Problem Category 🏷️",
      description: "Focus on a specific DSA topic",
      dropdownProps: {
        options: {
          all: "All Topics & Categories",
          "Arrays & Hashing": "Arrays & Hashing / Strings",
          "Two Pointers": "Two Pointers",
          "Sliding Window": "Sliding Window",
          Stack: "Stack",
          "Binary Search": "Binary Search",
          "Linked List": "Linked List",
          Trees: "Trees & BST",
          Heap: "Heap / Priority Queue",
          Backtracking: "Backtracking",
          Graphs: "Graphs & BFS/DFS",
          "Dynamic Programming": "Dynamic Programming",
          Greedy: "Greedy",
          Intervals: "Intervals",
          "Math & Geometry": "Math & Geometry",
          "Bit Manipulation": "Bit Manipulation"
        },
        defaultValue: category,
        handleChange: async (e: React.ChangeEvent<HTMLSelectElement>) => {
          setCategory(e.target.value)
          if (!leetcodeProblemSolved) {
            await updateStorage()
          }
        }
      }
    },
    {
      name: "Include Premium Problems 💎",
      description: "Allow LeetCode subscription-only problems",
      checkboxProps: {
        checked: includePremium ?? false,
        handleChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
          setIncludePremium(e.target.checked)
          if (!leetcodeProblemSolved) {
            await updateStorage()
          }
        }
      }
    },
    {
      name: "Hyper Torture Mode ⚡",
      description: "Forces a fresh problem on every new tab opened",
      checkboxProps: {
        checked: hyperTortureMode ?? false,
        handleChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
          setHTcurrentStreak(0)
          setHyperTortureMode(e.target.checked)
          await updateStorage()
          await toggleUrlListener(e.target.checked)
        }
      }
    }
  ]

  return (
    <div className={["drawer", close ? "" : "opened"].join(" ")}>
      <nav className="drawer-nav">
        <button
          className="back-btn"
          aria-label="Back to dashboard"
          onClick={() => setClose(true)}>
          <BackIcon />
        </button>
        <h2>Preferences & Torture Settings</h2>
      </nav>

      <div className="drawer-content">
        {/* LeetCode Profile Linking & Sync */}
        <LeetCodeAccountCard />

        {/* Reroll Status Card */}
        <div className="reroll-status-box">
          <div className="reroll-status-info">
            <span className="reroll-icon">🎲</span>
            <div>
              <p className="reroll-label">Daily Reroll Chances</p>
              <p className="reroll-desc">
                {rerollsUsed ?? 0}/3 used ({Math.max(0, 3 - (rerollsUsed ?? 0))} left) • 3rd reroll penalty forces an insanely hard problem!
              </p>
            </div>
          </div>
          {(rerollsUsed ?? 0) > 0 && (
            <button className="reset-reroll-btn" onClick={handleResetRerolls}>
              Reset Chances
            </button>
          )}
        </div>

        {leetcodeProblemSolved && !hyperTortureMode && (
          <div className="settings-notice">
            <span>✨</span>
            <p>
              Problem solved for today! New settings will apply to tomorrow's trial.
            </p>
          </div>
        )}

        <ul className="setting-labels">
          {settingList.map((settingProps, key) => (
            <li key={key} className="setting-card">
              <SettingLabel {...settingProps} />
            </li>
          ))}
        </ul>

        <div className="drawer-footer">
          <p className="version-tag">LeetCode Torture v1.0.0 • Enhanced Edition</p>
        </div>
      </div>
    </div>
  )
}

export default SettingDrawer
