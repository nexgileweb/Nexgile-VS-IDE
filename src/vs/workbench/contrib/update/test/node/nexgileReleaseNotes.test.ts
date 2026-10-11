/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import product from '../../../../../platform/product/common/product.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../base/test/common/utils.js';
import { getNexgileReleaseNotes, getNexgileUpdateInfo } from '../../common/nexgileReleaseNotes.js';
import { parseUpdateInfoInput } from '../../common/updateInfoParser.js';

// Runs with the repository's package.json version (see test/unit/node/index.js), so moving the
// product onto a new VS Code base without writing its release notes fails here.
suite('Nexgile Code release notes', () => {
	ensureNoDisposablesAreLeakedInTestSuite();

	test('this build has release notes and update highlights for its own version', () => {
		const notes = getNexgileReleaseNotes(product.version);
		const info = parseUpdateInfoInput(getNexgileUpdateInfo(product.version) ?? '');

		assert.deepStrictEqual({
			heading: notes?.split('\n', 1)[0].startsWith('# Nexgile Code '),
			highlightsSection: notes?.includes('\n## Release highlights\n'),
			highlights: info.features?.length,
			highlightsListed: info.features?.every(feature => notes?.includes(`- **${feature.title}**: ${feature.description}`)),
			mentionsVSCodeReleaseNotesSite: notes?.includes('code.visualstudio.com'),
		}, {
			heading: true,
			highlightsSection: true,
			highlights: 5,
			highlightsListed: true,
			mentionsVSCodeReleaseNotesSite: false,
		}, `Nexgile Code ${product.version} has no release notes: add its VS Code base to nexgileReleaseNotes.ts`);
	});

	test('a patch release shares its base\'s notes, and another base has none', () => {
		assert.deepStrictEqual({
			patch: getNexgileReleaseNotes('1.141.7') === getNexgileReleaseNotes('1.141.0'),
			otherBase: getNexgileReleaseNotes('1.123.4'),
			otherBaseInfo: getNexgileUpdateInfo('1.123.4'),
			notAVersion: getNexgileReleaseNotes('dev'),
		}, {
			patch: true,
			otherBase: undefined,
			otherBaseInfo: undefined,
			notAVersion: undefined,
		});
	});
});
