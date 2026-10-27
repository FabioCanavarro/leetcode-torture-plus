const { isSameLeetCodeProblem } = require("../urlUtils")

const PROBLEM_URL = "https://leetcode.com/problems/two-sum/"

test("matches the bare problem url", () => {
  expect(isSameLeetCodeProblem(PROBLEM_URL, PROBLEM_URL)).toBe(true)
})

test("matches the description sub-route", () => {
  expect(
    isSameLeetCodeProblem(
      PROBLEM_URL,
      "https://leetcode.com/problems/two-sum/description/"
    )
  ).toBe(true)
})

test("matches with query params attached (study plan / list navigation)", () => {
  expect(
    isSameLeetCodeProblem(
      PROBLEM_URL,
      "https://leetcode.com/problems/two-sum/description/?envType=study-plan-v2&envId=top-100-liked"
    )
  ).toBe(true)
})

test("matches the submissions sub-route", () => {
  expect(
    isSameLeetCodeProblem(
      PROBLEM_URL,
      "https://leetcode.com/problems/two-sum/submissions/"
    )
  ).toBe(true)
})

test("rejects a different problem", () => {
  expect(
    isSameLeetCodeProblem(
      PROBLEM_URL,
      "https://leetcode.com/problems/three-sum/description/"
    )
  ).toBe(false)
})
