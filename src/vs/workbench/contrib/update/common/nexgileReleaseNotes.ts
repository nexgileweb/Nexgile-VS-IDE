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

Nexgile Code 1.141 is built on Visual Studio Code 1.141 and ships with version 3.6.165 of the Nexgile Code agent. These notes cover what has changed since Nexgile Code 1.123.`,
		highlights: [
			{ icon: 'preview', title: 'One Markdown preview', description: 'Open Preview now opens Nexgile Code\'s preview, where you can select any part of a document, comment on it and have the AI rewrite that part.' },
			{ icon: 'rocket', title: 'Greenfield', description: 'Describe a new app and Greenfield builds it in one chat: it interviews you, has you approve mock-ups screen by screen and a spec, builds the work in parallel and runs the app, deploying only when you ask.' },
			{ icon: 'checklist', title: 'Plan and Spec modes', description: 'Comment on a plan beside its lines before you choose Proceed, or let Spec mode write requirements, design and tasks for you to review, then run the tasks.' },
			{ icon: 'shield', title: 'Offline security checks', description: 'Files the agent writes and files you save are scanned on your machine, /security-review reviews your changes, and Security mode starts from what the scanners found.' },
			{ icon: 'type-hierarchy', title: 'Cortex on NxGraph', description: 'Cortex now runs on NxGraph 2.8.0 and reads your repository as services: each says what it does, and calls are followed from one service into the next.' },
		],
		details: `## Nexgile Code IDE

**Built on Visual Studio Code 1.141.** The editor moves from the Visual Studio Code 1.123 base to 1.141 and picks up the editor, terminal, source control and debugging improvements made in between. For example, text copied from a column (box) selection now pastes as a block on successive lines from a single cursor. Visual Studio Code's own AI features stay switched off: all AI in Nexgile Code comes from the Nexgile Code agent.

**One Markdown preview.** Open Preview on a Markdown file now opens Nexgile Code's preview, the one plans open in. Select any part of the document, write what should change and choose **Apply**: the model you use in Nexgile Code rewrites only that part, the new text is highlighted, and **Undo** puts the old text back. You can also edit the document by hand in the preview, and it follows edits made in the editor, saved or not.

Every way into the preview opens it: the preview button in the editor title bar, **Open Preview** in the Explorer and editor tab context menus, \`kb(markdown.togglePreview)\`, \`kb(markdown.showPreviewToSide)\` and the **Markdown: Open Preview** commands. Untitled documents, and every document until a licence key is entered, still open in the built-in preview, which also stays available from **Reopen Editor With...**.

**Nexgile Code release notes.** **Help > Show Release Notes**, and the page that opens after an update, now show these notes instead of Visual Studio Code's. They ship with Nexgile Code, so they open without a network connection. Clear **Show release notes after an update** at the top of this page to stop them from opening.

**Branding.** The macOS and Linux app icons and the publisher named on the binaries are Nexgile Code's, and the Windows installer names Nexgile Code instead of VS Code in its messages.

## Nexgile Code agent 3.6.165

**Greenfield.** The new **Greenfield** view in the activity bar builds a new app from a description, in one chat of cards you answer with a click. It interviews you the way a business analyst would, Quick, Standard or Thorough, asking one to five questions at a time about what your answers leave open, and every question also takes **Decide for me**, **Not sure**, **Not relevant** or **Someone else knows**. **Here is what I understood** then shows the requirements it took from your answers, for you to change. Next it lists the screens the app needs and draws mock-ups you review screen by screen: comment on any part of a screen, compare and restore earlier versions, see a phone and a desktop side by side, and **Approve** each one. The design and task list are written from the screens you approved. Greenfield then opens one issue per task in an empty GitHub repository you give it with **Use my empty repo**, and builds the issues in parallel waves, each coded, checked, reviewed, tested and merged. A website, web app or server is then run on your computer and its local address shown, and the app is deployed only when you choose **Deploy**. Until the issues are created, editing or deleting one of your messages takes the project back to just before it. Greenfield uses the provider and model you set in Nexgile Code. It needs Git, and the GitHub CLI signed in unless you choose **Local only**.

**The agent's browser.** The agent now drives a real browser with built-in tools, with no Playwright server to install: it opens pages, reads them, clicks, types, fills forms, uploads files, checks what a page shows, takes screenshots and reads the console and network requests. It uses Chrome, Edge or Chromium already on your computer, and asks before downloading Chromium when there is none. When a task opens a page, the **Browser** panel shows it live beside the chat with a rail of the agent's steps: **Take over** to click and type yourself, then **Give back**, or **Pause** and **Step** through the agent's actions one at a time. **Open window** moves the session into a visible browser window, and the agent asks you to take over when a step needs a person, such as a one-time code or a CAPTCHA. **Annotate** marks up a picture of the page and sends it to the chat, a sign-in can be saved per environment in your system keychain, the agent can record a session as a GIF or a video, and Playwright traces replay in an editor tab. Every page and request is checked against **Settings > Browser > Sites**, a site no list names waits for you to allow it, and test-account passwords are typed into the page by name and never shown to the model. Tester mode saves each user journey it checks as a Playwright test under \`e2e/\` and reruns the saved journeys against each environment your team names. Turn the browser off with **Settings > Browser > Let the agent use a browser**.

**Memory.** The agent now saves what it learns as it works, and each memory it saves shows in the chat with **Undo**. Turn automatic saving off in **Settings > Memory**. \`/memory\` lists your memories, opens one and forgets one, a project's memories follow its git repository across clones and worktrees, and facts about you are kept once for every project. A memory that has not been confirmed for a long time, or that names files that are gone, is marked stale and counts for less.

**Inline edit.** Select some lines, press Ctrl+I (Cmd+I on macOS) and say what should change: the rewrite appears in place in the editor, with **Accept**, **Reject**, **Follow-up** and **Show diff** above it, and Reject puts the original lines back exactly. With nothing selected, the same keys write new code at the cursor. It works in remote windows and untitled editors too, and you choose its model under **Settings > Prompts > Inline Edit**. Nothing is sent from a file \`.nexgileignore\` covers or a file that looks like a secret.

**Commit messages.** **Generate Commit Message** in the Source Control view writes a message for your staged changes, or the unstaged ones when nothing is staged, into the commit box, following the repository's own style. Nothing is committed, staged or pushed for you, and ignored and sensitive files are sent by name only.

**Plan mode.** Architect mode is now Plan mode, reached with \`/plan\`, and anything saved under the old name keeps working. A finished plan opens in a preview beside the chat: select any part of it and comment, and each comment sits in the margin level with its text. **Review** sends all your comments at once and the agent presents the revised plan in the same tab. Nothing is implemented until you choose **Proceed**, at every autonomy level: a plan is never approved on your behalf. Plans are saved in the project's own folder, \`~/.nexgile/projects/<project>/plans\`, instead of in the repository.

**Spec mode.** Spec mode writes a change down before it is built: requirements, design and tasks in \`.nexgile/specs/<name>/\`, each reviewed with you in the plan preview before the next is written. The tasks run one at a time or in parallel through \`/batch\`, each checked with the command it names, and the correctness properties a design states become property-based tests whose failures come back with their smallest counterexample.

**Auto mode.** An opt-in reviewer can stand in for you on the approvals left once your settings, rules and hooks have decided: a second model, on a profile you choose, approves what fits what you asked for and blocks what does not. When it cannot decide, or its check fails, the prompt stays with you, and a fixed list of actions, such as deleting a critical folder, \`sudo\`, \`git push\` or deploying, always waits for you. Turn it on in **Settings > Auto-Approve > Auto mode**.

**Edit review and going back.** With **Settings > Checkpoints > Edit review** (off by default) you look at the agent's edits after they are written, put any file back, and can stop after each turn to accept or reject every change. **Restore Conversation Only** rewinds the chat and leaves your files as they are, and **Summarize up to here** and **Summarize from here** on a message free context while keeping the rest word for word.

**Offline security checks.** Every file the agent writes is scanned before the agent carries on: a high or critical finding goes back to the agent the way a compile error does, so it fixes what it just introduced, and everything else appears in the Problems panel. Files you save are scanned too, **Nexgile Code: Scan Workspace for Security Problems** scans every indexed folder, and Security mode starts from what the scanners found. \`/security-review\` reviews your changes, staged, unpushed or on a branch, with the same scanners and a reading of the diff, and fixes only when you ask. The checks use NxGraph's security rules and taint analysis, plus Opengrep, ast-grep, Betterleaks, OSV-Scanner, actionlint and zizmor from the Nexgile Security Pack extension. The scanners run with their network features switched off, and nothing is downloaded while they run.

**Safer with a cloned repository.** A repository's MCP servers start only after you approve them in **Review MCP servers**, a repository can no longer replace a built-in slash command such as \`/review\`, and a settings file can no longer approve a repository's hooks. Front matter in a repository's commands, skills and agents can no longer run code, text the agent reads, such as a file or a command's output, can no longer act as your message, and one click approves only the request it was shown on. The agent's file tools refuse to write inside a \`.git\` folder, and a shell command that writes a protected file or deletes the root, your home folder or the workspace always waits for you, however its path is written and whatever your auto-approval settings say. \`@problems\` and the diagnostics the agent is given leave out files \`.nexgileignore\` covers.

**Cortex runs on NxGraph.** Cortex's engine is now NxGraph 2.8.0. It reads a repository as services, apps and libraries, each service says what it does, and every Cortex tab names the service of its rows and can narrow to one service. It follows HTTP calls, gRPC calls, messages and background jobs from one service into the next, through gateways, Dapr and sagas, so explore, impact and flows cross service boundaries. Each entry's flows lead with the journeys that do real work, changes before lookups, and a click in a React or Blazor page is followed through its handlers to the request it sends. A new **Codemaps** tab answers a question about the code with a map of where it happens, in the order the code runs. HTML pages and templates are indexed too. Each project's index is built again the first time the project opens after this update, and Cortex settings start from their defaults once, so set them again in **Settings > Cortex**. The Cortex commands keep their titles but have new IDs, so a keybinding made for one of them needs to be set again. Every /batch task worktree can have a Cortex index of its own, and codebase search works in those worktrees too.

**Work that survives a reload.** Parallel subtasks and Agent Teams now survive a window reload: open the parent task from history and choose **Continue**, and every child resumes. Delegated sub-agents can work in git worktrees of their own, never touching your folder, and their changes are applied to your folder as uncommitted changes when the last one reports; a conflict waits for you. Commands left running in the background get a process id the agent can list, read and stop, and \`monitor\` tells the agent when a command it watches prints what it is waiting for. Workflow scripts can start child tasks, wait for them and combine their results in code, and a task can carry read scopes beside its write scopes.

**Notebooks and fast context.** The agent reads and edits Jupyter notebooks cell by cell, keeping every other cell's outputs, and runs a cell only when you turn on **Settings > Terminal > Let the agent run notebook cells**, asking each time. With **Settings > Providers > Model routing**, a "where is this code?" question can go to a fast, inexpensive model that returns file and line locations, and condensing and Cortex Ask can run on a cheaper profile too.

**Your other tools' setup.** Rules, skills, commands, agents and MCP servers kept for Claude Code, Cursor, Kiro and Windsurf are read from those tools' own files, and \`/import\` copies them into \`.nexgile/\`. Their MCP servers start only after you approve each one, and nothing in those files grants a permission. Rules can now say when they apply, such as only when the agent reaches a matching file or when you type \`/<name>\`, and a nested \`AGENTS.md\` arrives when the agent reaches its folder.

**Plugin bundles and hooks.** Install skills, slash commands, custom agents, MCP servers and hooks together from a GitHub repository, a git URL, a folder or a catalog, in **Settings > Plugins > Bundles** or with \`nexgile plugin install\`; a Claude Code plugin installs unchanged. Hooks can run for each file the agent creates, saves or deletes, can ask a model or give the agent an instruction without a command, and hooks written in Claude Code's format run as they are.

**JetBrains and Zed.** \`nexgile acp\` runs the full Nexgile agent in the chat of JetBrains IDEs and Zed over the Agent Client Protocol, asking the IDE before every command and file write.

**Problems.** **Send Problems to Nexgile** in the Problems view hands the workspace's errors and warnings to a new task, and the opt-in **Auto-fix new problems** keeps a task from finishing while files it edited still have errors it introduced.

**UI Designer preview.** Once UI Designer has written a design, a **Preview** button under the conversation opens it rendered in an editor tab, with Mobile, Tablet, Desktop and Fit widths. The design runs in a sandboxed frame that cannot reach the network or the disk.

**Every mode tested end to end.** All 31 built-in modes were reviewed, and every mode with a gap was run end to end against a real model; what that found is fixed. A question whose "yes" would commit, push, open or merge a pull request, deploy, apply a migration or delete data is now always an approval question, and never answers itself.

**Models.** Claude Sonnet 5.5 and Claude Haiku 5.5 can be picked on Anthropic, Amazon Bedrock, Google Vertex AI, OpenRouter and the Vercel AI Gateway, and GPT-6.1 Sol, Gemini 4 Argon and Mistral Large 4 (preview) are available too. Models their providers have retired, such as OpenAI o1, o3-mini and o4-mini, are hidden from the picker, and profiles that use them still load. DeepSeek usage outside DeepSeek's peak hours is costed at its off-peak prices, and long DeepSeek answers are no longer cut off at 8,192 tokens.

**Licence activation.** A licence now runs on one computer at a time. Activate this computer with your licence key, by signing in, or offline. Nexgile Code checks in about once a day and keeps working for 7 days without a connection, and **Settings > License** shows this computer, with **Check now** and **Deactivate**.

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
