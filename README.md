# ⚔️ LeetCode Torture Plus (Enchanted Edition)

An enchanted, production-grade browser extension that forces you into solving LeetCode problems before letting you access distracting websites. 

Forked and modernized from `The-CodingSloth/haha-funny-leetcode-extension` with fixes from all community pull requests, full compatibility with LeetCode's modern dynamic UI update, and a stunning dark cyber-glassmorphism interface.

---

## ⚡ What's New & Fixed in This Edition

### 🛠️ 1. Modern LeetCode Submission Engine
- **Robust URL Slug Matching**: Handles modern LeetCode subroutes (`/description/`, `/submissions/`, `?envType=...`, query parameters).
- **Multi-Layered Submission Detection**:
  - Global network interception on submission check REST endpoints (`/submissions/detail/*/check/`).
  - Keyboard submission shortcut capture (`Ctrl + Enter` / `Cmd + Enter`).
  - Modern DOM locators: `button[data-e2e-locator="console-submit-button"]`, `button[data-cy="submit-code-btn"]`, and fallback DOM mutation observer.
- **Tab-Independent Check**: Verifies submission by request `tabId`, so switching away from the tab while the judge runs never drops your accepted solution.
- **Reload Protection**: Reloading or restarting the browser does not wipe an active in-progress or already-solved daily problem.

### 📚 2. Expanded Problem Sets & Filtering
- **AlgoMap Roadmap Set**: Added 100 free curated problems from [algomap.io/roadmap](https://algomap.io) spanning 11 core DSA topics.
- **DSA Category Filter**: Filter problems by specific topic (Arrays & Hashing, Two Pointers, Sliding Window, Trees, Graphs, Dynamic Programming, and more) across all problem sets.
- **Safe Problem Generation**: Out-of-bounds index safeguards and multi-level fallbacks ensure problems always load smoothly even with narrow filter criteria.

### ⏸️ 3. Emergency Pause ("Stop the Madness")
- Need to take a quick meeting or check docs? One-click **Emergency Pause** toggle directly in the popup and settings drawer temporarily lifts redirects without clearing your streaks.

### 🚀 4. Destination URL Restoration
- Intercepted on your way to an important webpage? The extension remembers the exact URL you were navigating to and offers a **"Continue to [page]"** button upon solving the trial.

### ⚡ 5. Hyper Torture Mode Fixed
- In Hyper Torture mode, completing a problem now generates a brand-new random challenge instead of looping the same solved problem. Tracks both current and all-time best Hyper streaks.

### 🎨 6. Enchanted Cyber-Dark Glassmorphism UI
- Deep obsidian background with gradient mesh and frosted glass panels.
- Glowing streak tracker with flame and trophy badges.
- Difficulty pills (Emerald Easy, Amber Medium, Crimson Hard).
- Sleek modern toggle switches and styled dropdown controls.
- Beautiful, witty celebratory completion modal with confetti and custom language roasts.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/FabioCanavarro/leetcode-torture.git
cd leetcode-torture

# Install dependencies
pnpm install

# Run in Chrome dev mode
pnpm dev

# Or build production Chrome bundle (Manifest V3)
pnpm build

# Or build for Firefox (Manifest V3)
pnpm build-firefox
```

### Loading in Google Chrome / Chromium
1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select `build/chrome-mv3-dev` (or `build/chrome-mv3-prod`).
4. Pin the extension and start your algorithmic trial!

### Loading in Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select any file inside `build/firefox-mv3-dev` (or `build/firefox-mv3-prod/manifest.json`).

---

## 🧪 Testing

```bash
# Run unit tests (URL slug matching & problem set invariants)
pnpm test
```

---

## 📄 License
MIT License.
