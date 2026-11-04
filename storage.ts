import { Storage } from "@plasmohq/storage"
import type { ProblemInfo } from "~types"

const storage = new Storage()

export const getProblemUrl = async () => await storage.get("problemURL")
export const getProblemName = async () => await storage.get("problemName")
export const getProblemDate = async () => await storage.get("problemDate")
export const getProblemDifficulty = async () =>
  (await storage.get("problemDifficulty")) ?? "Medium"
export const getProblemCategory = async () =>
  (await storage.get("problemCategory")) ?? "General"

export const getProblemSet = async () =>
  (await storage.get("problemSets")) ?? "all"
export const getDifficulty = async () =>
  (await storage.get("difficulty")) ?? "all"
export const getCategory = async () =>
  (await storage.get("category")) ?? "all"

export const getIncludePremium = async () =>
  Boolean(await storage.get("includePremium")) ?? false
export const getProblemSolved = async () =>
  Boolean(await storage.get("leetCodeProblemSolved")) ?? false
export const initiateLoading = async () => await storage.set("loading", true)
export const stopLoading = async () => await storage.set("loading", false)
export const getHyperTortureMode = async () =>
  !!(await storage.get("hyperTortureMode"))

// If disabled is true, or enableRedirectOnEveryProblem is explicitly false, redirects are paused
export const getIsDisabled = async () =>
  Boolean(await storage.get("disabled"))
export const setIsDisabled = async (disabled: boolean) =>
  await storage.set("disabled", disabled)

export const getEnableRedirectOnEveryProblem = async () => {
  const isDisabled = await getIsDisabled()
  if (isDisabled) return false
  const legacySetting = await storage.get("enableRedirectOnEveryProblem")
  if (legacySetting !== undefined && legacySetting !== null) {
    return !legacySetting
  }
  return true
}

export const getOriginalDestinationUrl = async () =>
  (await storage.get("originalDestinationUrl")) ?? ""
export const setOriginalDestinationUrl = async (url: string) =>
  await storage.set("originalDestinationUrl", url)

// --- LeetCode Account & Solved Problem Tracking ---
export const getLeetCodeUsername = async (): Promise<string> =>
  (await storage.get("leetcodeUsername")) || ""
export const setLeetCodeUsername = async (username: string) =>
  await storage.set("leetcodeUsername", username)

export const getLeetCodeAvatar = async (): Promise<string> =>
  (await storage.get("leetcodeAvatar")) || ""
export const setLeetCodeAvatar = async (avatar: string) =>
  await storage.set("leetcodeAvatar", avatar)

export const getLeetCodeStats = async () =>
  (await storage.get("leetcodeStats")) || null
export const setLeetCodeStats = async (stats: any) =>
  await storage.set("leetcodeStats", stats)

export const getSolvedProblemSlugs = async (): Promise<string[]> => {
  const slugs = (await storage.get<string[]>("solvedProblemSlugs")) || []
  return Array.isArray(slugs) ? slugs.map((s) => s.toLowerCase()) : []
}

export const addSolvedProblemSlug = async (slug: string) => {
  if (!slug) return
  const slugs = await getSolvedProblemSlugs()
  const normalized = slug.toLowerCase()
  if (!slugs.includes(normalized)) {
    slugs.push(normalized)
    await storage.set("solvedProblemSlugs", slugs)
  }
}

export const addSolvedProblemSlugs = async (
  newSlugs: string[]
): Promise<number> => {
  const current = await getSolvedProblemSlugs()
  const set = new Set(current)
  for (const s of newSlugs) {
    if (s && typeof s === "string") {
      set.add(s.toLowerCase().trim())
    }
  }
  const updated = Array.from(set)
  await storage.set("solvedProblemSlugs", updated)
  return updated.length
}

export const clearSolvedProblemSlugs = async () =>
  await storage.set("solvedProblemSlugs", [])

export const getExcludeSolvedProblems = async (): Promise<boolean> => {
  const val = await storage.get("excludeSolvedProblems")
  return val === undefined || val === null ? true : Boolean(val)
}

export const setExcludeSolvedProblems = async (exclude: boolean) =>
  await storage.set("excludeSolvedProblems", exclude)

// --- 3-Chance Reroll & Insanely Hard Penalty ---
export const getRerollsUsed = async (): Promise<number> =>
  Number(await storage.get("rerollsUsed")) || 0

export const setRerollsUsed = async (count: number) =>
  await storage.set("rerollsUsed", count)

export const resetRerolls = async () =>
  await storage.set("rerollsUsed", 0)

export const getIsInsanelyHard = async (): Promise<boolean> =>
  Boolean(await storage.get("isInsanelyHard"))

export const setIsInsanelyHard = async (isHard: boolean) =>
  await storage.set("isInsanelyHard", isHard)

export async function updateProblem(
  problem: ProblemInfo,
  isSolved: boolean
) {
  return Promise.all([
    storage.set("problemURL", problem.url),
    storage.set("problemName", problem.name),
    storage.set("problemDifficulty", problem.difficulty ?? "Medium"),
    storage.set("problemCategory", problem.category ?? "General"),
    storage.set("isInsanelyHard", Boolean(problem.isInsanelyHard)),
    storage.set("problemDate", new Date().toDateString()),
    updateProblemSolvedState(isSolved)
  ])
}

export async function updateEnableRedirectOnEveryProblem(enabled: boolean) {
  await storage.set("enableRedirectOnEveryProblem", enabled)
}

export async function updatePermissions(enabled: boolean) {
  await storage.set("permissionsEnabled", enabled)
}

export async function updateProblemSolvedState(isSolved: boolean) {
  await storage.set("leetCodeProblemSolved", isSolved)
}

export async function getLastCompletion() {
  const lastCompletedString = await storage.get("lastCompleted")
  return lastCompletedString ? new Date(lastCompletedString) : new Date(0)
}

export async function updateStreak() {
  if (await getHyperTortureMode()) {
    const [HT_bestStreak, HT_currentStreak] = await Promise.all([
      storage.get("HT_bestStreak"),
      storage.get("HT_currentStreak")
    ])

    const HT_newStreak = (Number(HT_currentStreak) || 0) + 1
    const HT_best = Number(HT_bestStreak) || 0

    await storage.set("HT_currentStreak", HT_newStreak)
    if (HT_newStreak > HT_best) await storage.set("HT_bestStreak", HT_newStreak)
  } else {
    const [_, lastCompletion] = await Promise.all([
      updateProblemSolvedState(true),
      getLastCompletion()
    ])

    const now = new Date()
    if (lastCompletion.toDateString() === new Date().toDateString()) return

    const [bestStreak, currentStreak] = await Promise.all([
      storage.get("bestStreak"),
      storage.get("currentStreak")
    ])

    const newStreak = (Number(currentStreak) || 0) + 1
    const best = Number(bestStreak) || 0

    await storage.set("currentStreak", newStreak)
    await storage.set("lastCompleted", now.toDateString())
    if (newStreak > best) await storage.set("bestStreak", newStreak)
  }
}

export async function resetStreak() {
  await storage.set("currentStreak", 0)
}

export async function resetHyperTortureStreak() {
  await storage.set("HT_currentStreak", 0)
}

export * as storage from "storage"
