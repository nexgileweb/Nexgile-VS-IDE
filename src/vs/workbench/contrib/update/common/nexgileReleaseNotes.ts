/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IUpdateInfoFeature } from './updateInfoParser.js';

/*
 * Nexgile: the release notes Nexgile Code shows, written for it and shipped inside it.
 *
 * Upstream downloads its release notes from code.visualstudio.com (`v1_141.md` for the release
 * notes editor, `v1_141_update.md` for the post-update tooltip), so after an update this fork
 * opened Visual Studio Code's notes. Nexgile Code's are kept here instead, one entry per VS Code
 * base (the `major.minor` of the product version), and open without a network connection.
 *
 * A release on a new VS Code base needs a new entry; without one, Help > Show Release Notes and
 * the page shown after an update fall back to opening `releaseNotesUrl` in the browser. A patch
 * release on the same base updates its base's entry.
 */

interface INexgileRelease {
	/** The page heading. */
	readonly title: string;
	/** Markdown between the heading and the release highlights. */
	readonly intro: string;
	/**
	 * The release highlights: listed at the top of the release notes and shown in the post-update
	 * tooltip, which shows at most five. Plain text, as the tooltip renders no `kb()` keybindings.
	 */
	readonly highlights: readonly IUpdateInfoFeature[];
	/** Markdown after the release highlights. */
	readonly details: string;
}

const releases = new Map<string, INexgileRelease>([
	['1.141', {
		title: 'Nexgile Code 1.141',
		intro: `Release date: October 2026

Nexgile Code 1.141 is built on Visual Studio Code 1.141 and ships with version 3.6.159 of the Nexgile Code agent. These notes cover what has changed since Nexgile Code 1.123.`,
		highlights: [
			{ icon: 'preview', title: 'One Markdown preview', description: 'Open Preview now opens Nexgile Code\'s preview, where you can select any part of a document, comment on it and have the AI rewrite that part.' },
			{ icon: 'shield', title: 'Offline security checks', description: 'Files the agent writes and files you save are scanned on your machine, and Security mode starts from what the scanners found.' },
			{ icon: 'checklist', title: 'Plan mode', description: 'Architect mode is now Plan mode: review a plan in its preview, comment on any part of it, and choose Proceed when it is right.' },
			{ icon: 'type-hierarchy', title: 'Cortex on NxGraph', description: 'Cortex now runs on NxGraph 2.3.0 and follows calls from one service into the next, and code search works in /batch task worktrees.' },
			{ icon: 'debug-restart', title: 'Work that survives a reload', description: 'Parallel subtasks and Agent Teams pick up where they left off after the window reloads.' },
		],
		details: `## Nexgile Code IDE

**Built on Visual Studio Code 1.141.** The editor moves from the Visual Studio Code 1.123 base to 1.141 and picks up the editor, terminal, source control and debugging improvements made in between. For example, text copied from a column (box) selection now pastes as a block on successive lines from a single cursor. Visual Studio Code's own AI features stay switched off: all AI in Nexgile Code comes from the Nexgile Code agent.

**One Markdown preview.** Open Preview on a Markdown file now opens Nexgile Code's preview, the one plans open in. Select any part of the document, write what should change and choose **Apply**: the model you use in Nexgile Code rewrites only that part, the new text is highlighted, and **Undo** puts the old text back. You can also edit the document by hand in the preview, and it follows edits made in the editor, saved or not.

Every way into the preview opens it: the preview button in the editor title bar, **Open Preview** in the Explorer and editor tab context menus, \`kb(markdown.togglePreview)\`, \`kb(markdown.showPreviewToSide)\` and the **Markdown: Open Preview** commands. Untitled documents, and every document until a licence key is entered, still open in the built-in preview, which also stays available from **Reopen Editor With...**.

**Nexgile Code release notes.** **Help > Show Release Notes**, and the page that opens after an update, now show these notes instead of Visual Studio Code's. They ship with Nexgile Code, so they open without a network connection. Clear **Show release notes after an update** at the top of this page to stop them from opening.

**Branding.** The macOS and Linux app icons and the publisher named on the binaries are Nexgile Code's, and the Windows installer names Nexgile Code instead of VS Code in its messages.

## Nexgile Code agent 3.6.159

**Plan mode.** Architect mode is now Plan mode, reached with \`/plan\`, and anything saved under the old name keeps working. A finished plan opens in a preview beside the chat: select any part of it and choose **Comment**, then **Review** sends all your comments at once and the agent presents the revised plan in the same tab. Nothing is implemented until you choose **Proceed**. The chat keeps a small card with the plan's title and summary. Plans are saved in the project's own folder, \`~/.nexgile/projects/<project>/plans\`, instead of in the repository.

**UI Designer preview.** Once UI Designer has written a design, a **Preview** button under the conversation opens it rendered in an editor tab, with Mobile, Tablet, Desktop and Fit widths. The design runs in a sandboxed frame that cannot reach the network or the disk.

**Offline security checks.** Every file the agent writes is scanned before the agent carries on: a high or critical finding goes back to the agent the way a compile error does, so it fixes what it just introduced, and everything else appears in the Problems panel. Files you save are scanned too, **Nexgile Code: Scan Workspace for Security Problems** scans every indexed folder, and Security mode starts from what the scanners found. The checks use NxGraph's security rules and taint analysis, plus Opengrep, ast-grep, Betterleaks, OSV-Scanner, actionlint and zizmor from the Nexgile Security Pack extension. The scanners run with their network features switched off, and nothing is downloaded while they run.

**Cortex runs on NxGraph.** Cortex's engine is now NxGraph 2.3.0. It reads a repository as services, apps and libraries, and follows HTTP calls, gRPC calls and messages from one service into the next, through gateways, Dapr and sagas, so explore, impact and flows cross service boundaries. HTML pages and templates are indexed too. Each project's index is built again the first time the project opens after this update, and Cortex settings start from their defaults once, so set them again in **Settings > Cortex**. The Cortex commands keep their titles but have new IDs, so a keybinding made for one of them needs to be set again. Every /batch task worktree can have a Cortex index of its own, and codebase search works in those worktrees too.

**Work that survives a reload.** Parallel subtasks and Agent Teams now survive a window reload: open the parent task from history and choose **Continue**, and every child resumes. Workflow scripts can start child tasks, wait for them and combine their results in code, and a task can carry read scopes beside its write scopes.

**Every mode tested end to end.** All 31 built-in modes were reviewed, and every mode with a gap was run end to end against a real model; what that found is fixed. A question whose "yes" would commit, push, open or merge a pull request, deploy, apply a migration or delete data is now always an approval question, and never answers itself.

**Models.** Claude Sonnet 5.5 can be picked on Anthropic, Amazon Bedrock, Google Vertex AI, OpenRouter and the Vercel AI Gateway. DeepSeek usage outside DeepSeek's peak hours is costed at its off-peak prices, and long DeepSeek answers are no longer cut off at 8,192 tokens.

**Removed.** The Translation Hub is removed. Translate mode stays, and **Nexgile Code: Translate Code** opens a chat in it.

## Earlier in Nexgile Code 1.123

Coming from an earlier Nexgile Code 1.123 build? The agent updates it shipped, from 3.6.124 to 3.6.156, are part of this release too:

- **Chat**: a new chat box and home screen; finished tool calls shown one line each, with a Normal and Verbose switch; live subtask cards with Stop; Up and Down for prompt history; /goal, /context and /compact, with one context gauge; auto-approve in the title bar; and Ask mode, renamed Chat.
- **Agents**: /batch runs a large change as parallel agents in git worktrees, Agent Teams let subagents message each other, and the Agent Manager opens as a tab beside the chat, with plans and questions.
- **Cortex** builds its index by itself and catches up when HEAD moves, with Flows, Checks and Unreferenced tabs.
- **Writes**: long files are written whole, cut-off writes are refused, and tasks can carry write scopes that the tools enforce.
- **Models**: Claude Opus 5.5, Claude Fable 5.1, GPT-6 Sol, GPT-6 Luna and GPT-6 Astra, GPT-5.6 Luna on a ChatGPT subscription, and the September 2026 model updates across the other providers.
- **And more**: the Skills Marketplace, speech to text in the chat box, Settings with User and Workspace tabs, a Markdown plan preview, and a fix for API keys that failed to authenticate against a LiteLLM gateway.
`,
	}],
]);

function releaseFor(version: string): INexgileRelease | undefined {
	const majorMinor = /^(?<majorMinor>\d+\.\d+)\./.exec(version)?.groups?.majorMinor;
	return majorMinor ? releases.get(majorMinor) : undefined;
}

/**
 * The release notes for `version`, in Markdown, or `undefined` when this build has none for its
 * VS Code base.
 */
export function getNexgileReleaseNotes(version: string): string | undefined {
	const release = releaseFor(version);
	if (!release) {
		return undefined;
	}

	const highlights = release.highlights.map(highlight => `- **${highlight.title}**: ${highlight.description}`).join('\n');
	return `# ${release.title}\n\n${release.intro}\n\n## Release highlights\n\n${highlights}\n\n${release.details}`;
}

/**
 * The post-update tooltip's content for `version`, in the JSON form `parseUpdateInfoInput`
 * reads, or `undefined` when this build has no release notes for its VS Code base.
 */
export function getNexgileUpdateInfo(version: string): string | undefined {
	const release = releaseFor(version);
	return release && JSON.stringify({ markdown: '', features: release.highlights });
}
