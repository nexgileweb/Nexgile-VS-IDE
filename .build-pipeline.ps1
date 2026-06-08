# Nexgile VS IDE - Windows build pipeline
# ----------------------------------------
# Builds the IDE end-to-end and produces a Windows x64 user-setup installer.
# Run from the repo root with PowerShell (admin not required for the build itself,
# but VS Build Tools and Node 22 must already be installed - see Prerequisites).
#
# Prerequisites (one-time, per build machine):
#   1. Visual Studio Build Tools 2022 with workloads:
#        - Microsoft.VisualStudio.Workload.VCTools
#        - Microsoft.VisualStudio.Component.VC.Runtimes.x86.x64.Spectre  (REQUIRED)
#      Install command (admin PowerShell, after downloading vs_buildtools.exe):
#        & vs_buildtools.exe --quiet --wait --norestart `
#          --add Microsoft.VisualStudio.Workload.VCTools `
#          --includeRecommended
#        & vs_buildtools.exe modify --installPath "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools" `
#          --quiet --wait --norestart `
#          --add Microsoft.VisualStudio.Component.VC.Runtimes.x86.x64.Spectre
#   2. Node.js 22.22.0 (see .nvmrc). Either install system-wide, or extract a portable
#      copy and point $env:NEXGILE_NODE_DIR at it before running this script.
#
# Output:
#   .build/win32-x64/user-setup/NexgileCodeUserSetup-x64-<version>.exe
#
# Behavior:
#   - Reuses an existing node_modules tree (delete it manually for a clean install).
#   - Logs to .build-log.txt at the repo root.

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$log  = Join-Path $root '.build-log.txt'

# Optional: prepend a portable Node 22 install via NEXGILE_NODE_DIR env var.
if ($env:NEXGILE_NODE_DIR -and (Test-Path "$env:NEXGILE_NODE_DIR\node.exe")) {
    $env:PATH = "$env:NEXGILE_NODE_DIR;$env:PATH"
}

Set-Location $root
"=== START $(Get-Date) ===" | Out-File $log -Encoding utf8

function Log($msg) { "$([DateTime]::Now.ToString('HH:mm:ss')) $msg" | Tee-Object -FilePath $log -Append }

Log "Repo root: $root"
Log "Using node: $(node --version)"
Log "Using npm:  $(npm --version)"

# Reuse existing node_modules if present (npm install is idempotent on resolved trees).
# Delete node_modules / build/node_modules manually before running this script for a clean install.
foreach ($p in @("$root\node_modules", "$root\build\node_modules")) {
    if (Test-Path $p) { Log "Reusing existing: $p" }
}

function Run-Step($label, [scriptblock]$cmd) {
    Log "=== STEP: $label ==="
    & $cmd *>> $log
    if ($LASTEXITCODE -ne 0) {
        Log "FAIL ($label) exit=$LASTEXITCODE"
        exit 1
    }
    Log "OK   ($label)"
}

Run-Step 'npm install'                    { npm install }
# Note: using compile-build-without-mangling instead of the default
# compile-build-with-mangling. The mangler holds the entire VS Code AST
# in memory and easily exceeds 12 GB on this fork. The resulting binary
# is ~10-15% larger but otherwise identical. Drop the -without- suffix
# if you have >=24 GB RAM and want a smaller installer.
Run-Step 'compile-build-without-mangling' { npm run gulp -- compile-build-without-mangling }
Run-Step 'compile-extensions-build'       { npm run gulp -- compile-extensions-build }
Run-Step 'minify-vscode'                  { npm run gulp -- minify-vscode }
Run-Step 'vscode-win32-x64-min-ci'        { npm run gulp -- vscode-win32-x64-min-ci }
Run-Step 'vscode-win32-x64-user-setup'    { npm run gulp -- vscode-win32-x64-user-setup }

Log "=== DONE $(Get-Date) ==="
Log "Installer at: $root\.build\win32-x64\user-setup\"
