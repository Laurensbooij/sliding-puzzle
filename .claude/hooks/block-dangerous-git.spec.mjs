import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Guards the PreToolUse hook that stops agents running destructive git commands.
 * The strings below are data — they are piped to the hook as JSON and never
 * executed. Requires bash and jq, both present on CI runners.
 */
const HOOK_PATH = fileURLToPath(new URL('./block-dangerous-git.sh', import.meta.url))

const classify = (command) => {
	const result = spawnSync('bash', [HOOK_PATH], {
		input: JSON.stringify({ tool_input: { command } }),
		encoding: 'utf8',
	})
	return result.status === 0 ? 'allowed' : 'blocked'
}

describe('block-dangerous-git', () => {
	it.each([
		'git push',
		'git push origin docs/development-journey',
		'git push --dry-run',
		'git push -u origin HEAD',
		'git commit -m "feat: add tile"',
		'git rebase --continue',
		'gh pr create --fill',
		'git checkout HEAD -- .agents',
		'git branch -d merged-branch',
		// Pushes to main pass this hook: rejecting them is the pre-push hook's
		// job (.husky/pre-push), where the rule binds every push, not just the
		// agent's. See CLAUDE.md § Git workflow.
		'git push origin main',
		'git push origin HEAD:main',
		'git push origin HEAD:refs/heads/main',
	])('allows %s', (command) => {
		const verdict = classify(command)
		expect(verdict).toBe('allowed')
	})

	it.each([
		'git push --force',
		'git push --force-with-lease',
		'git push -f',
		'git push -f origin HEAD',
		'git reset --hard',
		'git reset --hard HEAD~1',
		'git clean -f',
		'git clean -fd',
		'git branch -D feature',
		'git checkout .',
		'git restore .',
	])('blocks %s', (command) => {
		const verdict = classify(command)
		expect(verdict).toBe('blocked')
	})

	// "main" must be a whole ref: this repo has a domain model, so branches
	// containing "domain" are expected and must stay pushable.
	it.each([
		'git push origin fix/domain-model',
		'git push origin feat/maintenance',
		'git push origin docs/domain',
	])('does not mistake %s for a push to main', (command) => {
		const verdict = classify(command)
		expect(verdict).toBe('allowed')
	})
})
