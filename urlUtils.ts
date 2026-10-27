// LeetCode problem URLs vary by suffix and query string
// (/problems/two-sum/, /description/, /submissions/, ?envType=...),
// so match on the slug rather than exact string equality.

export function extractProblemSlug(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/\/problems\/([^/?#]+)/)
  return match ? match[1].toLowerCase() : null
}

export function isSameLeetCodeProblem(
  problemUrl: string | null | undefined,
  currentUrl: string | null | undefined
): boolean {
  const slugA = extractProblemSlug(problemUrl)
  const slugB = extractProblemSlug(currentUrl)
  return Boolean(slugA && slugB && slugA === slugB)
}
