#!/usr/bin/env bash
# PostToolUse hook: run Prettier on every file Claude edits, so the tree stays
# formatted during a session and diffs stay readable mid-task.
set -u

INPUT=$(cat)
FILE=$(node -e '
  let data = ""
  process.stdin.on("data", (c) => (data += c))
  process.stdin.on("end", () => {
    try {
      const parsed = JSON.parse(data)
      process.stdout.write(parsed.tool_input?.file_path ?? "")
    } catch {
      process.stdout.write("")
    }
  })
' <<<"$INPUT")

[ -z "$FILE" ] && exit 0
[ -f "$FILE" ] || exit 0

pnpm exec prettier --ignore-unknown --write "$FILE" >/dev/null 2>&1 || true
exit 0
