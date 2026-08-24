/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { getChromiumSysroot, getVSCodeSysroot } from './debian/install-sysroot.ts';
import { generatePackageDeps as generatePackageDepsDebian } from './debian/calculate-deps.ts';
import { generatePackageDeps as generatePackageDepsRpm } from './rpm/calculate-deps.ts';
import { referenceGeneratedDepsByArch as debianGeneratedDeps } from './debian/dep-lists.ts';
import { referenceGeneratedDepsByArch as rpmGeneratedDeps } from './rpm/dep-lists.ts';
import { type DebianArchString, isDebianArchString } from './debian/types.ts';
import { isRpmArchString, type RpmArchString } from './rpm/types.ts';
import product from '../../product.json' with { type: 'json' };

// A flag that can easily be toggled.
// Make sure to compile the build directory after toggling the value.
// If false, we warn about new dependencies if they show up
// while running the prepare package tasks for a release.
// If true, we fail the build if there are new dependencies found during that task.
// The reference dependencies, which one has to update when the new dependencies
// are valid, are in dep-lists.ts
const FAIL_BUILD_FOR_NEW_DEPENDENCIES: boolean = true;

// Based on https://source.chromium.org/chromium/chromium/src/+/refs/tags/148.0.7778.97:chrome/installer/linux/BUILD.gn;l=64-80
// and the Linux Archive build
// Shared library dependencies that we already bundle.
const bundledDeps = [
	'libEGL.so',
	'libGLESv2.so',
	'libvulkan.so.1',
	'libvk_swiftshader.so',
	'libffmpeg.so'
];

export async function getDependencies(packageType: 'deb' | 'rpm', buildDir: string, applicationName: string, arch: string): Promise<string[]> {
	if (packageType === 'deb') {
		if (!isDebianArchString(arch)) {
			throw new Error('Invalid Debian arch string ' + arch);
		}
	}
	if (packageType === 'rpm' && !isRpmArchString(arch)) {
		throw new Error('Invalid RPM arch string ' + arch);
	}

	// Get the files for which we want to find dependencies.
	const canAsar = false; // TODO@esm ASAR disabled in ESM
	const nativeModulesPath = path.join(buildDir, 'resources', 'app', canAsar ? 'node_modules.asar.unpacked' : 'node_modules');
	const findResult = spawnSync('find', [nativeModulesPath, '-name', '*.node']);
	if (findResult.status) {
		// Was `return []`, which produced a package with a completely empty
		// `Depends:` field instead of failing — the early return also skips the
		// executables added below AND the reference-list check further down. An
		// empty dependency list is never a correct outcome for this package.
		throw new Error(`Could not enumerate native modules under ${nativeModulesPath}:
${findResult.stderr.toString()}`);
	}

	const appPath = path.join(buildDir, applicationName);
	// Add the native modules
	const files = findResult.stdout.toString().trimEnd().split('\n');
	// Add the tunnel binary, if this build produced one.
	//
	// It is the Rust CLI under cli/, and nothing in this fork builds it: the only
	// task that compiles it is `compile-cli` (build/gulpfile.cli.ts), which is not
	// part of the vscode-linux-<arch>-min chain and is invoked by no workflow.
	// Upstream gets the binary from a separate Azure stage that downloads a
	// pre-built CLI artifact and mixes it in; there is no equivalent here.
	//
	// Unconditionally, this handed dpkg-shlibdeps a path that does not exist and
	// failed the whole deb/rpm build. The stat guard in debian/calculate-deps.ts
	// looks like it tolerates absence, but it only logs and falls through to the
	// hard failure. Upstream's Windows installer already treats the tunnel as
	// optional (`skipifsourcedoesntexist`, build/win32/code.iss), so a missing
	// tunnel binary is a supported state rather than something to force.
	const tunnelPath = path.join(buildDir, 'bin', product.tunnelApplicationName);
	if (existsSync(tunnelPath)) {
		files.push(tunnelPath);
	} else {
		console.log(`Skipping absent tunnel binary ${tunnelPath} in dependency calculation.`);
	}
	// Add the main executable.
	files.push(appPath);
	// Add chrome sandbox and crashpad handler.
	files.push(path.join(buildDir, 'chrome-sandbox'));
	files.push(path.join(buildDir, 'chrome_crashpad_handler'));

	// Generate the dependencies.
	let dependencies: Set<string>[];
	if (packageType === 'deb') {
		const chromiumSysroot = await getChromiumSysroot(arch as DebianArchString);
		const vscodeSysroot = await getVSCodeSysroot(arch as DebianArchString);
		dependencies = generatePackageDepsDebian(files, arch as DebianArchString, chromiumSysroot, vscodeSysroot);
	} else {
		dependencies = generatePackageDepsRpm(files);
	}

	// Merge all the dependencies.
	const mergedDependencies = mergePackageDeps(dependencies);

	// Exclude bundled dependencies and sort
	const sortedDependencies: string[] = Array.from(mergedDependencies).filter(dependency => {
		return !bundledDeps.some(bundledDep => dependency.startsWith(bundledDep));
	}).sort();

	const referenceGeneratedDeps = packageType === 'deb' ?
		debianGeneratedDeps[arch as DebianArchString] :
		rpmGeneratedDeps[arch as RpmArchString];
	// Compare as a set difference, and treat the two directions differently.
	//
	// What actually ships is `sortedDependencies` — the set computed from the
	// binaries in THIS build; it is what fills @@DEPENDS@@ in
	// gulpfile.vscode.linux.ts. The reference list never reaches the package. It
	// is a tripwire for review, so the two directions do not carry equal weight:
	//
	//   ADDED    the package now requires something it did not before, which can
	//            make it uninstallable on a distro this build claims to support.
	//            That is worth stopping a release for.
	//   REMOVED  it requires strictly less than the reference expected. That
	//            cannot break an install. In this fork it is the expected result
	//            of not shipping the tunnel binary, whose dependencies upstream's
	//            reference list was baselined with.
	//
	// The previous check compared the two lists as joined strings and, on any
	// difference in either direction, threw with BOTH lists in full — ~125 lines
	// each. That buries the handful of entries that actually moved.
	const referenceSet = new Set(referenceGeneratedDeps);
	const generatedSet = new Set(sortedDependencies);
	const added = sortedDependencies.filter(dependency => !referenceSet.has(dependency));
	const removed = referenceGeneratedDeps.filter(dependency => !generatedSet.has(dependency));
	const depListFile = packageType === 'deb' ? 'build/linux/debian/dep-lists.ts' : 'build/linux/rpm/dep-lists.ts';

	if (removed.length) {
		console.warn(
			`[deps] ${packageType}/${arch}: ${removed.length} reference dependency/dependencies no longer required`
			+ ` (harmless — the package asks for less than before):\n  - ${removed.join('\n  - ')}\n`
			+ `[deps] Re-baseline referenceGeneratedDepsByArch in ${depListFile} to silence this.`);
	}

	if (added.length) {
		const message =
			`[deps] ${packageType}/${arch}: ${added.length} NEW dependency/dependencies not in the reference list:\n`
			+ `  + ${added.join('\n  + ')}\n`
			+ `[deps] Every one of these must be present on each distro this package supports.`
			+ ` If they are expected, add them to referenceGeneratedDepsByArch in ${depListFile}.`;
		if (FAIL_BUILD_FOR_NEW_DEPENDENCIES) {
			throw new Error(message);
		} else {
			console.warn(message);
		}
	}

	return sortedDependencies;
}


// Based on https://source.chromium.org/chromium/chromium/src/+/main:chrome/installer/linux/rpm/merge_package_deps.py.
function mergePackageDeps(inputDeps: Set<string>[]): Set<string> {
	const requires = new Set<string>();
	for (const depSet of inputDeps) {
		for (const dep of depSet) {
			const trimmedDependency = dep.trim();
			if (trimmedDependency.length && !trimmedDependency.startsWith('#')) {
				requires.add(trimmedDependency);
			}
		}
	}
	return requires;
}
