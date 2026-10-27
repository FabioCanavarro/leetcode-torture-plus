import { storage } from "storage"
import type { APILeetCodeProblem, JSONLeetCodeProblem, ProblemInfo } from "types"

import { getProblemListFromLeetCodeAPI } from "~background"

function matchesCategory(
  problemCategory: string | undefined,
  selectedCategory: string
): boolean {
  if (!selectedCategory || selectedCategory === "all") return true
  if (!problemCategory) return false

  const pCat = problemCategory.toLowerCase().trim()
  const sCat = selectedCategory.toLowerCase().trim()

  if (pCat === sCat) return true

  if (sCat.includes("pointer") && pCat.includes("pointer")) return true
  if (sCat.includes("stack") && pCat.includes("stack")) return true
  if (sCat.includes("linked") && pCat.includes("linked")) return true
  if (sCat.includes("heap") && pCat.includes("heap")) return true
  if (sCat.includes("graph") && pCat.includes("graph")) return true
  if (sCat.includes("tree") && pCat.includes("tree")) return true
  if (sCat.includes("window") && pCat.includes("window")) return true
  if (sCat.includes("binary search") && pCat.includes("binary search")) return true
  if (
    sCat.includes("dynamic") &&
    (pCat.includes("dynamic") || pCat.includes("dp"))
  )
    return true
  if (sCat.includes("backtrack") && pCat.includes("backtrack")) return true
  if (
    sCat.includes("array") &&
    (pCat.includes("array") || pCat.includes("hash"))
  )
    return true

  return pCat.includes(sCat) || sCat.includes(pCat)
}

export async function getAllLeetCodeProblems(
  difficulty: string,
  problemSet: string
): Promise<ProblemInfo> {
  try {
    const includePremium = await storage.getIncludePremium()
    const leetCodeProblems: APILeetCodeProblem[] =
      await getProblemListFromLeetCodeAPI(
        difficulty,
        problemSet?.slice(3) || ""
      )

    if (!leetCodeProblems || leetCodeProblems.length === 0) {
      return await getLeetCodeProblemFromProblemSet(difficulty, "Blind75")
    }

    const availableProblems = includePremium
      ? leetCodeProblems
      : leetCodeProblems.filter((p) => !p.paidOnly)

    const list = availableProblems.length > 0 ? availableProblems : leetCodeProblems
    const randomIndex = Math.floor(Math.random() * list.length)
    const randomProblem = list[randomIndex]

    const randomProblemURL =
      "https://leetcode.com/problems/" + randomProblem.titleSlug + "/"
    const randomProblemName = randomProblem.title
    const problemDifficulty = randomProblem.difficulty || "Medium"
    const problemCategory = randomProblem.topicTags?.[0]?.name || "General"

    await storage.stopLoading()
    return {
      url: randomProblemURL,
      name: randomProblemName,
      difficulty: problemDifficulty,
      category: problemCategory
    }
  } catch (error) {
    console.error("Error fetching all leetcode problems:", error)
    return await getLeetCodeProblemFromProblemSet(difficulty, "Blind75")
  } finally {
    await storage.stopLoading()
  }
}

export async function getLeetCodeProblemFromProblemSet(
  difficulty: string,
  problemSet: string
): Promise<ProblemInfo> {
  try {
    const includePremium = await storage.getIncludePremium()
    const category = await storage.getCategory()

    const problemSetURLs: Record<string, string> = {
      allNeetcode: "leetcode-problems/allProblems.json",
      NeetCode150: "leetcode-problems/neetCode150Problems.json",
      Blind75: "leetcode-problems/blind75Problems.json",
      metaTop100: "leetcode-problems/metaTop100.json",
      algomapRoadmap: "leetcode-problems/algomapRoadmapProblems.json"
    }

    const targetUrl = problemSetURLs[problemSet] || problemSetURLs.Blind75
    const res = await fetch(chrome.runtime.getURL(targetUrl))
    const leetCodeProblems: JSONLeetCodeProblem[] = await res.json()

    // 1. Filter by premium, difficulty, and category
    let filteredProblems = leetCodeProblems.filter((problem) => {
      if (!problem.href.endsWith("/")) {
        problem.href += "/"
      }
      const matchesDiff =
        difficulty === "all" ||
        problem.difficulty?.toLowerCase() === difficulty.toLowerCase()
      const matchesCat = matchesCategory(problem.category, category)
      const matchesPrem = includePremium || !problem.isPremium
      return matchesPrem && matchesDiff && matchesCat
    })

    // Fallback: If no problems match both difficulty & category, relax difficulty first
    if (filteredProblems.length === 0 && difficulty !== "all") {
      filteredProblems = leetCodeProblems.filter((problem) => {
        const matchesCat = matchesCategory(problem.category, category)
        const matchesPrem = includePremium || !problem.isPremium
        return matchesPrem && matchesCat
      })
    }

    // Fallback: If still empty, relax category
    if (filteredProblems.length === 0) {
      filteredProblems = leetCodeProblems.filter((problem) => {
        return includePremium || !problem.isPremium
      })
    }

    // Ultimate fallback if all are premium and user toggled false
    if (filteredProblems.length === 0) {
      filteredProblems = leetCodeProblems
    }

    const randomIndex = Math.floor(Math.random() * filteredProblems.length)
    const randomProblem = filteredProblems[randomIndex]

    return {
      url: randomProblem.href,
      name: randomProblem.text,
      difficulty: randomProblem.difficulty || "Medium",
      category: randomProblem.category || "General"
    }
  } catch (error) {
    console.error("Error loading problem from problem set:", error)
    return {
      url: "https://leetcode.com/problems/two-sum/",
      name: "Two Sum",
      difficulty: "Easy",
      category: "Arrays & Hashing"
    }
  }
}
