/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Command } from '../commandManager';
import { openInNexgilePreview } from '../preview/nexgilePreview';
import { DynamicPreviewSettings, MarkdownPreviewManager } from '../preview/previewManager';
import { TelemetryReporter } from '../telemetryReporter';


interface ShowPreviewSettings {
	readonly sideBySide?: boolean;
	readonly locked?: boolean;
}

async function showPreview(
	webviewManager: MarkdownPreviewManager,
	telemetryReporter: TelemetryReporter,
	uri: vscode.Uri | undefined,
	previewSettings: ShowPreviewSettings,
): Promise<any> {
	let resource = uri;
	if (!(resource instanceof vscode.Uri)) {
		if (vscode.window.activeTextEditor) {
			// we are relaxed and don't check for markdown files
			resource = vscode.window.activeTextEditor.document.uri;
		}
	}

	if (!(resource instanceof vscode.Uri)) {
		if (!vscode.window.activeTextEditor) {
			// this is most likely toggling the preview
			return vscode.commands.executeCommand('markdown.showSource');
		}
		// nothing found that could be shown or toggled
		return;
	}

	const resourceColumn = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;

	// Nexgile: a Markdown file on disk opens in Nexgile Code's preview instead (see nexgilePreview.ts).
	if (await openInNexgilePreview(resource)) {
		return;
	}

	webviewManager.openDynamicPreview(resource, {
		resourceColumn: resourceColumn,
		previewColumn: previewSettings.sideBySide ? vscode.ViewColumn.Beside : resourceColumn,
		locked: !!previewSettings.locked
	});

	telemetryReporter.sendTelemetryEvent('openPreview', {
		where: previewSettings.sideBySide ? 'sideBySide' : 'inPlace',
		how: (uri instanceof vscode.Uri) ? 'action' : 'pallete'
	});
}

export class ShowPreviewCommand implements Command {
	public readonly id = 'markdown.showPreview';

	readonly #webviewManager: MarkdownPreviewManager;
	readonly #telemetryReporter: TelemetryReporter;

	public constructor(
		webviewManager: MarkdownPreviewManager,
		telemetryReporter: TelemetryReporter
	) {
		this.#webviewManager = webviewManager;
		this.#telemetryReporter = telemetryReporter;
	}

	public async execute(mainUri?: vscode.Uri, allUris?: vscode.Uri[], previewSettings?: DynamicPreviewSettings) {
		// Nexgile: one at a time, because Nexgile Code's preview is a single tab that moves to each
		// file it is given; in turn, it ends on the last file every time.
		for (const uri of Array.isArray(allUris) ? allUris : [mainUri]) {
			await showPreview(this.#webviewManager, this.#telemetryReporter, uri, {
				sideBySide: false,
				locked: previewSettings?.locked
			});
		}
	}
}

export class ShowPreviewToSideCommand implements Command {
	public readonly id = 'markdown.showPreviewToSide';

	readonly #webviewManager: MarkdownPreviewManager;
	readonly #telemetryReporter: TelemetryReporter;

	public constructor(
		webviewManager: MarkdownPreviewManager,
		telemetryReporter: TelemetryReporter
	) {
		this.#webviewManager = webviewManager;
		this.#telemetryReporter = telemetryReporter;
	}

	public execute(uri?: vscode.Uri, previewSettings?: DynamicPreviewSettings) {
		showPreview(this.#webviewManager, this.#telemetryReporter, uri, {
			sideBySide: true,
			locked: previewSettings?.locked
		});
	}
}


export class ShowLockedPreviewToSideCommand implements Command {
	public readonly id = 'markdown.showLockedPreviewToSide';

	readonly #webviewManager: MarkdownPreviewManager;
	readonly #telemetryReporter: TelemetryReporter;

	public constructor(
		webviewManager: MarkdownPreviewManager,
		telemetryReporter: TelemetryReporter
	) {
		this.#webviewManager = webviewManager;
		this.#telemetryReporter = telemetryReporter;
	}

	public execute(uri?: vscode.Uri) {
		showPreview(this.#webviewManager, this.#telemetryReporter, uri, {
			sideBySide: true,
			locked: true
		});
	}
}
