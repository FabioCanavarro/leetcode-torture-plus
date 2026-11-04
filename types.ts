type TopicTag = {
  name: string
  id: string
  slug: string
}

export type ProblemInfo = {
  name: string
  url: string
  difficulty?: "Easy" | "Medium" | "Hard" | string
  category?: string
  isInsanelyHard?: boolean
}

export type UserState = {
  leetcodeProblemSolved: boolean
  leetCodeProblem: ProblemInfo
  lastSubmissionDate: Date
  solvedListenerActive: boolean
  lastAttemptedUrl: string
  urlListener: (
    details: chrome.webRequest.WebRequestBodyDetails
  ) => void | chrome.webRequest.BlockingResponse
  includePremium: boolean
  hyperTortureMode: boolean
  HTcurrentStreak: number
}

export type APILeetCodeProblem = {
  acRate: number
  difficulty: "Easy" | "Medium" | "Hard"
  freqBar: number
  frontendQuestionId: string
  hasSolution: boolean
  hasVideoSolution: boolean
  isFavor: boolean
  paidOnly: boolean
  status: string
  title: string
  titleSlug: string
  topicTags: TopicTag[]
}

export type JSONLeetCodeProblem = {
  category: string
  href: string
  text: string
  difficulty: "Easy" | "Medium" | "Hard"
  isPremium: boolean
}

export type LeetCodeStats = {
  all: number
  easy: number
  medium: number
  hard: number
}

export type LeetCodeUserProfile = {
  username: string
  realName?: string
  userAvatar?: string
  ranking?: number
  reputation?: number
  solvedStats: LeetCodeStats
}

export type RecentSubmission = {
  id: string
  title: string
  titleSlug: string
  timestamp: string
}
