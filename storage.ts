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

export async function updateProblem(
  problem: ProblemInfo,
  isSolved: boolean
) {
  return Promise.all([
    storage.set("problemURL", problem.url),
    storage.set("problemName", problem.name),
    storage.set("problemDifficulty", problem.difficulty ?? "Medium"),
    storage.set("problemCategory", problem.category ?? "General"),
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
