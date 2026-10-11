/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

/*
 * Nexgile: Markdown previews open in the bundled Nexgile Code extension's preview.
 *
 * Nexgile Code has its own Markdown preview ("Nexgile Code: Open Preview"), where any part of
 * the document can be selected and commented on, and the comment is carried out. One product
 * should have one preview, so every way into this extension's preview hands a Markdown file on
 * disk to that one: the editor title button, the Explorer and editor tab context menus, the
 * Toggle Preview and Open Preview to the Side keybindings, and the Markdown: Open Preview
 * commands.
 *
 * What Nexgile Code's preview does not open stays here: an untitled or virtual document, a
 * Markdown file with another extension (.mkd, .mdown, ...), and every file while the Nexgile
 * Code extension is disabled or missing (Restricted Mode disables it, for example) or has no
 * licence key yet, since its commands only ask for the key until one is entered. If the
 * hand-off itself fails, this extension's preview opens as it always did.
 *
 * Both extensions put a preview button in the editor title bar. package.json hides this
 * extension's two buttons wherever Nexgile Code's button is shown and its preview takes the
 * file, using the context key set here and Nexgile Code's own `nexgile-code.licensed`; the
 * conditions there mirror `isNexgilePreviewable` and `isNexgilePreviewUsable` below.
 */

const nexgileExtensionId = 'nexgile.nexgile-code';
const nexgilePreviewCommand = 'nexgile-code.openMarkdownPreview';
const nexgileLicensedContextKey = 'nexgile-code.licensed';
const nexgilePreviewAvailableContextKey = 'markdown.nexgilePreviewAvailable';

/**
 * Whether Nexgile Code's preview opens `resource`: a `.md` or `.markdown` file on disk, the same
 * test its own command applies.
 */
function isNexgilePreviewable(resource: vscode.Uri): boolean {
	return resource.scheme === 'file' && /\.(md|markdown)$/i.test(resource.path);
}

/** Whether Nexgile Code is installed, enabled and licensed, so its preview command runs. */
async function isNexgilePreviewUsable(): Promise<boolean> {
	const extension = vscode.extensions.getExtension(nexgileExtensionId);
	if (!extension) {
		return false;
	}

	try {
		if (!extension.isActive) {
			await extension.activate();
		}
		// The workbench reads the context key for us (see `_nexgile.getContextKeyValue`).
		return await vscode.commands.executeCommand<unknown>('_nexgile.getContextKeyValue', nexgileLicensedContextKey) === true;
	} catch {
		return false;
	}
}

/**
 * Opens `resource` in Nexgile Code's preview.
 *
 * @returns `false`, having opened nothing, when that preview does not take `resource` or could
 * not be opened, so the caller opens its own preview instead.
 */
export async function openInNexgilePreview(resource: vscode.Uri | undefined): Promise<boolean> {
	if (!resource || !isNexgilePreviewable(resource) || !await isNexgilePreviewUsable()) {
		return false;
	}

	try {
		await vscode.commands.executeCommand(nexgilePreviewCommand, resource);
		return true;
	} catch {
		return false;
	}
}

/**
 * Keeps the `markdown.nexgilePreviewAvailable` context key in step with whether the Nexgile Code
 * extension is installed and enabled.
 */
export function registerNexgilePreviewContext(): vscode.Disposable {
	const update = () => {
		vscode.commands.executeCommand('setContext', nexgilePreviewAvailableContextKey, !!vscode.extensions.getExtension(nexgileExtensionId));
	};
	update();
	return vscode.extensions.onDidChange(update);
}
