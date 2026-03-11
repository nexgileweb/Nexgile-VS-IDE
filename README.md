# Nexgile Code

A professional code editor built for enterprise development teams.

## About

Nexgile Code is a white-labeled distribution of VS Code, customized with enterprise-grade theming, branding, and configuration. It provides comprehensive code editing, navigation, IntelliSense, debugging, and a rich extensibility model via the [Open VSX](https://open-vsx.org/) marketplace.

## Features

- **Enterprise Dark Theme** — WCAG AAA compliant Nexgile Dark Enterprise theme
- **Open VSX Marketplace** — Access thousands of extensions
- **Full VS Code Compatibility** — Built on VS Code 1.111.0
- **Cross-Platform** — Windows, macOS, and Linux support

## Building from Source

### Prerequisites

- Node.js v22.x
- Yarn 1.x (`npm install -g yarn@1.22.22`)
- Python 3.x
- VS 2022 Build Tools with C++ Desktop workload (Windows)
- Git

### Quick Start

```bash
# Install dependencies and generate icons
./nexgile-build.sh setup

# Development build with hot reload
./nexgile-build.sh dev

# Production build with installer
./nexgile-build.sh prod
```

### Manual Build (Windows)

```bash
yarn install
yarn watch
# Launch: ./scripts/code.bat
```

## Repository Structure

- `product.json` — Product identity and configuration
- `extensions/nexgile-theme/` — Enterprise dark and light themes
- `resources/win32/` — Windows icons and assets
- `nexgile-build.sh` — Build convenience script

## License

See [LICENSE.txt](LICENSE.txt) for details.

## Issues

Report issues at [GitHub Issues](https://github.com/nexgileweb/Nexgile-VS-IDE/issues).
