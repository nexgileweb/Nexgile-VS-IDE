# Nexgile SAIC Code — IDE Capabilities

> **Product:** Nexgile SAIC Code
> **Application identifier:** `nexgile-code`
> **Data folder:** `~/.nexgile-code`
> **URL protocol:** `nexgile-code://`
> **Built on:** Visual Studio Code 1.111.0 (MIT) + Roo Code AI extension (Apache 2.0)
> **Document scope:** What the IDE can do out of the box, with primary focus on the bundled Nexgile Coding Agent.

---

## 1. Product Composition

Nexgile SAIC Code ships as a **single installable product** that bundles two co-branded components inside one binary:

| # | Component | Role | Upstream basis |
|---|---|---|---|
| 1 | **Nexgile Code IDE** | Desktop editor / workbench (Windows, macOS, Linux) | Microsoft Visual Studio Code |
| 2 | **Nexgile Code AI Extension** (`nexgile.nexgile-code` v3.6.23) | Built-in AI coding agent — pre-installed, cannot be uninstalled by the user; appears in the activity bar on first launch | Roo Code (Apache 2.0) |

The agent is bundled as a **built-in extension** via `product.json`, so installing the IDE installs the agent. There is no separate setup step. Together they present one unified user experience (chat in the secondary side bar, modes in the dropdown, settings under Nexgile Code).

This document treats the IDE + Agent as one product. The IDE shell capabilities (Section 2) are intentionally summarized; the bulk of the document covers the **agent capabilities** (Sections 3–11) since that is where the product's differentiated value lives.

---

## 2. IDE Shell Capabilities (foundation)

These come from the Visual Studio Code base and ship intact in Nexgile SAIC Code.

### 2.1 Editing & Navigation
- Multi-cursor editing, column selection, smooth scrolling, smooth caret animation, smooth blinking cursor — all enabled by default in the Nexgile preset.
- IntelliSense (completions, parameter hints, quick info), Go To Definition / Implementation / References, Peek, Symbol search, Outline view, Breadcrumbs.
- Bracket pair colorization and active bracket-pair guides — on by default.
- Font ligatures on, font size 13.5, line height 1.6, rounded selection — enterprise-tuned defaults baked into `product.json`.
- Minimap with always-visible slider, no character rendering (cleaner look).

### 2.2 Multi-Language Support (~70 languages out of the box)
Built-in extensions ship for: TypeScript / JavaScript, Python, C / C++, C#, Java, Go, Rust, Ruby, PHP, Swift, Kotlin (via Java), Dart, F#, VB, Clojure, CoffeeScript, Lua, Perl, R, Julia, Groovy, PowerShell, Shell, Bash, SQL, HTML, CSS / LESS / SCSS, JSON, XML, YAML, Markdown (with math), Dockerfile, .env, Makefile, INI, Pug, Razor, Handlebars, HLSL, ShaderLab, ABAP / COBOL / Delphi / Fortran / Assembly (via the agent's translation matrix), Mermaid, LaTeX, reStructuredText, Jupyter notebooks (`ipynb`), Objective-C.

### 2.3 Debugging
- Built-in DAP-based debugger UI (call stack, variables, watches, breakpoints, conditional / logpoint / function breakpoints).
- Microsoft `js-debug` and `js-debug-companion` are bundled — Node.js, Chrome, Edge, browser debugging works out of the box.
- JS profile-table viewer for CPU profiles.
- Auto-attach to child Node processes; debug-server-ready helper.

### 2.4 Integrated Terminal
- Multiple terminal instances, split panes, cwd-aware launch profiles, smooth scrolling.
- Shell integration (PowerShell, bash, zsh, fish) for command tracking, decorations, history.
- Terminal command suggestions extension (`terminal-suggest`) ships built-in.

### 2.5 Source Control
- Built-in Git provider: stage / unstage / commit, branches, merge, rebase, stash, diff, blame, file history, conflict resolution.
- GitHub extension and GitHub authentication built in (PR / issue work without extra install).
- Generic merge-conflict UI with three-way diff.

### 2.6 Workspace & Search
- Multi-root workspaces, workspace trust, file explorer, drag-and-drop, Quick Open (`Ctrl+P`), command palette (`Ctrl+Shift+P`).
- Project-wide search and replace with regex, glob include / exclude, search results view.
- File watching, hot-reload-friendly file change events.

### 2.7 Tasks & Notebooks
- `tasks.json` for build / test runners; problem matchers feed the Problems panel.
- Jupyter notebook editing via `ipynb` and notebook renderers.
- Markdown preview with math (`markdown-math`).

### 2.8 Extensibility
- Full VS Code Extension API. Compatible VSIX installs unmodified.
- **Marketplace:** uses the Visual Studio Marketplace (`marketplace.visualstudio.com`) as the extensions gallery — same extensions you have in VS Code, same publishers.
- Theme API, language API, debug API, task API, custom editor API, webview API, tree view API, comment API, file system provider API.

### 2.9 Remote & Tunnels
- Remote development via `nexgile-code-server` (server build).
- Tunnels via `nexgile-code-tunnel` and `nexgile-code-tunnelservice` (Windows mutex names reserved in `product.json`).
- Devcontainer support via the `.devcontainer/` flow.

### 2.10 Native Platform Integration (Windows)
- 64-bit and ARM64 user-setup installers (Inno Setup).
- "Open with Nexgile SAIC Code" Explorer shell context menu (registered CLSIDs in `product.json`).
- Windows AppUserModelId `Nexgile.NexgileCode` for taskbar pinning and jump lists.
- macOS bundle identifier `com.nexgile.code` (configurable for code-signing).
- Linux icon name `nexgile-code` (`.desktop` integration).

---

## 3. Coding Agent — Overview

The bundled `nexgile.nexgile-code` extension is the AI coding assistant. It exposes a **chat panel** (anchored in the secondary side bar by default — `auxiliaryBarExtensionContainers` in `product.json`), a **mode dropdown**, a **settings UI**, and a **project workspace** for transformation jobs.

> **Default IDE behavior:** Microsoft's stock chat / Copilot UI is **disabled** (`chat.disableAIFeatures: true` in `product.json`). The Nexgile agent is the canonical AI surface — there is no competing chat UI, ensuring a single, consistent assistant experience.

### 3.1 The chat surface
- Streaming chat with the active mode's system prompt.
- `@` mentions for files, folders, problems, terminal output, git commits, URLs, definitions.
- `/` slash commands (`/init`, `/new-task`, `/condense`, custom user-defined slash commands in `.nexgile/commands/`).
- Image attachments (drag-drop or paste — used as multi-modal model input).
- Inline approvals: every file edit, terminal command, MCP call, and browser action can require approval before it runs (configurable per tool family).
- Checkpoints: each tool action writes a checkpoint so the user can roll back any partial change without `git`.

---

## 4. Modes — How the Agent Specializes

Modes are pre-configured agent personas. Each mode has a **role definition**, a **whenToUse hint**, an **allowed tool group set** (read / edit / command / mcp), and optional **file-pattern restrictions**. Switching modes changes the system prompt and the tools the model can call.

### 4.1 Core built-in modes (7)

| Slug | Name | Purpose | Tool groups |
|---|---|---|---|
| `architect` | 🏗️ Architect | Plan, design, write specs / Mermaid diagrams before code is touched | read, edit (`*.md` only), mcp |
| `code` | 💻 Code | Everyday writing / modifying / refactoring code | read, edit, command, mcp |
| `ask` | ❓ Ask | Read-only Q&A and explanations | read, mcp |
| `debug` | 🪲 Debug | Systematic root-cause analysis (5–7 hypotheses → 1–2 → log to confirm → fix) | read, edit, command, mcp |
| `spec-bootstrap` | 📚 Spec Bootstrap | Generate a deeplink-strict wiki for a greenfield project | read, edit (`docs/`, `sources/`, `spec/`, `scripts/`, `.nexgilerules` only), command, mcp |
| `spec-sync` | 🔄 Spec Sync | Surgical updates to an existing wiki from new commits | same restricted edit set as Spec Bootstrap |
| `orchestrator` | 🪃 Orchestrator | Strategic delegation across modes, no direct tool use | none (delegates only) |

### 4.2 Workflow / verifier modes (3)

These exist to support **Workflow Mode** — a structurally-bounded, independently-verified pipeline. They are read-only on code (Tester / Reviewer cannot edit) so the implementer's reasoning never leaks into the verifier's verdict.

| Slug | Name | Purpose |
|---|---|---|
| `tester` | 🔬 Tester | Form an independent test plan from the requirement, run it, return a structured verdict |
| `reviewer` | 🔍 Reviewer | Read the diff for coverage / bugs / security / performance / conventions / compatibility |
| `shipper` | 🚀 Shipper | Stage listed files, commit, push to a feature branch (never main / master) |

### 4.3 Built-in project modes (21 specialists, ship in the VSIX)

Generated from `.nexgilemodes` + `.nexgile/rules-*` by `scripts/convert-project-modes-to-builtin.mjs` so they appear in every user's mode dropdown without a project-level config file:

`refactor`, `testgen`, `docgen`, `security`, `apimod`, `depupgrade`, `issue-fixer`, `pr-fixer`, `merge-resolver`, `docs-extractor`, `issue-investigator`, `issue-writer`, `db-migrator`, `db-architect`, `code-architect`, `devops`, `api-tester`, `code-reviewer`, `translate`, `ui-designer`, `dev`.

### 4.4 Nexgile transformation modes (the 7 work types)

Defined in `customizations/modes/*.md`, layered on top of the upstream Roo Code core. Each pairs with the Nexgile-specific tools (Section 5.4) and the FastAPI orchestration backend.

| Mode | What it does |
|---|---|
| **Code Translation** (`translate`) | Migrate code across 25+ languages (ABAP↔C#, COBOL→Java, Python→Go, etc.) using a 200+ entry translation matrix |
| **Refactor / Modernize** (`refactor`) | Same-language modernization: deprecated APIs, SOLID violations, monolith→microservices, error-handling modernization |
| **Test Generation** (`testgen`) | Auto-generate unit + integration tests targeting >80% coverage; auto-detects JUnit / xUnit / pytest / Jest / Vitest / Mocha / Go testing / RSpec / PHPUnit / cargo test / MockK |
| **Documentation** (`docgen`) | README, ARCHITECTURE.md, ADRs, inline comments, API docs, CHANGELOG entries, Mermaid diagrams |
| **Security Remediation** (`security`) | OWASP scan + fix: SQLi, XSS, deserialization, hardcoded secrets, weak crypto, missing validation, missing authn/authz, insecure HTTP, dependency CVEs |
| **API Modernization** (`apimod`) | SOAP→REST, WSDL→OpenAPI 3.0, REST modernization (versioning / pagination / error responses), client SDK generation, monolith→microservice boundaries |
| **Dependency Upgrade** (`depupgrade`) | One-at-a-time dependency upgrades across npm / Maven / pip / Cargo / go mod / Gemfile / composer with breaking-change handling and rollback plans |

### 4.5 Custom Agents — `.nexgile/agents/*.md`

Drop one Markdown file per custom agent into `<project>/.nexgile/agents/` (project-scoped, version-controlled) or `~/.nexgile/agents/` (global, all workspaces). YAML frontmatter is the schema; the body becomes the system prompt.

```markdown
---
slug: security-reviewer
name: 🔍 Security Reviewer
whenToUse: Use for security-focused review of changed files
description: Security-focused independent reviewer
groups:
    - read
    - command
---
You are an independent security reviewer...
```

- Slug optional — derived from filename if omitted.
- Project agents win over global agents on slug collision.
- The mode list **live-reloads** on add / change / delete — no IDE restart.
- File-pattern restrictions per group (e.g., `["edit", { fileRegex: "\\.md$" }]` to only edit Markdown).

### 4.6 Workflow Mode (3.2.0+)

Optional opt-in (Settings → Agent Workflow → Workflow Mode). Turns every task into a bounded pipeline:

1. **Implementer** writes the code (uses Code mode).
2. **Tester** independently forms a test plan from the requirement, runs it. Implementer's reasoning is not shared.
3. **Reviewer** independently reads the diff. Implementer's reasoning is not shared.
4. **You** confirm "Ship?" — the orchestrator never auto-pushes.
5. **Shipper** stages listed files, commits, pushes to a feature branch (never main / master).

Loops are structurally impossible: sub-tasks can only return control via `attempt_completion`; the orchestrator's only tools are delegation / escalation; the retry counter caps at 2 before escalating to the user.

---

## 5. Tools the Agent Can Call

Tools are organized into **groups**. A mode's `groups` list (and per-group file restrictions) determines what the model can use.

### 5.1 `read` group
- `read_file` — read a file with optional line ranges, indentation-aware reads (anchor line + max levels), or whole-file
- `search_files` — ripgrep-backed regex search with file-pattern filter
- `list_files` — directory listing, optional recursive
- `codebase_search` — **semantic** search powered by the code-index (Section 7)

### 5.2 `edit` group
- `apply_diff` — fuzzy-matched diff apply with similarity threshold and best-match recovery
- `write_to_file` — full-file write
- `generate_image` — produce images (e.g., diagrams, mockups) via image-capable providers
- Custom edit tools (opt-in via `customTools`):
  - `edit` — exact `old_string` → `new_string` with optional `replace_all`
  - `search_replace` — single-pair edit
  - `edit_file` — `old_string` → `new_string` with `expected_replacements` count to catch ambiguous edits
  - `apply_patch` — full unified-diff patch apply

### 5.3 `command` group
- `execute_command` — run a shell command in a Nexgile-managed terminal artifact, with optional `cwd` and `timeout`. Output is captured and indexable.
- `read_command_output` — page through a command's output by `artifact_id`, with `search` (grep-like), `offset`, `limit` for long-running or noisy logs.

### 5.4 `mcp` group
- `use_mcp_tool` — invoke a tool exposed by any connected MCP server with typed `arguments`.
- `access_mcp_resource` — fetch a resource by URI from a connected MCP server.

### 5.5 Always-available tools (in every mode)
- `ask_followup_question` — clarify with the user; supports follow-up suggestions (each can carry a target mode).
- `attempt_completion` — return a structured result from a sub-task.
- `switch_mode` — request a mode change with a reason.
- `new_task` — spawn a sub-task in a chosen mode with a message and optional todos.
- `new_parallel_tasks` — fan out multiple sub-tasks (`Array<{mode, message, todos?}>`).
- `update_todo_list` — maintain a TODO list visible in the UI.
- `run_slash_command` — invoke a registered slash command.
- `skill` — invoke a registered Skill (Section 9).

### 5.6 Nexgile-specific tools (overlay, in `customizations/tools/`)
- `nexgile_analyze` — analyze a source codebase against the 7 factor categories (Complexity, Code Quality, Documentation, Test Coverage, Review Level, Security, LLM Model) and return a multiplied effort factor.
- `nexgile_lookup` — look up entries in the Translation Matrix (200+ pairs), Lookups sheet, Scope Addons (19 items).
- `nexgile_translate` — chunked translation pipeline (analyze → translate → verify per file).
- `nexgile_verify` — verify translated / refactored output compiles or parses correctly in the target language.

### 5.7 Tool ergonomics
- **Tool repetition detector** — guards against tool loops.
- **Auto-approval** — per-tool-family trust toggles so trusted operations skip prompting.
- **Approval scope** — read may be auto-approved, edits manual, commands manual, MCP per-server.
- **Aliases** — model may call `write_file` (resolved to `write_to_file`) or `search_and_replace` (resolved to `edit`); aliases are preserved in conversation history for fidelity.

---

## 6. AI Provider Coverage (BYOK — Bring Your Own Key)

The agent is **model-agnostic**. Settings → Providers lets you configure any subset; the active provider is per-conversation. 30+ first-class providers are bundled:

| Family | Providers |
|---|---|
| Frontier US | OpenAI (incl. native + Codex), Anthropic, Anthropic Vertex, Google Gemini, Google Vertex AI, AWS Bedrock |
| OSS / open routing | OpenRouter, OpenAI-compatible (generic base URL + key), Vercel AI Gateway, Requesty, Unbound, Router Provider, LiteLLM |
| Fast / inference-optimized | Fireworks, Together (via OpenRouter), Baseten, Cerebras (via OpenRouter), DeepSeek, Mistral, Moonshot, Qwen Code, Z.AI, MiniMax |
| Local / on-prem | Ollama (native), LM Studio, VS Code Language Model API (uses the IDE's own LM, no external key) |
| Specialty | xAI (Grok), SambaNova, Poe, fake-ai (test harness) |

Capabilities surfaced per provider where supported: streaming, tool use / function calling, image input, cache control, prompt caching, model listing (with cached fetchers), cost reporting, context-window-aware truncation.

> **Telemetry note:** the IDE itself ships with `enableTelemetry: false`. The agent honors that and does not phone home about your prompts; provider calls go directly from your machine to the configured model endpoint with your own key.

---

## 7. Codebase Indexing & Semantic Search

`src/services/code-index/` is a self-contained code-indexing pipeline.

- **Tree-sitter parsers** for the supported source languages — produce structural chunks (functions, classes, methods) instead of line-windowed slices.
- **Embedders** abstract the vector model (Ollama, OpenAI, OpenAI-compatible, etc. — your choice).
- **Vector store** with incremental update on file change.
- Exposed to the model as the `codebase_search` tool — semantic intent queries return ranked code chunks with file paths and line ranges.
- Used internally for `@`-mention completion of symbols.

---

## 8. MCP (Model Context Protocol)

Full MCP client. Surfaces in `src/services/mcp/`:

- `McpHub` — multiplexes connections.
- `McpServerManager` — config-driven server lifecycle (`mcp.json`).
- `McpToolsCache` — caches tool / resource manifests so the LLM sees them instantly each turn.
- `builtInServers` — bundled servers (where applicable).
- Servers can be enabled per-mode (only `mcp`-group modes see them) or always-on.
- The IDE's `auxiliaryBarExtensionContainers` reserves the secondary side bar for the agent, leaving the primary side bar free for MCP-driven views.

---

## 9. Skills System

Skills are reusable prompt-and-tool bundles defined in `<project>/.nexgile/skills/<skill>/SKILL.md` (or globally in `~/.nexgile/skills/`).

- Invoked from chat via the `skill` tool or via slash commands.
- `skillInvocation.ts` handles parameter parsing and prompt loading.
- `SkillsManager.ts` discovers skills on workspace open and live-reloads.
- Bundled examples: `evals-context`, `nexgile-conflict-resolution`.

---

## 10. Marketplace (Agent-side)

`src/services/marketplace/` powers a **second marketplace inside the agent** (separate from the VS Code extension marketplace) that lets users discover and install:

- Custom modes from a curated catalog.
- Custom agents (`.nexgile/agents/*.md` shareables).
- MCP server configurations.
- Skill bundles.

This sits alongside the IDE's normal Visual Studio Marketplace integration — those continue to install regular VSIX extensions; the agent marketplace installs agent-layer artifacts.

---

## 11. Project Workspace, KPIs, and Reports (enterprise overlay)

The Nexgile overlay (`customizations/` + `webview-ui/src/nexgile/`) adds an **Enterprise project workspace** on top of the chat:

- Project / job manager — group transformation runs by client, repo, or initiative.
- Code analysis view — per-file confidence, factor multipliers, language family breakdown.
- Translation matrix browser — 200+ source/target pairs with effort multipliers.
- Progress view — chunked translation pipeline status per file.
- Audit / determinism reports — every model call, prompt, tool action, and edit is logged for reproducibility.
- KPI dashboard — coverage delta, CVE delta, files modernized, dependencies upgraded, breaking changes resolved.

The optional **FastAPI orchestration backend** (`backend/`) handles code analysis (tree-sitter), translation matrix lookups, transformation jobs, and audit logging. SQLite for MVP, PostgreSQL-ready. Local filesystem for artifacts, S3-ready. The IDE talks to it over plain HTTP — no Docker / Kubernetes required for development.

---

## 12. Branding & UX Customizations (vs vanilla VS Code)

| Layer | Customization |
|---|---|
| **Themes** | Three first-party themes ship in `extensions/nexgile-theme/`: **Nexgile Teal Dark** (default), **Nexgile Dark Enterprise** (WCAG AAA), **Nexgile Light Enterprise**. |
| **Glass effect** | `nexgile-glass.css` adds a subtle glass / backdrop-filter polish, contributed via the `css` API proposal — enabled in `product.json` `extensionEnabledApiProposals`. |
| **Font** | Inter Variable (regular + italic) shipped with the theme extension. |
| **Editor defaults** | Smooth scrolling, smooth caret animation, smooth blink, font ligatures, rounded selection, font size 13.5, line height 1.6, bracket-pair colorization, active bracket guides, smooth list scrolling. |
| **Layout default** | Secondary side bar visible by default — pre-positions the agent chat. |
| **App identity** | Application name `nexgile-code`, server `nexgile-code-server`, tunnel `nexgile-code-tunnel`, Windows mutex `nexgilecode`, URL protocol `nexgile-code://`. |
| **Documentation surface** | Documentation URL `docs.nexgile.com`, issue URL `github.com/nexgileweb/Nexgile-VS-IDE/issues`, download URL `nexgile.com/download`, license URL `nexgile.com/license`. |
| **Stock AI off** | Microsoft chat / Copilot UI disabled (`chat.disableAIFeatures: true`). |
| **Update channel** | `updateUrl` blank — IDE does not auto-update; releases are distributed by Nexgile. |
| **Built-in extension** | The Nexgile coding agent VSIX is bundled into `build/extensions/nexgile-code-3.6.23.vsix` and registered in `product.json` `builtInExtensions`. |

---

## 13. Security & Privacy Posture

- **Telemetry off by default** — `enableTelemetry: false` in `product.json`.
- **AI features off by default** at the IDE layer (`chat.disableAIFeatures`) — agent owns the AI surface.
- **BYOK** — model calls go from your machine to your provider with your key; Nexgile is not in the path.
- **Workspace trust** — VS Code's trust prompt gates auto-tasks, debug configs, and extension activation in untrusted folders.
- **Tool approvals** — every edit, command, and MCP call can require explicit approval; auto-approval is per-tool-family and off by default.
- **Mode file restrictions** — `architect`, `spec-bootstrap`, `spec-sync` cannot edit source files (only `.md` / `docs/` etc.) — model cannot break code from a planning mode.
- **Workflow Mode** — Tester and Reviewer cannot edit code; Shipper cannot push to main / master.
- **Checkpoints** — every tool action is captured; user can roll back without git.
- **`.rooignore` / `.nexgileignore`** — file-level access denials enforced by `src/core/ignore`.
- **MDM configuration** — `src/services/mdm` allows fleet-level policy (provider allow-lists, telemetry policy) for enterprise rollouts.
- **Auto-approval guardrails** — `src/core/auto-approval` keeps a kill-switch for destructive commands.

---

## 14. Build, Distribution, and Operations

| Aspect | Detail |
|---|---|
| Build runner | `.build-pipeline.ps1` — PowerShell, Windows-first |
| Required toolchain | Node 22.22.0 (per `.nvmrc`), Visual Studio Build Tools 2022 (VCTools + Spectre runtimes), Python 3.x, yarn 1.x, Inno Setup |
| Pipeline steps | `npm install` → `compile-build-without-mangling` → `compile-extensions-build` → `minify-vscode` → `vscode-win32-x64-min-ci` → `vscode-win32-x64-user-setup` |
| Output | `.build/win32-x64/user-setup/NexgileCodeUserSetup-x64-<version>.exe` |
| Build memory note | Mangler disabled because the full VS Code AST exceeds 12 GB on this fork; the `-without-mangling` variant trades ~10–15 % installer size for sub-12 GB peak RAM |
| CLI build (Rust) | `cli/` — Cargo workspace producing `nexgile-code` CLI |
| Server build | `out-vscode-min` for `nexgile-code-server` |
| Logs | `.build-log.txt` at repo root, timestamped per step |
| Repository | `github.com/nexgileweb/Nexgile-VS-IDE` (IDE), `github.com/nexgileweb/Nexgile-RC-CodingAgent` (agent) |

---

## 15. Out of Scope (intentionally not part of the user-facing product)

Listed here so reviewers don't expect them in the IDE UI:

- Pricing engine, deal summary, quote dashboard, P&L / margin / discount calculations — internal business operations only.
- Hosting tier, determinism package, turnaround multipliers — internal pricing parameters.
- Direct upstream extension publishing — Nexgile does not publish to the Visual Studio Marketplace under the Microsoft publisher name.

---

## 16. Capability Matrix (one-page summary)

| Capability area | Status |
|---|---|
| Editor / IntelliSense / debug / terminal / SCM | Full VS Code 1.111.0 parity |
| Languages | ~70 built-in extensions |
| Extensions marketplace | Visual Studio Marketplace |
| AI assistant | Bundled Nexgile Coding Agent (built-in) |
| AI providers | 30+ (BYOK) |
| Modes | 7 core + 3 verifier + 21 project-builtin + unlimited custom |
| Custom agents | Yes (`.nexgile/agents/*.md`, project + global, live reload) |
| Tools | read / edit / command / mcp / modes + 4 Nexgile-specific |
| MCP | Full client + per-mode gating |
| Code indexing | Tree-sitter + pluggable embedder + vector store |
| Skills | Yes (`SKILL.md`, slash + tool invocation) |
| Workflow Mode | Implementer → Tester → Reviewer → Shipper, structurally bounded |
| Checkpoints / rollback | Yes (per tool action) |
| Image input | Yes (multi-modal models) |
| Image generation | Yes (`generate_image` tool) |
| Translation matrix | 200+ language pairs, 25+ languages, 19 scope add-ons |
| Project workspace | Enterprise dashboard + KPIs + audit reports |
| Telemetry | Off by default |
| Auto-update | Disabled (Nexgile-distributed releases) |
| Platforms | Windows x64 / ARM64, macOS (Intel + Apple Silicon), Linux x64 / ARM64 |
| Remote / tunnels | Yes (`nexgile-code-server`, `nexgile-code-tunnel`) |

---

*This document describes capabilities that are present in Nexgile SAIC Code as built. Internal pricing, costing, and admin parameters are excluded by design — they are not part of the product surface.*
