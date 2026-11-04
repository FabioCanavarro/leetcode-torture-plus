const { extractProblemSlug, isSameLeetCodeProblem } = require("../urlUtils")
const fs = require("fs")
const path = require("path")

describe("LeetCode Torture Plus - Advanced Features", () => {
  describe("urlUtils and slug extraction", () => {
    test("extracts slug accurately from standard url", () => {
      expect(
        extractProblemSlug("https://leetcode.com/problems/median-of-two-sorted-arrays/")
      ).toBe("median-of-two-sorted-arrays")
    })

    test("extracts slug from url with subpaths and queries", () => {
      expect(
        extractProblemSlug(
          "https://leetcode.com/problems/trapping-rain-water/description/?envType=study-plan-v2"
        )
      ).toBe("trapping-rain-water")
    })

    test("extracts slug case-insensitively as lowercase", () => {
      expect(
        extractProblemSlug("https://leetcode.com/problems/Two-Sum/")
      ).toBe("two-sum")
    })

    test("handles null or undefined gracefully", () => {
      expect(extractProblemSlug(null)).toBeNull()
      expect(extractProblemSlug(undefined)).toBeNull()
      expect(extractProblemSlug("")).toBeNull()
    })
  })

  describe("Dataset and Insanely Hard problem validations", () => {
    test("verified datasets have hard problems available", () => {
      const neetcode = JSON.parse(
        fs.readFileSync(
          path.join(__dirname, "../leetcode-problems/neetCode150Problems.json"),
          "utf-8"
        )
      )
      const hardProblems = neetcode.filter((p) => p.difficulty === "Hard")
      expect(hardProblems.length).toBeGreaterThan(15)

      // Verify each hard problem has a valid LeetCode href
      for (const p of hardProblems) {
        expect(p.href).toMatch(/^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+/)
        expect(extractProblemSlug(p.href)).toBeTruthy()
      }
    })
  })
})

