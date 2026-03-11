#!/usr/bin/env bash
# Nexgile Code — Build Script
# Usage: ./nexgile-build.sh [dev|prod|setup]
#   dev   — Development build (yarn watch)
#   prod  — Production build (minified, packaged)
#   setup — Install dependencies only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail()  { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

# ── Prerequisites Check ──────────────────────────────────────────────

check_prereqs() {
  info "Checking prerequisites..."

  # Node.js
  if ! command -v node &>/dev/null; then
    fail "Node.js is not installed. Install v22.x from https://nodejs.org"
  fi
  NODE_VER=$(node -v)
  ok "Node.js $NODE_VER"

  # Yarn
  if ! command -v yarn &>/dev/null; then
    fail "Yarn is not installed. Run: npm install -g yarn@1.22.22"
  fi
  YARN_VER=$(yarn --version)
  ok "Yarn $YARN_VER"

  # Python
  if ! command -v python &>/dev/null && ! command -v python3 &>/dev/null; then
    fail "Python 3 is not installed. Install from https://python.org"
  fi
  PYTHON_VER=$(python --version 2>/dev/null || python3 --version)
  ok "$PYTHON_VER"

  # VS Build Tools (Windows only)
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    VSWHERE="/c/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe"
    if [[ -f "$VSWHERE" ]]; then
      VS_PATH=$("$VSWHERE" -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>/dev/null || true)
      if [[ -n "$VS_PATH" ]]; then
        ok "VS C++ Build Tools found at $VS_PATH"
      else
        warn "VS C++ Build Tools not found!"
        warn "Install Visual Studio Build Tools with C++ Desktop workload:"
        warn "  https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022"
        fail "Cannot build native modules without C++ Build Tools"
      fi
    else
      warn "vswhere.exe not found — cannot verify VS Build Tools"
    fi
  fi

  ok "All prerequisites met!"
  echo ""
}

# ── Generate Icons ────────────────────────────────────────────────────

generate_icons() {
  info "Generating Nexgile Code icons..."
  node scripts/generate-icons.js
  ok "Icons generated"
}

# ── Install Dependencies ──────────────────────────────────────────────

install_deps() {
  info "Installing dependencies (this may take several minutes)..."
  yarn install --frozen-lockfile 2>/dev/null || yarn install
  ok "Dependencies installed"
}

# ── Development Build ─────────────────────────────────────────────────

dev_build() {
  check_prereqs
  generate_icons
  install_deps

  info "Starting development build..."
  info "Use Ctrl+C to stop. Launch with: ./scripts/code.bat"
  echo ""
  yarn watch
}

# ── Production Build ──────────────────────────────────────────────────

prod_build() {
  check_prereqs
  generate_icons
  install_deps

  info "Compiling production build..."
  yarn gulp compile-build
  yarn gulp compile-extension-media
  yarn gulp compile-extensions-build
  yarn gulp minify-vscode

  info "Packaging Windows x64..."
  yarn gulp "vscode-win32-x64-min-ci"

  info "Creating user setup installer..."
  yarn gulp "vscode-win32-x64-user-setup"

  ok "Production build complete!"
  info "Outputs:"
  info "  - Portable: .build/win32-x64/"
  info "  - Installer: .build/win32-x64/user-setup/"
}

# ── Main ──────────────────────────────────────────────────────────────

MODE="${1:-dev}"

echo ""
echo "  ╔══════════════════════════════════╗"
echo "  ║      Nexgile Code Builder        ║"
echo "  ╚══════════════════════════════════╝"
echo ""

case "$MODE" in
  dev)
    dev_build
    ;;
  prod)
    prod_build
    ;;
  setup)
    check_prereqs
    generate_icons
    install_deps
    ok "Setup complete! Run './nexgile-build.sh dev' to start development."
    ;;
  *)
    echo "Usage: $0 [dev|prod|setup]"
    echo "  dev   — Development build with hot reload"
    echo "  prod  — Production build with installer"
    echo "  setup — Install dependencies only"
    exit 1
    ;;
esac
