// LeetCode problem URLs vary by suffix and query string
// (/problems/two-sum/, /description/, /submissions/, ?envType=...),
// so match on the slug rather than exact string equality.
function extractProblemSlug(url) {
  const match = url?.match(/\/problems\/([^/?#]+)/)
  return match ? match[1].toLowerCase() : null
}

function isSameLeetCodeProblem(problemUrl, currentUrl) {
  const slugA = extractProblemSlug(problemUrl)
  const slugB = extractProblemSlug(currentUrl)
  return Boolean(slugA && slugB && slugA === slugB)
}

module.exports = { extractProblemSlug, isSameLeetCodeProblem }
