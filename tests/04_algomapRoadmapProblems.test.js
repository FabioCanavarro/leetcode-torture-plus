const problems = require("../leetcode-problems/algomapRoadmapProblems.json")

test("has at least 100 problems", () => {
  expect(problems.length).toBeGreaterThanOrEqual(100)
})

test("every entry has the shape used by getLeetCodeProblemFromProblemSet", () => {
  for (const problem of problems) {
    expect(typeof problem.category).toBe("string")
    expect(problem.href).toMatch(/^https:\/\/leetcode\.com\/problems\/[^/]+\/$/)
    expect(typeof problem.text).toBe("string")
    expect(["Easy", "Medium", "Hard"]).toContain(problem.difficulty)
    expect(typeof problem.isPremium).toBe("boolean")
  }
})

test("has no duplicate problems", () => {
  const hrefs = problems.map((problem) => problem.href)
  expect(new Set(hrefs).size).toBe(hrefs.length)
})

test("has no premium-only problems, matching algomap.io's free roadmap", () => {
  expect(problems.every((problem) => problem.isPremium === false)).toBe(true)
})
