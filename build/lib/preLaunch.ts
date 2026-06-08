/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import path from 'path';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const rootDir = path.resolve(import.meta.dirname, '..', '..');
const sqliteDir = path.join(rootDir, 'node_modules', '@vscode', 'sqlite3');

function runProcess(command: string, args: ReadonlyArray<string> = []) {
	return new Promise<void>((resolve, reject) => {
		const child = spawn(command, args, { cwd: rootDir, stdio: 'inherit', env: process.env, shell: process.platform === 'win32' });
		child.on('exit', err => !err ? resolve() : process.exit(err ?? 1));
		child.on('error', reject);
	});
}

async function exists(subdir: string) {
	try {
		await fs.stat(path.join(rootDir, subdir));
		return true;
	} catch {
		return false;
	}
}

async function ensureNodeModules() {
	if (!(await exists('node_modules'))) {
		await runProcess(npm, ['ci']);
	}
}

async function patchWindowsSqliteGypFiles() {
	if (process.platform !== 'win32') {
		return;
	}

	const patches = [
		{
			file: path.join(sqliteDir, 'binding.gyp'),
			pattern: /\r?\n\s*"msvs_configuration_attributes": \{\r?\n\s*"SpectreMitigation": "Spectre"\r?\n\s*\},/,
		},
		{
			file: path.join(sqliteDir, 'deps', 'sqlite3.gyp'),
			pattern: /\r?\n\s*'msvs_configuration_attributes': \{\r?\n\s*'SpectreMitigation': 'Spectre'\r?\n\s*\},/,
		},
	];

	for (const { file, pattern } of patches) {
		const contents = await fs.readFile(file, 'utf8');
		const updated = contents.replace(pattern, '');
		if (updated !== contents) {
			await fs.writeFile(file, updated);
		}
	}
}

async function ensureSqliteNativeBinding() {
	if (!(await exists(path.join('node_modules', '@vscode', 'sqlite3')))) {
		return;
	}

	if (await exists(path.join('node_modules', '@vscode', 'sqlite3', 'build', 'Release', 'vscode-sqlite3.node'))) {
		return;
	}

	await patchWindowsSqliteGypFiles();
	await runProcess(npm, ['rebuild', '@vscode/sqlite3']);
}

async function getElectron() {
	await runProcess(npm, ['run', 'electron']);
}

async function ensureCompiled() {
	if (!(await exists('out'))) {
		await runProcess(npm, ['run', 'compile']);
	}
}

async function main() {
	await ensureNodeModules();
	await ensureSqliteNativeBinding();
	await getElectron();
	await ensureCompiled();

	// Can't require this until after dependencies are installed
	const { getBuiltInExtensions } = await import('./builtInExtensions.ts');
	await getBuiltInExtensions();
}

if (import.meta.main) {
	main().catch(err => {
		console.error(err);
		process.exit(1);
	});
}
