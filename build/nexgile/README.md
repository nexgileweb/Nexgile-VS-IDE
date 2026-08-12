# Language-support built-in extensions

Nexgile Code ships language servers as **built-in extensions** so that code intelligence works on a
fresh install, offline, with no marketplace round trip and no per-user setup.

`languageExtensions.json` is the source of truth. The matching entries in `product.json` are generated.

```sh
npm run check-language-extensions   # CI: verify the pins still resolve and hash identically
npm run sync-language-extensions    # rewrite the generated block in product.json
node build/nexgile/syncLanguageExtensions.ts --write --update   # also re-resolve unpinned versions
node build/nexgile/syncLanguageExtensions.ts --only redhat.java # work on one extension
```

## Why a script instead of hand-written entries

Each `builtInExtensions` entry carries an exact version and an exact `sha256`, and the build **fails**
if the bytes it downloads do not hash to that value. Maintaining forty of those by hand means forty
chances to paste the wrong digest, and every upstream release invalidates one of them silently until
someone runs a build.

The script computes each digest by downloading through the *same URL with the same headers* that
`build/lib/extensions.ts` will use, and hashing the response body the same way `build/lib/fetch.ts`
does — after transparent `Content-Encoding` decoding. Hashing the file from any other endpoint,
including the `files.download` URL in the Open VSX API response, can produce a digest that only works
on the machine that generated it.

## What the script refuses to do

These are failures, not warnings, because each one produces a broken build or a broken install:

- **Per-platform packages.** `builtInExtensions` pins one `sha256` for every build target, and its
  `platforms` field filters on the *build host*, not the target. `sumneko.lua` publishes `darwin-arm64`
  as its newest release; accepting it would put a macOS binary in the Windows installer. Only
  `universal` packages are eligible.
- **Pre-release versions**, unless the entry sets `allowPreRelease`. Several upstreams — Red Hat,
  rust-analyzer — publish *only* dated CI builds to Open VSX and flag every one of them pre-release. If
  you opt in, you are shipping a CI build to customers; say so in `notes`.
- **An engine requirement newer than this fork.** The extension would install and then silently refuse
  to activate.
- **A non-zip response.** Catches gallery outages that return an HTML error page with a 200.

## What it warns about

- **A stale universal build.** An extension that moved to per-platform packaging usually abandoned its
  universal build at that moment: sumneko.lua's newest universal is `2.5.3` against a platform-specific
  `3.19.0`. Shipping it is a decision about how old a server you will accept — make it deliberately.
- **Eager activation.** A built-in extension cannot be disabled by the user, so one that activates on
  `*` or `onStartupFinished` costs every user every window open, whether or not they ever open that
  language. Language extensions should activate on `onLanguage:` only.
- **Unshipped `extensionDependencies`.** These resolve at activation. A built-in whose dependency was
  never shipped fails silently — the user sees a language with no features and no explanation.
- **Anything that is not `serverDelivery: "bundled"`.** An extension that downloads its server on first
  activation gives an air-gapped install syntax highlighting and nothing else.

## Licensing

Redistribution rights are established from the LICENSE text that actually ships, and every check is
fatal rather than advisory — a warning in a build log is not a defence. Three sources must agree: what
the manifest claims, what the registry's metadata says, and what the package contains. The packaged text
governs; Open VSX's `license` field is self-declared and is regularly wrong (`ocamllabs.ocaml-platform`
reports MIT and ships ISC; `julialang.language-julia` reports `SEE LICENSE IN LICENSE`).

The license is looked for in descending order of authority: the registry's indexed copy, then the vsix
itself, then a reviewed copy under `licenses/`. Checking the archive matters — the registry's index
misses files it did not expect, and refusing an extension over a metadata gap would be wrong.

Beyond identification:

- **Length.** A recognised license at the top of a file does not establish the terms of the whole file.
  `bmewburn.vscode-intelephense-client` opens with a verbatim MIT grant for its client and runs 4.7 KB
  against MIT's 1.2 KB; the remainder covers a proprietary server. Anything materially longer than
  canonical is refused for a human to read.
- **Vendored code.** An extension being MIT says nothing about what it bundles, and the installer
  redistributes vendored code just as literally. Every `LICENSE`/`COPYING` file inside the package is
  extracted and classified; notice-only ones clear automatically (a bundled JS extension carries 40–80,
  essentially all MIT/ISC), and only reciprocal, unidentifiable or disqualifying ones stop the build.
  `zobo.php-intellisense` is the motivating case: MIT, bundling a composer dependency under OSL-3.0.
- **Weak copyleft** (EPL, MPL, LGPL, CDDL) requires `sourceOfferAcknowledged` on the entry. We do not
  modify these, so the obligation reduces to a written offer of source, which the repository URL in the
  notices file satisfies — but somebody has to have decided that, not inherited it silently.

Two things are deliberately *not* adjudicated automatically, because doing it badly is worse than not
doing it. `NOTICE` and `THIRDPARTYNOTICES` files are prose, not grants: Microsoft's standard boilerplate
carries a clause about reverse-engineering LGPL libraries that a keyword scan reads as "this bundles
LGPL code", and that file ships in every `vscode-jsonrpc`-derived package. They are counted and reported
only. Likewise, forbidden-phrase matching never vetoes an *identified* license — standard license texts
quote each other, and MPL-2.0 §1.12 names the GNU Affero license in its definitions.

## `builtInExtensionsEnabledWithAutoUpdates`

The script maintains this list, and it is not optional. In a product with `"quality": "stable"`,
`ExtensionsWorkbenchService`'s `outdated` getter returns `false` unconditionally for any built-in
extension whose id is absent from it, and `install()` short-circuits on the same check. Without the
entry, a language server is frozen at its pinned version for the life of the release — an upstream
security fix would require a full IDE respin.

Offline installs are unaffected: they simply keep the version that shipped.

## Adding an extension

1. Confirm it is on Open VSX, publishes a `universal` package, and has a redistributable license.
   Verify the license against the **packaged** `LICENSE`, not just the API's `license` field, which is
   frequently wrong or absent.
2. Confirm it registers real language providers. A TextMate grammar, a linter, or a formatter
   contributes nothing to `vscode.executeDefinitionProvider` and is not worth the installer weight.
3. Add the entry, run `npm run sync-language-extensions`, and read every warning it prints.
4. Record the license and the upstream repository in the attribution manifest — several of these
   (EPL-2.0, MPL-2.0) carry a written offer of source obligation that redistribution triggers.
