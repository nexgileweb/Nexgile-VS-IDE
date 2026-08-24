#!/usr/bin/env bash
#
# Ad-hoc code signing for the UNSIGNED macOS build.
#
# Why this is needed at all
# -------------------------
# On Apple Silicon every executable must carry a valid code signature. The
# kernel refuses to exec one that does not, and what the user sees is
#
#   "Check with the developer to make sure Nexgile Code works with this
#    version of macOS. You may need to reinstall the application."
#
# That is the crash reporter, not a Gatekeeper prompt — the app was killed at
# launch, before any of its own code ran.
#
# The app reaches this point without a usable signature: Electron ships its
# binaries ad-hoc signed, but gulp-atom-electron renames the bundle, its
# executable and every Helper app, and gulp rewrites the tree on the way out.
# Renaming a bundle invalidates its signature, so what lands in
# ../VSCode-darwin-<arch> is effectively unsigned.
#
# What this is NOT
# ----------------
# This is not Developer ID signing and does not replace build/darwin/sign.ts,
# which needs Apple certificates and handles notarization. An ad-hoc signature
# needs no certificate and no Apple account. Users will still get the
# "unidentified developer" warning on first launch and still need to
# right-click -> Open (or clear the quarantine attribute). What changes is
# that the app runs at all once they do.
#
# Deliberately no --options runtime: the hardened runtime is what enforces
# com.apple.security.cs.allow-jit, so turning it on over an ad-hoc signature
# would break V8's JIT and buy nothing here. Without it, JIT is allowed by
# default and no entitlements are required.

set -euo pipefail

TARGET="${1:?usage: adhoc-sign.sh <path to .app, or the directory containing it>}"

if [ -d "$TARGET" ] && [ "${TARGET##*.}" != "app" ]; then
	# Called with the gulp output directory — find the single .app inside it.
	APP="$(find "$TARGET" -maxdepth 1 -name '*.app' -print -quit)"
	if [ -z "$APP" ]; then
		echo "adhoc-sign: no .app found in $TARGET" >&2
		exit 1
	fi
else
	APP="$TARGET"
fi

if [ ! -d "$APP" ]; then
	echo "adhoc-sign: not a bundle: $APP" >&2
	exit 1
fi

echo "adhoc-sign: signing $APP"

# Strip any quarantine picked up from downloaded build inputs. Left in place it
# survives into the DMG and makes the first launch harder than it needs to be.
xattr -cr "$APP" || true

# --deep is deprecated for distribution signing but is the right tool for an
# ad-hoc pass over an Electron bundle: it signs the nested frameworks, helper
# apps, dylibs and .node addons inside-out in one go. Nothing here is
# distributed under an identity, so the reasons Apple discourages it do not
# apply.
codesign --force --deep --sign - --timestamp=none "$APP"

# Verify, and fail the build if the signature did not take. An app that gets
# this far unsigned would install cleanly and then die on launch, which is
# exactly the failure this script exists to prevent — it must never be
# reported as a success.
codesign --verify --deep --strict --verbose=2 "$APP"

echo "adhoc-sign: OK"
codesign --display --verbose=2 "$APP" 2>&1 | sed 's/^/adhoc-sign:   /'
