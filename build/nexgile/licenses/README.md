# Vendored license texts

Every extension in `product.json`'s `builtInExtensions` must contribute its license and copyright
notice to `ThirdPartyNotices-Extensions.txt`. Normally that text is read straight out of the published
package. A file here is the fallback for the cases where a published package **omits** its LICENSE even
though the upstream grant plainly exists.

This is deliberately a checked-in file rather than a flag on the manifest entry: it is the difference
between "someone verified the grant and recorded the text" and "someone silenced a build error".

Name each file exactly `<publisher>.<name>.txt`, matching the `builtInExtensions` entry.

## Before adding one

1. Confirm the grant from **two independent sources** — typically the upstream repository's `LICENSE` at
   the matching tag, and the same extension's packaged LICENSE from a neighbouring version.
2. Check they agree after whitespace normalisation. If they differ in substance, stop: the discrepancy
   is the finding.
3. Prefer pinning a version that packages the license. Vendoring is the fallback, not the default.

## Current entries

### `ms-vscode.vscode-js-profile-table.txt`

The pinned `1.0.10` package contains no LICENSE file; `1.0.11` does. Text verified identical between
the `1.0.11` package and `microsoft/vscode-js-profile-visualizer`'s repository LICENSE. MIT.

**Preferred fix:** bump the pin to `1.0.11`, which packages its own LICENSE, and delete this file. That
was left alone here because changing a shipped extension's version is a product decision, not a
licensing one.
