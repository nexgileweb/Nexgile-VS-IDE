# NEXGILE CODE — END USER LICENSE AGREEMENT

**Product:** Nexgile Code (the "Software")
**Licensor:** Nexgile ("Nexgile", "we", "us", or "our")
**Effective Date:** 2026-05-05
**Version:** 1.0

> **PLEASE READ THIS AGREEMENT CAREFULLY.** By downloading, installing, accessing, or using Nexgile Code, you ("you", "Licensee", or "User") agree to be bound by the terms of this End User License Agreement ("EULA" or "Agreement"). If you do not agree, do not install or use the Software. If you are entering into this Agreement on behalf of an entity, you represent that you have the authority to bind that entity, and "you" refers to that entity.

---

## 1. THE SOFTWARE

"Nexgile Code" is delivered as a single installable product that bundles two co-branded components:

| # | Component | What it is | Underlying open-source basis |
|---|---|---|---|
| 1.1 | **Nexgile Code IDE** | A desktop code editor and developer workbench (Windows, macOS, Linux). The application binary registers itself as `nexgile-code` and stores user data under `.nexgile-code`. | Microsoft Visual Studio Code (MIT License) |
| 1.2 | **Nexgile Code AI Extension** | An AI coding assistant pre-installed inside the IDE as the built-in extension `nexgile.nexgile-code`. Provides chat, code transformation modes (API modernization, dependency upgrade, documentation generation, refactor, security review, test generation, translate), Custom Modes, Custom Agents, MCP server support, and a Bring-Your-Own-Key (BYOK) connection to third-party AI model providers. | Roo Code by Roo Code, Inc. (Apache License 2.0) |

The Software also includes Nexgile-authored additions that are **not** present in either upstream project, including without limitation: Nexgile branding, icons, themes, color schemes, marketing strings, the Enterprise project workspace and dashboard, KPI tracking, transformation reports, the Plan-First workflow, the optional Nexgile FastAPI orchestration backend, additional AI provider integrations, the rebranded configuration surface (`.nexgile/`, `.nexgilemodes`, `.nexgilerules`), the Windows installer (`NexgileCodeSetup`), and the Nexgile build pipeline (collectively, the **"Nexgile Additions"**).

---

## 2. LICENSE GRANT

Subject to your continuing compliance with this Agreement, Nexgile grants you a **non-exclusive, non-transferable, worldwide, royalty-free, revocable** license to:

1. Install and use the Software on any number of devices that you own or control, for personal, internal business, commercial, or evaluation purposes;
2. Make a reasonable number of copies of the Software solely for backup and archival purposes; and
3. Use the Software's output, including code generated, transformed, refactored, translated, documented, or otherwise produced through the AI features, for any lawful purpose, subject to Section 6 (Artificial Intelligence Features).

This Section 2 grants only the rights expressly stated. All rights not expressly granted are reserved by Nexgile and the applicable upstream licensors.

---

## 3. RELATIONSHIP TO OPEN-SOURCE LICENSES

Nexgile Code is a derivative work of permissively-licensed open-source software, and this Agreement is **layered on top of** — and does **not** override or revoke — the rights you receive under those upstream licenses for the upstream code itself.

### 3.1 Microsoft VS Code (MIT License)
Portions of the Nexgile Code IDE are derived from Microsoft Visual Studio Code, Copyright (c) 2015 — present Microsoft Corporation, used under the MIT License. The complete MIT License text is reproduced in the file `LICENSE.txt` at the root of this distribution. Your rights under the MIT License with respect to the unmodified upstream Microsoft VS Code source code are not diminished by this Agreement.

### 3.2 Roo Code (Apache License 2.0)
The Nexgile Code AI Extension is a derivative work of Roo Code, Copyright (c) Roo Code, Inc., used under the Apache License, Version 2.0. The complete Apache 2.0 license text and modification notice are included with the AI extension distribution (see `LICENSE` and `NOTICE` shipped inside the `nexgile.nexgile-code` extension). Your rights under the Apache 2.0 License with respect to the upstream Roo Code source code are not diminished by this Agreement, including the rights to copy, modify, sublicense, and distribute the upstream code subject to the Apache 2.0 terms.

### 3.3 Nexgile Additions
The **Nexgile Additions** (defined in Section 1) are licensed to you on the terms of this EULA. Nexgile retains ownership of the Nexgile Additions and the trademarks "Nexgile" and "Nexgile Code". To the extent the Nexgile Additions constitute Nexgile's "modifications" to the Apache-2.0-licensed upstream, the Apache 2.0 License (Section 4) expressly permits Nexgile to apply additional terms to such modifications, which Nexgile does through this EULA. Nothing in this Agreement is intended to or shall restrict the rights granted to you under the Apache 2.0 License or the MIT License with respect to the upstream code.

### 3.4 Other Third-Party Components
The Software bundles and depends on additional open-source components, each under its own license (including, without limitation, the Microsoft built-in extensions for JavaScript debugging — `ms-vscode.js-debug`, `ms-vscode.js-debug-companion`, and `ms-vscode.vscode-js-profile-table` — and numerous npm packages listed in the project `package.json` and `node_modules` directory). Use of those components is governed by their respective licenses, copies of which are distributed with the Software or are available from the upstream sources.

### 3.5 Conflict
If any term of this EULA conflicts with a term of an applicable open-source license **as it applies to the corresponding upstream code**, the open-source license controls for that upstream code. This EULA controls for the Nexgile Additions and for the integrated, branded distribution as a whole.

---

## 4. RESTRICTIONS

You shall not, and shall not permit any third party to:

1. Remove, alter, or obscure any copyright, trademark, attribution, or other proprietary notice in the Software, the `LICENSE.txt`, the `NOTICE` file, or the in-product "About" dialog;
2. Use the Nexgile name, "Nexgile", "Nexgile Code", logos, icons, or trade dress to falsely imply endorsement, sponsorship, or affiliation, or in any way that violates Section 11 (Trademarks);
3. Re-distribute the Software in a manner that strips, replaces, or otherwise misrepresents the attribution to Microsoft Corporation (for the MIT-licensed VS Code basis) or to Roo Code, Inc. (for the Apache-2.0-licensed Roo Code basis);
4. Use the Software in any application or environment where failure of the Software could reasonably be expected to lead to death, personal injury, or severe physical or environmental damage, including without limitation life-support systems, nuclear facility operation, aircraft navigation or communication, weapons systems, or real-time control of safety-critical industrial processes;
5. Use the Software in violation of any applicable law, regulation, sanctions program, or third-party right; or
6. Use the AI features of the Software to generate, transmit, or knowingly facilitate the generation of malware, code intended for unauthorized intrusion, child sexual abuse material, illegal harassment, or other content prohibited by applicable law or by the relevant AI provider's terms of service.

---

## 5. UPDATES, VERSIONS, AND RELEASE QUALITY

5.1 The Software is currently distributed without an automatic update channel (the IDE's `updateUrl` is configured as empty). New versions are made available through the official Nexgile download channel at https://nexgile.com/download. You are responsible for installing updates.

5.2 Some features may be marked as preview, beta, or experimental (including, by way of example, the structurally-bounded **Workflow Mode** that orchestrates Implementer, Tester, Reviewer, and Shipper sub-agents). Preview features may be changed or removed without notice and are provided AS IS for evaluation purposes.

---

## 6. ARTIFICIAL INTELLIGENCE FEATURES

The Software includes AI-powered features that interact with third-party Large Language Model ("LLM") providers. **You must read and understand this Section 6 before enabling AI features.**

### 6.1 Bring Your Own Key (BYOK)
Nexgile Code does **not** bundle an AI subscription. To use AI features you must configure credentials for one or more supported third-party LLM providers, which include without limitation: OpenAI, Anthropic, Google Vertex AI, xAI, MiniMax, Poe, OpenRouter, Qwen, and Ollama (for locally-hosted models). Your contractual relationship with each provider — including pricing, usage limits, acceptable use policies, and data handling — is governed by **that provider's own agreements**, not this EULA.

### 6.2 Local Storage of Credentials
API keys and similar credentials that you enter into the Software are stored locally on your device (typically in the operating system's secret store or in user configuration files). Nexgile does not collect, transmit, or store your credentials.

### 6.3 What Is Sent to AI Providers
When you invoke an AI feature, the Software transmits to your configured AI provider, **directly from your machine**, the input necessary to fulfill your request, which may include: your prompt, selected files or excerpts, surrounding code context, command output, project metadata, custom mode definitions, and prior chat turns within the current session. **Nexgile does not operate a proxy and does not receive, log, or store this content.**

### 6.4 Output Is Provided AS IS — No Warranty of Correctness, Originality, or Safety
AI outputs (including generated code, refactorings, translations, tests, documentation, security recommendations, dependency upgrade plans, commit messages, and explanations) are statistical and probabilistic in nature. They may be **incorrect, incomplete, biased, insecure, non-performant, non-compilable, or infringing on third-party intellectual property rights**. You are solely responsible for:

- Reviewing every AI output before relying on it;
- Verifying functional correctness through compilation, testing, and human review appropriate to the risk;
- Determining the legal, security, licensing, and ethical appropriateness of using any AI output, especially before incorporation into production systems or distribution to third parties; and
- Independently confirming that any code, library, snippet, or pattern produced by the AI does not infringe third-party intellectual property rights and complies with the licenses of any code your AI provider may have learned from.

The disclaimers in this Section 6.4 are in addition to, and not in lieu of, the broader disclaimers in Sections 12 and 13.

### 6.5 Agentic Behavior, Tool Use, and Auto-Approval
The AI Extension can be configured to autonomously execute tools that have side effects, including: reading and writing files in your workspace, running shell commands, invoking MCP (Model Context Protocol) servers, staging Git changes, creating commits, and pushing branches. The Workflow Mode "Shipper" role, when enabled, may stage listed files, commit, and push to a feature branch — by design it never pushes to `main` or `master`. **You are responsible for reviewing the auto-approval and permission settings in the AI Extension before enabling them**, and for ensuring that the workspace, repositories, and credentials made accessible to the AI are appropriately scoped. Nexgile is not liable for losses arising from agentic actions you have authorized the Software to perform.

### 6.6 Custom Modes, Custom Agents, and MCP Servers
The Software allows you to install Custom Modes, Custom Agents (defined in `.nexgile/agents/*.md`), and to connect to third-party MCP servers. Such third-party content is **not provided, vetted, or supported by Nexgile**. You assume all risk of installing and running third-party agent definitions, mode definitions, and MCP servers, including the risk of prompt injection, malicious tool calls, and exposure of workspace data.

### 6.7 Optional Nexgile FastAPI Backend
Some advanced features may, at your option, require running an optional self-hosted Nexgile FastAPI orchestration backend (which may proxy LLM calls via LiteLLM and persist transformation jobs in SQLite or PostgreSQL). This backend is **deployed and operated by you**, on infrastructure you control. Nexgile does not host this backend on your behalf unless covered by a separate written agreement.

---

## 7. PRIVACY AND TELEMETRY

### 7.1 Privacy Policy
Nexgile's Privacy Policy is incorporated by reference and is available at https://nexgile.com/privacy and (for the AI Extension) in the `PRIVACY.md` file shipped with the extension.

### 7.2 Telemetry — Off by Default in the IDE
Telemetry in the Nexgile Code IDE is **disabled by default** (`product.json` sets `enableTelemetry: false`). The Software is configured to suppress the upstream Microsoft VS Code telemetry endpoints. You may verify this in the Software's settings.

### 7.3 AI Extension Telemetry — Opt-In
Telemetry collection in the AI Extension, if any, is opt-in and may be disabled at any time in the extension's settings. When enabled, telemetry collects anonymous feature-usage and error data and explicitly **does not collect** personally identifiable information, your source code, or your AI prompts.

### 7.4 Local Data
The Software stores configuration, chat history, task history, custom modes, and similar working data in user-data directories on your device (e.g., `.nexgile-code` for the IDE, and `.nexgile/` and per-user extension storage for the AI Extension). Nexgile does not have access to this data.

### 7.5 Code Sent to AI Providers
For clarity and consistency with Section 6.3: when you use AI features, content is sent **directly from your device to the AI provider you configured**, not to Nexgile.

---

## 8. NEXGILE EXTENSIONS MARKETPLACE AND THIRD-PARTY EXTENSIONS

The Software is configured to retrieve extensions from a third-party extensions gallery service (currently the Microsoft Visual Studio Marketplace endpoint, as configured in `product.json` `extensionsGallery`). Use of that gallery and any extension you install from it is subject to the terms of the gallery operator and of the extension publisher. Nexgile does not author, vet, or warrant third-party extensions, including those installed from `.vsix` files. You assume all risk of installing third-party extensions.

---

## 9. OWNERSHIP AND INTELLECTUAL PROPERTY

9.1 The Software (including the Nexgile Additions) is **licensed, not sold**.

9.2 As between you and Nexgile, **Nexgile owns** all right, title, and interest in and to the Nexgile Additions, the Nexgile name, the Nexgile Code product name, the Nexgile logos, icons, themes, and trade dress. Microsoft Corporation owns all right, title, and interest in and to the unmodified Microsoft VS Code source code; Roo Code, Inc. owns all right, title, and interest in and to the unmodified Roo Code source code. Other open-source components are owned by their respective contributors.

9.3 As between you and Nexgile, **you own** the source code, configuration files, prompts, custom modes, custom agents, and other inputs you author and provide to the Software, and you own the AI outputs the Software returns to you (subject to the rights of the underlying AI providers and any third-party rights that may apply to the output content). Nexgile claims no ownership over your code or your AI-generated outputs.

9.4 You may submit feedback, suggestions, or bug reports to Nexgile via the channels in Section 17. You grant Nexgile a perpetual, irrevocable, worldwide, royalty-free license to use such feedback for any purpose, with no obligation of confidentiality, attribution, or compensation.

---

## 10. THIRD-PARTY OBLIGATIONS PASSED THROUGH

Because the Software is a derivative of MIT-licensed and Apache-2.0-licensed upstreams, certain notices must be preserved when you redistribute the Software:

10.1 You must retain a copy of the MIT License (in `LICENSE.txt`) and the copyright notice "Copyright (c) 2015 — present Microsoft Corporation" with any redistribution that includes Microsoft VS Code-derived code.

10.2 You must retain a copy of the Apache License 2.0 and the `NOTICE` file shipped with the AI Extension with any redistribution that includes Roo Code-derived code, and you must give recipients a copy of the Apache 2.0 License as required by Apache 2.0 §4.

10.3 If you distribute a modified version of the Software, you must comply with the modification-marking and notice-preservation requirements of the applicable upstream license (Apache 2.0 §4(b)–(d) and the MIT notice retention requirement).

10.4 Re-distribution of the **integrated branded "Nexgile Code" product** as a whole — including the Nexgile name, logos, installer, and Nexgile Additions — requires Nexgile's prior written permission. Nothing in this Section 10 is a permission to use the Nexgile trademarks; see Section 11.

---

## 11. TRADEMARKS

"Nexgile" and "Nexgile Code" are trademarks of Nexgile. This Agreement does not grant you any right to use the Nexgile trademarks, except for fair, nominative use to identify the Software (for example, in a true statement that your project uses Nexgile Code). The MIT and Apache 2.0 licenses do not grant trademark rights, and nothing in those licenses or in this Agreement permits you to use the Microsoft, Visual Studio Code, or Roo Code trademarks except as permitted under the trademark policies of their respective owners.

---

## 12. DISCLAIMER OF WARRANTIES

THE SOFTWARE AND ALL AI OUTPUTS, MODELS, AND TOOLS PROVIDED OR MADE AVAILABLE THROUGH OR IN CONNECTION WITH THE SOFTWARE ARE PROVIDED **"AS IS"** AND **"AS AVAILABLE"**, WITHOUT WARRANTY OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NEXGILE AND ITS LICENSORS, CONTRIBUTORS, AND SUPPLIERS EXPRESSLY DISCLAIM ALL WARRANTIES, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTY OF:

- MERCHANTABILITY,
- FITNESS FOR A PARTICULAR PURPOSE,
- TITLE,
- NON-INFRINGEMENT,
- ACCURACY, COMPLETENESS, OR CORRECTNESS OF AI OUTPUT,
- UNINTERRUPTED, SECURE, OR ERROR-FREE OPERATION, AND
- THAT DEFECTS WILL BE CORRECTED.

YOU ASSUME ALL RISK OF USING THE SOFTWARE, INCLUDING WITHOUT LIMITATION THE RISK OF INTELLECTUAL PROPERTY INFRINGEMENT, CYBER VULNERABILITIES OR ATTACKS, BIAS, INACCURACIES, ERRORS, DEFECTS, MALWARE, DOWNTIME, PROPERTY LOSS OR DAMAGE, AND/OR PERSONAL INJURY ARISING FROM YOUR USE OF THE SOFTWARE OR ITS OUTPUTS. THE SOFTWARE IS NOT DESIGNED OR INTENDED FOR USE IN HAZARDOUS ENVIRONMENTS REQUIRING FAIL-SAFE PERFORMANCE.

---

## 13. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL NEXGILE, ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, CONTRIBUTORS, OR LICENSORS BE LIABLE FOR ANY:

(A) INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES;
(B) LOSS OF PROFITS, REVENUE, GOODWILL, BUSINESS, USE, DATA, CODE, OR OTHER INTANGIBLE LOSSES;
(C) COST OF SUBSTITUTE GOODS OR SERVICES;
(D) DAMAGES FOR PERSONAL INJURY OR PROPERTY DAMAGE;
(E) DAMAGES ARISING FROM AI-GENERATED OUTPUTS, INCLUDING DAMAGES ARISING FROM THE USE, MISUSE, INACCURACY, OR INSECURITY OF SUCH OUTPUTS; OR
(F) DAMAGES ARISING FROM AGENTIC ACTIONS THE SOFTWARE TAKES ON YOUR BEHALF (INCLUDING, WITHOUT LIMITATION, FILE WRITES, SHELL COMMANDS, GIT OPERATIONS, MCP TOOL CALLS, AND OTHER AUTHORIZED TOOL USE);

ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT OR THE SOFTWARE, EVEN IF NEXGILE HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, AND REGARDLESS OF THE LEGAL THEORY (CONTRACT, TORT INCLUDING NEGLIGENCE, STATUTE, OR OTHERWISE).

NOTWITHSTANDING ANYTHING TO THE CONTRARY, NEXGILE'S AGGREGATE LIABILITY ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT OR THE SOFTWARE SHALL NOT EXCEED THE GREATER OF (I) THE FEES YOU PAID TO NEXGILE FOR THE SOFTWARE IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (II) ONE HUNDRED U.S. DOLLARS (USD $100).

THE LIMITATIONS IN THIS SECTION 13 ARE FUNDAMENTAL ELEMENTS OF THE BARGAIN BETWEEN YOU AND NEXGILE AND APPLY EVEN IF ANY LIMITED REMEDY FAILS OF ITS ESSENTIAL PURPOSE. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES; IN SUCH JURISDICTIONS, THE LIABILITY OF NEXGILE IS LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.

---

## 14. INDEMNIFICATION

You agree to defend, indemnify, and hold harmless Nexgile and its affiliates, officers, employees, agents, contributors, and licensors from and against any and all claims, damages, liabilities, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) your use of the Software in violation of this Agreement or applicable law; (b) your use of, or reliance on, AI-generated outputs; (c) any agentic actions you authorized the Software to perform on your behalf; (d) your violation of any third party's rights, including any intellectual property right or privacy right; or (e) content, custom modes, custom agents, MCP servers, or extensions you introduce into the Software.

---

## 15. EXPORT CONTROLS AND SANCTIONS

You may not use, export, re-export, transfer, or download the Software in violation of U.S., Indian, EU, U.K., or other applicable export control laws or sanctions programs. You represent that you are not located in, under the control of, or a national or resident of any country, or on any list of restricted parties, to which such export is prohibited.

---

## 16. TERM AND TERMINATION

16.1 This Agreement is effective from the moment you first install or use the Software and continues until terminated.

16.2 This Agreement terminates automatically and immediately if you breach any of its terms, without notice from Nexgile.

16.3 Upon termination, you must cease all use of the Software and destroy all copies in your possession or control. Sections 3 (to the extent of preserving upstream rights you continue to enjoy under MIT/Apache 2.0), 4, 9, 10, 11, 12, 13, 14, 15, 16.3, 17, and 18 survive termination.

16.4 Termination of this Agreement does not terminate your separate rights under the upstream MIT and Apache 2.0 licenses with respect to the upstream code, which continue per their own terms.

---

## 17. SUPPORT, NOTICES, AND CONTACT

The Software is provided without an obligation of support except as Nexgile may separately agree in writing. Best-effort community support is available via:

- Website: https://nexgile.com
- Documentation: https://docs.nexgile.com
- Support email: support@nexgile.com
- IDE issue tracker: https://github.com/nexgileweb/Nexgile-VS-IDE/issues
- AI Extension issue tracker: https://github.com/nexgileweb/Nexgile-RC-CodingAgent/issues
- Security disclosure: https://github.com/nexgileweb/Nexgile-RC-CodingAgent/security/advisories/new (preferred) or support@nexgile.com

Notices to Nexgile under this Agreement shall be sent to **support@nexgile.com**.

---

## 18. GENERAL

**18.1 Governing Law.** This Agreement is governed by and construed in accordance with the laws of the State of Delaware, United States of America, without regard to its conflict-of-laws principles. The U.N. Convention on Contracts for the International Sale of Goods does not apply.

**18.2 Venue.** The parties consent to the exclusive jurisdiction of the state and federal courts located in New Castle County, Delaware, United States of America, for any dispute arising out of or relating to this Agreement, and waive any objection to such venue on the grounds of inconvenient forum or otherwise; provided, however, that Nexgile may seek injunctive or other equitable relief in any court of competent jurisdiction to protect its intellectual property or confidential information.

**18.3 Severability.** If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions remain in full force and effect, and the invalid provision shall be replaced by an enforceable provision that most closely approximates the original intent.

**18.4 No Waiver.** No failure or delay by Nexgile in exercising any right under this Agreement constitutes a waiver of that right.

**18.5 Assignment.** You may not assign this Agreement, by operation of law or otherwise, without Nexgile's prior written consent. Nexgile may freely assign this Agreement. Any prohibited assignment is void.

**18.6 Entire Agreement.** This Agreement, together with the upstream open-source license texts referenced herein, the `NOTICE` file, and the Privacy Policy, constitutes the entire agreement between you and Nexgile concerning the Software, and supersedes all prior or contemporaneous communications, proposals, and representations on its subject matter. In the event of a conflict between this Agreement and any non-disclosure agreement, master subscription agreement, or order form separately executed in writing between you and Nexgile, the separately executed agreement controls for its subject matter.

**18.7 Modifications.** Nexgile may revise this Agreement from time to time. Material changes will be reflected by an updated **Effective Date** at the top of this document and, where practical, an in-product notice. Your continued use of the Software after the Effective Date of a revised Agreement constitutes your acceptance of the revised terms.

**18.8 Headings.** Section headings are for convenience only and have no legal effect.

**18.9 No Third-Party Beneficiaries.** Other than Nexgile's affiliates, contributors, and licensors as expressly named in Sections 12, 13, and 14, this Agreement does not create any third-party beneficiary rights.

---

## ATTRIBUTION SUMMARY

Nexgile Code includes software developed by:

- **Microsoft Corporation** — Visual Studio Code (MIT License). Copyright © 2015 — present Microsoft Corporation. https://github.com/microsoft/vscode
- **Roo Code, Inc.** — Roo Code (Apache License 2.0). Copyright © 2025 Roo Code, Inc. https://github.com/RooCodeInc/Roo-Code
- The numerous individual and corporate contributors of the third-party open-source dependencies bundled with the Software, each retaining their respective copyrights and licenses.

The use of the names "Microsoft", "Visual Studio Code", and "Roo Code" is solely to identify the upstream projects from which Nexgile Code is derived and does not imply endorsement, sponsorship, or affiliation by their respective owners.

---

**© 2026 Nexgile. All rights reserved (subject to the open-source rights described above).**

---