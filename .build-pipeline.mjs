// Nexgile VS IDE - cross-platform build pipeline (Windows / macOS / Linux)
// ------------------------------------------------------------------------
// Builds the IDE for the *current host OS* and produces that OS's installer:
//   Windows -> Inno Setup user/system setup    (vscode-win32-<arch>-{user,system}-setup)
//   Linux   -> .deb and .rpm packages          (vscode-linux-<arch>-build-{deb,rpm})
//   macOS   -> .dmg                            (build/darwin/create-dmg.ts; unsigned)
//
// You cannot cross-build: native modules + installers must be produced ON the
// target OS. Run this on each platform you want to ship.
//
// Usage:
//   node .build-pipeline.mjs                       full build + installer for this host
//   node .build-pipeline.mjs --no-installer        build the packaged app only
//   node .build-pipeline.mjs --arch arm64          target a specific arch (x64|arm64|armhf)
//   node .build-pipeline.mjs --system-setup        (Windows) system-wide installer instead of user
//   node .build-pipeline.mjs --dry-run             print the steps without running them
//   node .build-pipeline.mjs --platform linux --dry-run   preview another OS's plan (dry-run only)
//
// Prerequisites (per build machine):
//   - Node per .nvmrc (22.22.0).
//   - Native toolchain to compile node native modules:
//       Windows: VS Build Tools 2022 (VCTools) + Spectre-mitigated x86/x64 VC runtimes.
//       Linux:   build-essential, python3, libsecret/libx11 dev headers, plus
//                dpkg/rpmbuild for packaging.
//       macOS:   Xcode command line tools, and `dmgbuild` (pip) for the .dmg.
//   - Logs the step timeline to .build-log.txt (child stdout/stderr stream live).

import { spawnSync } from 'node:child_process';
import { existsSync, appendFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const log = join(root, '.build-log.txt');

// ---- args ----
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const noInstaller = has('--no-installer');
const systemSetup = has('--system-setup');
const dryRun = has('--dry-run');

// host OS; --platform may override the *preview* (dry-run) only, never a real build.
const HOST = process.platform === 'win32' ? 'win32' : process.platform === 'darwin' ? 'darwin' : 'linux';
const platform = opt('--platform', HOST);
if (platform !== HOST && !dryRun) {
	console.error(`Cannot build for '${platform}' on a '${HOST}' host - native modules and installers must be built on the target OS. Use --dry-run to preview.`);
	process.exit(2);
}
const arch = opt('--arch', process.arch === 'arm64' ? 'arm64' : process.arch === 'arm' ? 'armhf' : 'x64');

// ---- logging ----
const ts = () => new Date().toISOString().slice(11, 19);
function Log(msg) { const line = `${ts()} ${msg}`; console.log(line); if (!dryRun) { try { appendFileSync(log, line + '\n'); } catch { /* ignore */ } } }

// ---- step runner ----
function run(label, cmd, args, env) {
	Log(`=== STEP: ${label} ===`);
	if (dryRun) { Log(`[dry-run] ${cmd} ${args.join(' ')}${env ? '   env=' + JSON.stringify(env) : ''}`); return; }
	// npm is a shell script/.cmd -> needs a shell; node is a real binary -> spawn directly
	// (so path args with spaces are passed verbatim).
	const useShell = cmd === 'npm';
	const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: useShell, env: { ...process.env, ...(env || {}) } });
	if (r.error) { Log(`FAIL (${label}): ${r.error.message}`); process.exit(1); }
	if (r.status !== 0) { Log(`FAIL (${label}) exit=${r.status}`); process.exit(r.status || 1); }
	Log(`OK   (${label})`);
}
const gulp = (taskName, env) => run(taskName, 'npm', ['run', 'gulp', '--', taskName], env);

// ---- native modules required per OS ----
// [package, binary, hardFail] - a missing required (.node) breaks state.vscdb storage
// at runtime, so secrets/keys silently stop persisting (see Nexgile bug 2026-06).
function nativeModules(plat) {
	const common = [
		['@vscode/sqlite3', 'vscode-sqlite3.node', true],
		['@vscode/spdlog', 'spdlog.node', true],
		['@parcel/watcher', 'watcher.node', false],
		['kerberos', 'kerberos.node', false],
	];
	if (plat === 'win32') {
		return [...common,
			['node-pty', 'conpty.node', true],
			['@vscode/windows-process-tree', 'windows_process_tree.node', false],
			['@vscode/policy-watcher', 'vscode-policy-watcher.node', false]];
	}
	return [...common, ['node-pty', 'pty.node', true]]; // linux + darwin
}
const nmPath = (pkg, bin) => join(root, 'node_modules', ...pkg.split('/'), 'build', 'Release', bin);

// ================================ build ================================
if (!dryRun) { try { writeFileSync(log, `=== BUILD START ${new Date().toISOString()} host=${HOST} target=${platform}-${arch}${noInstaller ? ' (no installer)' : ''} ===\n`); } catch { /* ignore */ } }
Log(`Target: ${platform}-${arch}${dryRun ? '   [dry-run: showing commands only]' : ''}`);

// 1. dependencies
run('npm install', 'npm', ['install']);

// 2. self-heal: a copied/partial node_modules can pass 'npm install' with postinstall
//    skipped, leaving native modules uncompiled. Force a full install if the critical
//    SQLite binary is missing.
const sqlite = nmPath('@vscode/sqlite3', 'vscode-sqlite3.node');
if (!dryRun && !existsSync(sqlite)) {
	Log('vscode-sqlite3.node missing after npm install; forcing a full install');
	run('force full install (native modules)', 'node', ['build/npm/fast-install.ts', '--force']);
}

// 3. native-module guard
if (dryRun) {
	Log(`[dry-run] would verify native modules: ${nativeModules(platform).map(([p, b, r]) => `${p}/${b}${r ? '*' : ''}`).join(', ')}  (* = required)`);
} else {
	const missingRequired = [];
	for (const [pkg, bin, required] of nativeModules(platform)) {
		if (!existsSync(nmPath(pkg, bin))) {
			if (required) { missingRequired.push(`${pkg}/build/Release/${bin}`); }
			else { Log(`WARN: recommended native module missing: ${pkg}/build/Release/${bin}`); }
		}
	}
	if (missingRequired.length) {
		Log('FATAL: required native modules missing (the IDE would fall back to in-memory storage and lose secrets/keys):');
		for (const m of missingRequired) { Log(`  - ${m}`); }
		Log("Fix: run 'node build/npm/fast-install.ts --force' with the .nvmrc Node version and a working native toolchain.");
		process.exit(1);
	}
	Log('Native module check: all required .node modules present');
}

// 4. compile + minify (platform-agnostic). compile-build-without-mangling avoids the
//    mangler OOM (>12 GB) on this fork; ~10-15% larger but functionally identical.
gulp('compile-build-without-mangling');
gulp('compile-extensions-build');
gulp('minify-vscode');

// 5. package the app for this platform (the packaged app lands in the repo's PARENT dir)
gulp(`vscode-${platform}-${arch}-min-ci`);
Log(`Packaged app: ${join(dirname(root), `VSCode-${platform}-${arch}`)}`);

// 6. installer / package
if (noInstaller) {
	Log('Skipping installer step (--no-installer)');
} else if (platform === 'win32') {
	const target = systemSetup ? 'system' : 'user';
	gulp(`vscode-win32-${arch}-${target}-setup`);
	Log(`Installer: ${join(root, '.build', `win32-${arch}`, `${target}-setup`)}`);
} else if (platform === 'linux') {
	gulp(`vscode-linux-${arch}-build-deb`);
	gulp(`vscode-linux-${arch}-build-rpm`);
	Log(`Packages (.deb/.rpm): ${join(root, '.build', 'linux')}`);
} else if (platform === 'darwin') {
	// No darwin gulp installer task; the .dmg is a standalone script. Code signing /
	// notarization (build/darwin/sign.ts) needs Apple certs and is NOT run here.
	const dmgOut = join(root, '.build', 'darwin');
	run('create-dmg (unsigned)', 'node', ['build/darwin/create-dmg.ts', dirname(root), dmgOut], { VSCODE_ARCH: arch, VSCODE_QUALITY: 'stable' });
	Log(`DMG (unsigned): ${join(dmgOut, `NexgileCodeSetup-darwin-${arch}.dmg`)}`);
}

Log(`=== DONE ${new Date().toISOString()} ===`);
