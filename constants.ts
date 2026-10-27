export const messages: Record<string, { language: string; message: string }> = {
  cpp: {
    language: "cpp",
    message:
      "You think you are better than everyone just because your language has pointers?"
  },
  java: {
    language: "java",
    message: "Just use C++ like everyone else."
  },
  javascript: {
    language: "javascript",
    message: "Don't you have to download an npm package to do that?"
  },
  rust: {
    language: "rust",
    message: "Why would you use Rust for LeetCode? Did the borrow checker finally let you submit?"
  },
  c: {
    language: "c",
    message: "You know C++ exists right? Memory leaks incoming."
  },
  typescript: {
    language: "typescript",
    message: "Oooh, look at me, my JavaScript has fancy types!"
  },
  python: {
    language: "python",
    message:
      'Tell me the truth, you have as many friends in real life as you have ";" in your code, right?'
  },
  python3: {
    language: "python3",
    message: "Want a ruler to measure that indentation?"
  },
  csharp: {
    language: "csharp",
    message:
      "You know, if you point a million monkeys at a million keyboards, one of them will write C#."
  },
  ruby: {
    language: "ruby",
    message: "Go and learn a real language."
  },
  swift: {
    language: "swift",
    message: "Wasn't this supposed to be optional?"
  },
  go: {
    language: "go",
    message: "Go, just keep going, don't stop, don't look back, just go."
  },
  erlang: {
    language: "erlang",
    message: "Oh! Hello Grandpa!"
  },
  elixir: {
    language: "elixir",
    message: "You sound like a language used in Lord of the Rings."
  },
  dart: {
    language: "dart",
    message: "Just learn a real language please."
  },
  kotlin: {
    language: "kotlin",
    message: "Seriously? Kotlin for LeetCode? Just write Android apps."
  },
  php: {
    language: "php",
    message: "Just stick to web development from 2008."
  },
  scala: {
    language: "scala",
    message: "Functional programming won't save your time complexity."
  },
  sql: {
    language: "sql",
    message: "SELECT happiness FROM life WHERE solved_leetcode = 1 -- 0 rows returned."
  },
  r: {
    language: "r",
    message: "Did your statistics professor force you to use R for this?"
  }
}

export function getRoastMessage(language: string | undefined): string {
  if (!language) return "Accepted! You survived another LeetCode problem."
  const langKey = language.toLowerCase().trim()
  if (messages[langKey]) {
    return messages[langKey].message
  }
  // Try matching partial (e.g. 'python' in 'python3')
  for (const [key, val] of Object.entries(messages)) {
    if (langKey.includes(key) || key.includes(langKey)) {
      return val.message
    }
  }
  return "Accepted! You survived another LeetCode problem."
}
