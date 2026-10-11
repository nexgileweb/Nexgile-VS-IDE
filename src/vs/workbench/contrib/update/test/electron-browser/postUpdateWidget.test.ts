/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { $ } from '../../../../../base/browser/dom.js';
import { IHoverOptions, IHoverTarget } from '../../../../../base/browser/ui/hover/hover.js';
import { timeout } from '../../../../../base/common/async.js';
import { mock } from '../../../../../base/test/common/mock.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { CommandsRegistry, ICommandService } from '../../../../../platform/commands/common/commands.js';
import { TestConfigurationService } from '../../../../../platform/configuration/test/common/testConfigurationService.js';
import { IHoverService } from '../../../../../platform/hover/browser/hover.js';
import { ILayoutService } from '../../../../../platform/layout/browser/layoutService.js';
import { IMarkdownRendererService } from '../../../../../platform/markdown/browser/markdownRenderer.js';
import { IMeteredConnectionService } from '../../../../../platform/meteredConnection/common/meteredConnection.js';
import { IOpenerService } from '../../../../../platform/opener/common/opener.js';
import { IProductService } from '../../../../../platform/product/common/productService.js';
import { IStorageService } from '../../../../../platform/storage/common/storage.js';
import { ITelemetryService } from '../../../../../platform/telemetry/common/telemetry.js';
import { IHostService } from '../../../../services/host/browser/host.js';
import { PostUpdateWidgetContribution } from '../../browser/postUpdateWidget.js';
import { getNexgileUpdateInfo } from '../../common/nexgileReleaseNotes.js';

/** Records the feature titles of every tooltip shown, and disposes its content right away. */
class TestHoverService extends mock<IHoverService>() {
	readonly shown: string[][] = [];

	override showInstantHover(options: IHoverOptions): undefined {
		const content = options.content as HTMLElement;
		this.shown.push(Array.from(content.querySelectorAll('.feature-title'), title => title.textContent ?? ''));
		(options.target as IHoverTarget).dispose?.();
		return undefined;
	}
}

suite('PostUpdateWidgetContribution (Electron)', () => {
	const store = ensureNoDisposablesAreLeakedInTestSuite();

	function createContribution(isConnectionMetered: boolean, version = '1.141.0'): TestHoverService {
		const hoverService = new TestHoverService();
		const configurationService = new TestConfigurationService();
		store.add(configurationService.onDidChangeConfigurationEmitter);
		store.add(new PostUpdateWidgetContribution(
			new class extends mock<ICommandService>() { },
			configurationService,
			new class extends mock<IHostService>() {
				override hadLastFocus(): Promise<boolean> {
					return Promise.resolve(true);
				}
			},
			hoverService,
			new class extends mock<ILayoutService>() {
				override readonly mainContainer = $('div');
			},
			new class extends mock<IMarkdownRendererService>() {
				override render() {
					return { element: $('div'), dispose: () => { } };
				}
			},
			new class extends mock<IMeteredConnectionService>() {
				override readonly isConnectionMetered = isConnectionMetered;
			},
			new class extends mock<IOpenerService>() { },
			new class extends mock<IProductService>() {
				override readonly version = version;
				override readonly commit = 'current';
			},
			new class extends mock<IStorageService>() {
				override getObject<T>(): T | undefined {
					return { version: '1.123.4', commit: 'previous', timestamp: 0 } as T;
				}
				override store(): void { }
			},
			new class extends mock<ITelemetryService>() { },
		));
		return hoverService;
	}

	const nexgileHighlights = (JSON.parse(getNexgileUpdateInfo('1.141.0')!) as { features: { title: string }[] }).features.map(feature => feature.title);

	test('shows the highlights of Nexgile Code\'s own release notes after a version change when unmetered', async () => {
		const hoverService = createContribution(false);

		await timeout(0);

		assert.deepStrictEqual(hoverService.shown, [nexgileHighlights]);
	});

	test('skips the automatic tooltip while metered but preserves the explicit command', async () => {
		const hoverService = createContribution(true);

		await timeout(0);
		assert.deepStrictEqual(hoverService.shown, []);

		const command = CommandsRegistry.getCommand('_update.showUpdateInfo');
		assert.ok(command);
		await command.handler(undefined as never);
		assert.deepStrictEqual(hoverService.shown, [nexgileHighlights]);
	});

	test('shows nothing for a version without Nexgile Code release notes', async () => {
		const hoverService = createContribution(false, '1.135.0');

		await timeout(0);

		assert.deepStrictEqual(hoverService.shown, []);
	});
});
