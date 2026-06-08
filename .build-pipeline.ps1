# Nexgile VS IDE - Windows entry point (thin wrapper)
# ----------------------------------------------------------------------
# The build logic is cross-platform in .build-pipeline.mjs (Node), which runs
# on Windows, macOS, and Linux. This wrapper preserves the familiar Windows
# invocation and the optional portable-Node shim, then delegates.
#
#   .\.build-pipeline.ps1                 # full build + Inno Setup installer
#   .\.build-pipeline.ps1 -NoInstaller    # build the packaged app only
#   .\.build-pipeline.ps1 -Arch arm64     # target a specific arch (x64|arm64)
#   .\.build-pipeline.ps1 -SystemSetup    # system-wide installer instead of user
#   .\.build-pipeline.ps1 -DryRun         # print the steps without running them
#
# On macOS / Linux run the Node driver directly:
#   node .build-pipeline.mjs [--no-installer] [--arch <x64|arm64|armhf>]
#
# Prerequisites (per build machine):
#   1. Node.js 22.22.0 (see .nvmrc). Either install system-wide, or extract a
#      portable copy and point $env:NEXGILE_NODE_DIR at it before running this.
#   2. Visual Studio Build Tools 2022 with:
#        - Microsoft.VisualStudio.Workload.VCTools
#        - Microsoft.VisualStudio.Component.VC.Runtimes.x86.x64.Spectre  (REQUIRED)
#      (needed to compile the native modules, e.g. @vscode/sqlite3).
#
# Output:
#   .build/win32-x64/user-setup/NexgileCodeUserSetup-x64-<version>.exe
#   (or the packaged app under ../VSCode-win32-<arch> with -NoInstaller)

param(
    [switch]$NoInstaller,
    [switch]$SystemSetup,
    [string]$Arch,
    [switch]$DryRun
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Optional: prepend a portable Node install via NEXGILE_NODE_DIR env var so the
# right `node` runs the driver.
if ($env:NEXGILE_NODE_DIR -and (Test-Path "$env:NEXGILE_NODE_DIR\node.exe")) {
    $env:PATH = "$env:NEXGILE_NODE_DIR;$env:PATH"
}

$mjsArgs = @()
if ($NoInstaller) { $mjsArgs += '--no-installer' }
if ($SystemSetup) { $mjsArgs += '--system-setup' }
if ($DryRun)      { $mjsArgs += '--dry-run' }
if ($Arch)        { $mjsArgs += @('--arch', $Arch) }

node (Join-Path $root '.build-pipeline.mjs') @mjsArgs
exit $LASTEXITCODE
