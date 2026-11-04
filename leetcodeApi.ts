import { storage } from "storage"
import type { LeetCodeUserProfile, RecentSubmission } from "~types"

const GRAPHQL_ENDPOINT = "https://leetcode.com/graphql"

/**
 * Check if the user is currently signed in to LeetCode in the active browser session.
 */
export async function checkLeetCodeSession(): Promise<{
  isSignedIn: boolean
  username: string
}> {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: "query userStatus { userStatus { isSignedIn username } }"
      }),
      credentials: "include"
    })
    const data = await response.json()
    const status = data?.data?.userStatus
    return {
      isSignedIn: Boolean(status?.isSignedIn),
      username: status?.username || ""
    }
  } catch (err) {
    console.warn("Failed to check LeetCode session:", err)
    return { isSignedIn: false, username: "" }
  }
}

/**
 * Fetch a user's public LeetCode profile including solved question stats.
 */
export async function fetchLeetCodeProfile(
  username: string
): Promise<LeetCodeUserProfile> {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
          reputation
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      variables: { username }
    })
  })

  const json = await response.json()
  if (json.errors || !json.data?.matchedUser) {
    const errorMsg = json.errors?.[0]?.message || "LeetCode user not found"
    throw new Error(errorMsg)
  }

  const user = json.data.matchedUser
  const acNums: Array<{ difficulty: string; count: number }> =
    user.submitStatsGlobal?.acSubmissionNum || []

  const getCount = (diff: string) => {
    const item = acNums.find(
      (d) => d.difficulty.toLowerCase() === diff.toLowerCase()
    )
    return item ? item.count : 0
  }

  return {
    username: user.username,
    realName: user.profile?.realName,
    userAvatar: user.profile?.userAvatar,
    ranking: user.profile?.ranking,
    reputation: user.profile?.reputation,
    solvedStats: {
      all: getCount("all"),
      easy: getCount("easy"),
      medium: getCount("medium"),
      hard: getCount("hard")
    }
  }
}

/**
 * Fetch the user's recent accepted submissions.
 */
export async function fetchRecentAcSubmissions(
  username: string,
  limit = 50
): Promise<RecentSubmission[]> {
  const query = `
    query recentAcSubmissions($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        variables: { username, limit }
      })
    })

    const json = await response.json()
    return json.data?.recentAcSubmissionList || []
  } catch (err) {
    console.warn("Failed to fetch recent AC submissions:", err)
    return []
  }
}

/**
 * If the user is logged into LeetCode on the browser, fetch all problems they have solved.
 */
export async function fetchSessionSolvedSlugs(): Promise<string[]> {
  const query = `
    query problemsetQuestionList {
      problemsetQuestionList: questionList(
        categorySlug: ""
        limit: 2000
        skip: 0
        filters: { status: AC }
      ) {
        questions: data {
          titleSlug
        }
      }
    }
  `

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query }),
      credentials: "include"
    })

    const json = await response.json()
    const questions = json.data?.problemsetQuestionList?.questions || []
    return questions.map((q: any) => q.titleSlug.toLowerCase())
  } catch (err) {
    console.warn("Failed to fetch session solved questions:", err)
    return []
  }
}

/**
 * Sync all solved problems for the configured user into extension storage.
 */
export async function syncUserSolvedProblems(username?: string): Promise<{
  success: boolean
  totalCount: number
  newAdded: number
}> {
  try {
    const targetUsername = username || (await storage.getLeetCodeUsername())
    const initialSlugs = await storage.getSolvedProblemSlugs()
    const initialCount = initialSlugs.length
    const collectedSlugs: string[] = []

    // 1. Try to fetch solved questions via session cookies (if logged in in browser)
    try {
      const sessionSlugs = await fetchSessionSolvedSlugs()
      if (sessionSlugs.length > 0) {
        collectedSlugs.push(...sessionSlugs)
      }
    } catch (e) {
      console.warn("Session solved check skipped:", e)
    }

    // 2. If target username exists, fetch profile stats & recent AC list
    if (targetUsername) {
      try {
        const profile = await fetchLeetCodeProfile(targetUsername)
        await storage.setLeetCodeAvatar(profile.userAvatar || "")
        await storage.setLeetCodeStats(profile.solvedStats)

        const recent = await fetchRecentAcSubmissions(targetUsername, 50)
        for (const sub of recent) {
          if (sub.titleSlug) {
            collectedSlugs.push(sub.titleSlug.toLowerCase())
          }
        }
      } catch (err) {
        console.warn("Public profile sync warning:", err)
      }
    }

    // 3. Save accumulated slugs
    const totalCount = await storage.addSolvedProblemSlugs(collectedSlugs)
    const newAdded = Math.max(0, totalCount - initialCount)

    return {
      success: true,
      totalCount,
      newAdded
    }
  } catch (error) {
    console.error("Error in syncUserSolvedProblems:", error)
    return {
      success: false,
      totalCount: (await storage.getSolvedProblemSlugs()).length,
      newAdded: 0
    }
  }
}

