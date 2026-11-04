import { getHyperTortureMode, resetHyperTortureStreak, storage } from "storage"

import {
  getAllLeetCodeProblems,
  getInsanelyHardLeetCodeProblem,
  getLeetCodeProblemFromProblemSet
} from "~leetcodeProblems"
import type { APILeetCodeProblem, ProblemInfo, UserState } from "~types"
import { extractProblemSlug, isSameLeetCodeProblem } from "~urlUtils"

const LEETCODE_URL = "https://leetcode.com"
const RULE_ID = 1
const isLeetCodeUrl = (url: string) => url ? url.includes(LEETCODE_URL) || url.includes("leetcode.cn") : false

const isSubmissionSuccessURL = (url: string) =>
  url.includes("/submissions/detail/") && url.includes("/check/")

const sendUserSolvedMessage = (
  tabId: number,
  languageUsed: string,
  originalUrl?: string
) => {
  const payload = {
    action: "userSolvedProblem",
    language: languageUsed,
    originalUrl
  }

  if (tabId && tabId > 0) {
    chrome.tabs.sendMessage(tabId, payload).catch(() => {})
  }
  // Also send to current active tab as fallback
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id && tabs[0].id !== tabId) {
      chrome.tabs.sendMessage(tabs[0].id, payload).catch(() => {})
    }
  })
}

const sendUserFailedMessage = (tabId: number) => {
  const payload = { action: "userFailedProblem" }
  if (tabId && tabId > 0) {
    chrome.tabs.sendMessage(tabId, payload).catch(() => {})
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id && tabs[0].id !== tabId) {
      chrome.tabs.sendMessage(tabs[0].id, payload).catch(() => {})
    }
  })
}

const state: UserState = {
  leetcodeProblemSolved: false,
  leetCodeProblem: {
    url: "",
    name: "",
    difficulty: "Medium",
    category: "General"
  },
  lastSubmissionDate: new Date(0),
  solvedListenerActive: true,
  lastAttemptedUrl: "",
  urlListener: null,
  includePremium: false,
  hyperTortureMode: false,
  HTcurrentStreak: 0
}

export async function getProblemListFromLeetCodeAPI(
  difficulty: string,
  problemSet: string
): Promise<APILeetCodeProblem[]> {
  try {
    const query = `
      query problemsetQuestionList {
        problemsetQuestionList: questionList(
          categorySlug: ""
          limit: -1
          skip: 0
          filters: {
            ${
              difficulty && difficulty !== "all"
                ? "difficulty: " + difficulty
                : ""
            }
            ${problemSet?.length ? "listId: " + '"' + problemSet + '"' : ""}
          }
        ) {
          questions: data {
            acRate
            difficulty
            freqBar
            frontendQuestionId: questionFrontendId
            isFavor
            paidOnly: isPaidOnly
            status
            title
            titleSlug
            topicTags {
              name
              id
              slug
            }
            hasSolution
            hasVideoSolution
          }
        }
      }
    `

    const body = { query }

    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json"
      }
    })

    const responseData = await response.json()
    await storage.updatePermissions(true)

    return responseData?.data?.problemsetQuestionList?.questions || []
  } catch (error: any) {
    console.warn("LeetCode GraphQL error:", error?.toString())
    if (
      error?.message?.includes("NetworkError") ||
      error?.message?.includes("CORS") ||
      error?.message === "Network response was not ok"
    ) {
      console.log("CORS error detected.")
      await storage.updatePermissions(false)
    }
    return []
  }
}

export const handleAdditionalProblemRedirect = async (problemUrl: string) => {
  if (await storage.getEnableRedirectOnEveryProblem()) {
    await setRedirectRule(problemUrl)
  }
}

export async function generateInsanelyHardProblem(): Promise<ProblemInfo> {
  try {
    await storage.initiateLoading()
    return await getInsanelyHardLeetCodeProblem()
  } catch (error) {
    console.error("Error generating insanely hard problem", error)
    return {
      url: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
      name: "Median of Two Sorted Arrays",
      difficulty: "Hard",
      category: "Binary Search",
      isInsanelyHard: true
    }
  } finally {
    await storage.stopLoading()
  }
}

export async function generateRandomLeetCodeProblem(): Promise<ProblemInfo> {
  try {
    const problemSet = await storage.getProblemSet()
    const difficulty = await storage.getDifficulty()
    if (problemSet === "all" || problemSet.startsWith("lg")) {
      await storage.initiateLoading()
      return await getAllLeetCodeProblems(difficulty, problemSet)
    } else {
      return await getLeetCodeProblemFromProblemSet(difficulty, problemSet)
    }
  } catch (error) {
    console.error("Error generating random problem", error)
    return {
      url: "https://leetcode.com/problems/two-sum/",
      name: "Two Sum",
      difficulty: "Easy",
      category: "Arrays & Hashing"
    }
  } finally {
    await storage.stopLoading()
  }
}

function onMessageReceived(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean | void {
  switch (message?.action) {
    case "fetchingProblem":
      console.log("Fetching problem started.")
      break
    case "problemFetched":
      console.log("Fetching problem completed.")
      break
    case "getProblemStatus":
      Promise.all([
        storage.getProblemSolved(),
        storage.getProblemUrl(),
        storage.getProblemName(),
        storage.getProblemDifficulty(),
        storage.getProblemCategory(),
        storage.getOriginalDestinationUrl()
      ]).then(([solved, url, name, diff, cat, orig]) => {
        sendResponse({
          problemSolved: solved,
          problem: { url, name, difficulty: diff, category: cat },
          originalUrl: orig
        })
      })
      return true // async response
    case "userClickedSubmit":
      state.lastSubmissionDate = new Date()
      console.log("User submitted problem at", state.lastSubmissionDate)
      break
    case "userSolvedProblemDetected":
      handleSuccessfulSubmission(
        sender?.tab?.id ?? 0,
        message?.language || "unknown"
      )
      break
    case "markCurrentProblemSolved":
      Promise.all([
        storage.getProblemUrl(),
        storage.getOriginalDestinationUrl()
      ]).then(async ([url, orig]) => {
        const slug = extractProblemSlug(url)
        if (slug) await storage.addSolvedProblemSlug(slug)
        await handleSuccessfulSubmission(sender?.tab?.id ?? 0, "Manual")
        sendResponse({ success: true })
      })
      return true
    default:
      break
  }
}

async function setRedirectRule(redirectUrl: string) {
  if (!redirectUrl) return

  const redirectRule = {
    id: RULE_ID,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { url: redirectUrl }
    },
    condition: {
      urlFilter: "*://*/*",
      excludedInitiatorDomains: [
        "leetcode.com",
        "www.leetcode.com",
        "leetcode.cn",
        "developer.chrome.com",
        "chrome.google.com"
      ],
      resourceTypes: ["main_frame"]
    }
  }

  try {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE_ID],
      addRules: [redirectRule as chrome.declarativeNetRequest.Rule]
    })
    console.log("Redirect rule set to:", redirectUrl)
  } catch (error) {
    console.error("Error updating redirect rule:", error)
  }
}

export const updateProblemState = async (problem: ProblemInfo) => {
  await storage.updateProblem(problem, false)
}

export const updateStorage = async () => {
  try {
    const isRedirectEnabled = await storage.getEnableRedirectOnEveryProblem()
    const problem = await generateRandomLeetCodeProblem()
    state.leetcodeProblemSolved = false
    await storage.resetRerolls()
    await storage.setIsInsanelyHard(false)
    await updateProblemState(problem)
    if (isRedirectEnabled && problem?.url) {
      await setRedirectRule(problem.url)
    }
  } catch (error) {
    console.error("Error in updateStorage:", error)
  }
}

async function handleSuccessfulSubmission(tabId: number, lang: string) {
  const isSolved = await storage.getProblemSolved()
  const hyperTortureMode = await getHyperTortureMode()

  if (isSolved && !hyperTortureMode) return

  const problemUrl = await storage.getProblemUrl()
  const slug = extractProblemSlug(problemUrl)
  if (slug) {
    await storage.addSolvedProblemSlug(slug)
  }

  await storage.resetRerolls()
  await storage.setIsInsanelyHard(false)
  await storage.updateStreak()
  state.leetcodeProblemSolved = true
  await storage.updateProblemSolvedState(true)

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID]
  })

  const originalUrl = await storage.getOriginalDestinationUrl()

  if (hyperTortureMode) {
    console.log("Hyper torture mode problem completed, generating next problem...")
    if (originalUrl && tabId > 0) {
      chrome.tabs.update(tabId, { url: originalUrl }).catch(() => {})
    }
    // In Hyper Torture mode, advance to next problem for the subsequent tab
    await updateStorage()
  } else {
    sendUserSolvedMessage(tabId, lang, originalUrl)
  }
}

const checkIfUserSolvedProblem = async (
  details: chrome.webRequest.WebResponseCacheDetails
) => {
  const isSolved = await storage.getProblemSolved()
  const hyperTortureMode = await getHyperTortureMode()
  if (isSolved && !hyperTortureMode) return

  let currentURL = ""
  try {
    if (details.tabId && details.tabId > 0) {
      const tab = await chrome.tabs.get(details.tabId)
      currentURL = tab.url ?? ""
    } else {
      const [activeTab] = await new Promise<chrome.tabs.Tab[]>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve)
      })
      currentURL = activeTab?.url ?? ""
    }
  } catch (error) {
    console.error("Error getting tab for submission check:", error)
    return
  }

  const problemUrl = await storage.getProblemUrl()

  if (!isSameLeetCodeProblem(problemUrl, currentURL)) {
    return
  }

  if (isSubmissionSuccessURL(details.url)) {
    try {
      const response = await fetch(details.url)
      const data = await response.json()

      if (data.state === "STARTED" || data.state === "PENDING") {
        return
      }

      if (data.status_msg !== "Accepted") {
        if (hyperTortureMode) {
          await resetHyperTortureStreak()
          sendUserFailedMessage(details.tabId)
        }
        return
      }

      if (
        data.status_msg === "Accepted" &&
        data.state === "SUCCESS" &&
        !data.code_answer
      ) {
        await handleSuccessfulSubmission(details.tabId, data?.lang || "unknown")
      }
    } catch (error) {
      console.error("Error parsing submission check response:", error)
    }
  }
}

async function tryResetStreak() {
  const lastCompletion = await storage.getLastCompletion()
  const yesterday = new Date().getDate() - 1
  if (lastCompletion.getDate() < yesterday) {
    await storage.resetStreak()
    await storage.resetRerolls()
    await storage.setIsInsanelyHard(false)
    return true
  }
  return false
}

export async function toggleUrlListener(toggle: boolean): Promise<void> {
  if (toggle) {
    state.urlListener = (details: chrome.webRequest.WebRequestBodyDetails) => {
      if (
        !isLeetCodeUrl(details.url) &&
        details.type === "main_frame" &&
        !details.url.includes("chrome-extension:")
      ) {
        state.lastAttemptedUrl = details.url
        storage.setOriginalDestinationUrl(details.url)
      }
      return null
    }

    if (!chrome.webRequest.onBeforeRequest.hasListener(state.urlListener)) {
      chrome.webRequest.onBeforeRequest.addListener(state.urlListener, {
        urls: ["<all_urls>"]
      })
    }
  } else if (state.urlListener) {
    if (chrome.webRequest.onBeforeRequest.hasListener(state.urlListener)) {
      chrome.webRequest.onBeforeRequest.removeListener(state.urlListener)
    }
  }
}

export async function handleRedirectRule() {
  const isRedirectEnabled = await storage.getEnableRedirectOnEveryProblem()
  const isSolved = await storage.getProblemSolved()

  if (isRedirectEnabled && !isSolved) {
    const problemUrl = await storage.getProblemUrl()
    await setRedirectRule(problemUrl)
  } else {
    try {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE_ID]
      })
      console.log("Redirect rule removed")
    } catch (error) {
      console.error("Error removing redirect rule:", error)
    }
  }
}

const getMsUntilMidnight = () => {
  const currentTime = Date.now()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - currentTime
}

chrome.runtime.onInstalled.addListener(async () => {
  const [problemUrl, problemDate] = await Promise.all([
    storage.getProblemUrl(),
    storage.getProblemDate()
  ])
  const hasTodaysProblem =
    Boolean(problemUrl) && problemDate === new Date().toDateString()

  if (hasTodaysProblem) {
    const isSolved = await storage.getProblemSolved()
    if (!isSolved && (await storage.getEnableRedirectOnEveryProblem())) {
      await setRedirectRule(problemUrl)
    }
  } else {
    await updateStorage()
  }

  await tryResetStreak()
  await toggleUrlListener(true)
})

chrome.alarms.get("midnightAlarm", (alarm) => {
  if (alarm) return
  const msUntilMidnight = getMsUntilMidnight()
  const oneDayInMinutes = 60 * 24
  chrome.alarms.create("midnightAlarm", {
    when: Date.now() + msUntilMidnight,
    periodInMinutes: oneDayInMinutes
  })
})

chrome.alarms.onAlarm.addListener(async () => {
  await updateStorage()
  await tryResetStreak()
})

// Always-on submission listener: catches all LeetCode submissions globally
if (!chrome.webRequest.onCompleted.hasListener(checkIfUserSolvedProblem)) {
  chrome.webRequest.onCompleted.addListener(checkIfUserSolvedProblem, {
    urls: [
      "*://leetcode.com/submissions/detail/*/check/",
      "*://leetcode.com/submissions/detail/*/check/*",
      "*://leetcode.cn/submissions/detail/*/check/",
      "*://leetcode.cn/submissions/detail/*/check/*"
    ]
  })
}

// Track navigations to capture destination URL
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (
      details.type === "main_frame" &&
      !isLeetCodeUrl(details.url) &&
      !details.url.startsWith("chrome-extension://") &&
      !details.url.startsWith("edge://") &&
      !details.url.startsWith("about:")
    ) {
      state.lastAttemptedUrl = details.url
      storage.setOriginalDestinationUrl(details.url)
    }
    return null
  },
  { urls: ["<all_urls>"] }
)

chrome.runtime.onMessage.addListener(onMessageReceived)
