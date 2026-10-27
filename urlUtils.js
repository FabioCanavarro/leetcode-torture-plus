// LeetCode problem URLs vary by suffix and query string
// (/problems/two-sum/, /description/, /submissions/, ?envType=...),
// so match on the slug rather than exact string equality.
function extractProblemSlug(url) {
  const match = url?.match(/\/problems\/([^/?#]+)/)
  return match ? match[1] : null
}

function isSameLeetCodeProblem(problemUrl, currentUrl) {
  const slug = extractProblemSlug(problemUrl)
  return !!slug && slug === extractProblemSlug(currentUrl)
}

module.exports = { extractProblemSlug, isSameLeetCodeProblem }
