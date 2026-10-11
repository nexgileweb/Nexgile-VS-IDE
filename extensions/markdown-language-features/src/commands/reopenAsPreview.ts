/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Command } from '../commandManager';
import { openInNexgilePreview } from '../preview/nexgilePreview';

export class ReopenAsPreviewCommand implements Command {
	public readonly id = 'markdown.reopenAsPreview';

	public async execute() {
		// Nexgile: a Markdown file on disk opens in Nexgile Code's preview instead (see nexgilePreview.ts).
		if (await openInNexgilePreview(vscode.window.activeTextEditor?.document.uri)) {
			return;
		}

		await vscode.commands.executeCommand('reopenActiveEditorWith', 'vscode.markdown.preview.editor');
	}
}

export class ReopenAsSourceCommand implements Command {
	public readonly id = 'markdown.reopenAsSource';

	public async execute() {
		await vscode.commands.executeCommand('reopenActiveEditorWith', 'default');
	}
}

export class TogglePreviewCommand implements Command {
	public readonly id = 'markdown.togglePreview';

	public async execute() {
		if (vscode.window.activeTextEditor) {
			// Nexgile: a Markdown file on disk opens in Nexgile Code's preview instead (see nexgilePreview.ts).
			if (await openInNexgilePreview(vscode.window.activeTextEditor.document.uri)) {
				return;
			}

			// In source editor, switch to preview
			await vscode.commands.executeCommand('reopenActiveEditorWith', 'vscode.markdown.preview.editor');
		} else {
			// In custom editor preview, switch to source
			await vscode.commands.executeCommand('reopenActiveEditorWith', 'default');
		}
	}
}
