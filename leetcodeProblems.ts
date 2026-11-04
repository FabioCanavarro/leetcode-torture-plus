import { storage } from "storage"
import type {
  APILeetCodeProblem,
  JSONLeetCodeProblem,
  ProblemInfo
} from "types"

import { getProblemListFromLeetCodeAPI } from "~background"
import { extractProblemSlug } from "~urlUtils"

export const INSANELY_HARD_PROBLEMS: JSONLeetCodeProblem[] = [
  {
    category: "Binary Search",
    href: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    text: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Two Pointers",
    href: "https://leetcode.com/problems/trapping-rain-water/",
    text: "Trapping Rain Water",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Dynamic Programming",
    href: "https://leetcode.com/problems/regular-expression-matching/",
    text: "Regular Expression Matching",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Linked List",
    href: "https://leetcode.com/problems/merge-k-sorted-lists/",
    text: "Merge k Sorted Lists",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Sliding Window",
    href: "https://leetcode.com/problems/minimum-window-substring/",
    text: "Minimum Window Substring",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Trees",
    href: "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
    text: "Binary Tree Maximum Path Sum",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Backtracking",
    href: "https://leetcode.com/problems/word-search-ii/",
    text: "Word Search II",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Heap / Priority Queue",
    href: "https://leetcode.com/problems/find-median-from-data-stream/",
    text: "Find Median from Data Stream",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Linked List",
    href: "https://leetcode.com/problems/reverse-nodes-in-k-group/",
    text: "Reverse Nodes in k-Group",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Backtracking",
    href: "https://leetcode.com/problems/sudoku-solver/",
    text: "Sudoku Solver",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Backtracking",
    href: "https://leetcode.com/problems/n-queens/",
    text: "N-Queens",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Sliding Window",
    href: "https://leetcode.com/problems/sliding-window-maximum/",
    text: "Sliding Window Maximum",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Dynamic Programming",
    href: "https://leetcode.com/problems/edit-distance/",
    text: "Edit Distance",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Dynamic Programming",
    href: "https://leetcode.com/problems/burst-balloons/",
    text: "Burst Balloons",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Stack",
    href: "https://leetcode.com/problems/largest-rectangle-in-histogram/",
    text: "Largest Rectangle in Histogram",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Graphs",
    href: "https://leetcode.com/problems/alien-dictionary/",
    text: "Alien Dictionary",
    difficulty: "Hard",
    isPremium: true
  },
  {
    category: "Graphs",
    href: "https://leetcode.com/problems/shortest-path-in-a-grid-with-obstacles-elimination/",
    text: "Shortest Path in a Grid with Obstacles Elimination",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Dynamic Programming",
    href: "https://leetcode.com/problems/wildcard-matching/",
    text: "Wildcard Matching",
    difficulty: "Hard",
    isPremium: false
  },
  {
    category: "Stack",
    href: "https://leetcode.com/problems/longest-valid-parentheses/",
    text: "Longest Valid Parentheses",
    difficulty: "Hard",
    isPremium: false
  }
]

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
  if (sCat.includes("binary search") && pCat.includes("binary search"))
    return true
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

/**
 * Returns an insanely hard problem as the 3rd reroll punishment.
 */
export async function getInsanelyHardLeetCodeProblem(): Promise<ProblemInfo> {
  try {
    const includePremium = await storage.getIncludePremium()
    const excludeSolved = await storage.getExcludeSolvedProblems()
    const solvedSlugs = await storage.getSolvedProblemSlugs()

    let pool = INSANELY_HARD_PROBLEMS.filter((p) => {
      if (!includePremium && p.isPremium) return false
      const slug = extractProblemSlug(p.href)
      if (excludeSolved && slug && solvedSlugs.includes(slug)) return false
      return true
    })

    // If all curated hard problems have been solved, relax the solved filter
    if (pool.length === 0) {
      pool = INSANELY_HARD_PROBLEMS.filter(
        (p) => includePremium || !p.isPremium
      )
    }

    if (pool.length === 0) {
      pool = INSANELY_HARD_PROBLEMS
    }

    const randomIndex = Math.floor(Math.random() * pool.length)
    const selected = pool[randomIndex]

    return {
      url: selected.href.endsWith("/") ? selected.href : selected.href + "/",
      name: selected.text,
      difficulty: "Hard",
      category: selected.category || "Nightmare DSA",
      isInsanelyHard: true
    }
  } catch (err) {
    console.error("Error picking insanely hard problem:", err)
    return {
      url: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
      name: "Median of Two Sorted Arrays",
      difficulty: "Hard",
      category: "Binary Search",
      isInsanelyHard: true
    }
  }
}

export async function getAllLeetCodeProblems(
  difficulty: string,
  problemSet: string
): Promise<ProblemInfo> {
  try {
    const includePremium = await storage.getIncludePremium()
    const excludeSolved = await storage.getExcludeSolvedProblems()
    const solvedSlugs = await storage.getSolvedProblemSlugs()

    const leetCodeProblems: APILeetCodeProblem[] =
      await getProblemListFromLeetCodeAPI(
        difficulty,
        problemSet?.slice(3) || ""
      )

    if (!leetCodeProblems || leetCodeProblems.length === 0) {
      return await getLeetCodeProblemFromProblemSet(difficulty, "Blind75")
    }

    let availableProblems = includePremium
      ? leetCodeProblems
      : leetCodeProblems.filter((p) => !p.paidOnly)

    // Filter out already solved problems if enabled
    if (excludeSolved && solvedSlugs.length > 0) {
      const unsolved = availableProblems.filter(
        (p) => !solvedSlugs.includes(p.titleSlug.toLowerCase())
      )
      if (unsolved.length > 0) {
        availableProblems = unsolved
      }
    }

    const list =
      availableProblems.length > 0 ? availableProblems : leetCodeProblems
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
    const excludeSolved = await storage.getExcludeSolvedProblems()
    const solvedSlugs = await storage.getSolvedProblemSlugs()

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

    // Helper to test if problem is solved
    const isProblemSolved = (href: string) => {
      if (!excludeSolved || solvedSlugs.length === 0) return false
      const slug = extractProblemSlug(href)
      return slug ? solvedSlugs.includes(slug) : false
    }

    // 1. Filter by premium, difficulty, category, and solved state
    let filteredProblems = leetCodeProblems.filter((problem) => {
      if (!problem.href.endsWith("/")) {
        problem.href += "/"
      }
      const matchesDiff =
        difficulty === "all" ||
        problem.difficulty?.toLowerCase() === difficulty.toLowerCase()
      const matchesCat = matchesCategory(problem.category, category)
      const matchesPrem = includePremium || !problem.isPremium
      const notSolved = !isProblemSolved(problem.href)
      return matchesPrem && matchesDiff && matchesCat && notSolved
    })

    // Fallback 1: If no problems match with unsolved filter, relax difficulty
    if (filteredProblems.length === 0 && difficulty !== "all") {
      filteredProblems = leetCodeProblems.filter((problem) => {
        const matchesCat = matchesCategory(problem.category, category)
        const matchesPrem = includePremium || !problem.isPremium
        const notSolved = !isProblemSolved(problem.href)
        return matchesPrem && matchesCat && notSolved
      })
    }

    // Fallback 2: If still empty, relax category
    if (filteredProblems.length === 0) {
      filteredProblems = leetCodeProblems.filter((problem) => {
        const matchesPrem = includePremium || !problem.isPremium
        const notSolved = !isProblemSolved(problem.href)
        return matchesPrem && notSolved
      })
    }

    // Fallback 3: If ALL problems in the set were solved by user, allow re-practicing
    if (filteredProblems.length === 0) {
      filteredProblems = leetCodeProblems.filter((problem) => {
        const matchesDiff =
          difficulty === "all" ||
          problem.difficulty?.toLowerCase() === difficulty.toLowerCase()
        const matchesCat = matchesCategory(problem.category, category)
        const matchesPrem = includePremium || !problem.isPremium
        return matchesPrem && matchesDiff && matchesCat
      })
    }

    // Ultimate fallback
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
