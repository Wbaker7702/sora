# Enterprise Build - Quick Start Guide

## Prerequisites

The enterprise build configuration has been created. Before building, you need to ensure dependencies are properly installed.

## Setup

1. **Install dependencies** (if not already done):
   ```bash
   yarn install
   # or
   npm install
   ```

2. **Verify the build scripts are available**:
   ```bash
   npm run --list | grep enterprise
   ```

## Building Enterprise Version

### Option 1: Using NPM Scripts (Recommended)

```bash
# Build for Linux only (fastest, works on this platform)
npm run build:enterprise:linux

# Build for specific platform
npm run build:enterprise:mac    # macOS build
npm run build:enterprise:win    # Windows build

# Build for all platforms (requires cross-platform build tools)
npm run build:enterprise:all
```

### Option 2: Using Yarn

```bash
yarn build:enterprise:linux
yarn build:enterprise:mac
yarn build:enterprise:win
yarn build:enterprise:all
```

### Option 3: Manual Build

If the automated scripts have issues, you can build manually:

```bash
# 1. Build the Next.js app first
npx nextron build --no-pack

# 2. Then run electron-builder with enterprise config
npx electron-builder --linux --config electron-builder-enterprise.yml
```

## Platform-Specific Notes

### Linux (Current Platform)
```bash
# Simplest approach for testing
npm run build:enterprise:linux
```

This will create:
- AppImage (portable)
- Snap package
- DEB package (Debian/Ubuntu)
- RPM package (Fedora/RHEL)

### macOS
Requires:
- macOS host machine
- Xcode Command Line Tools
- Apple Developer certificates

### Windows
Requires:
- Windows host or cross-compilation tools
- Code signing certificate (optional)

## Troubleshooting

### "Command not found" errors

If you get errors about commands not being found:
1. Make sure dependencies are installed: `yarn install` or `npm install`
2. Use `npx` prefix: `npx nextron build`
3. Check that you're in the project root directory

### Build fails during Next.js compilation

1. Clean previous builds:
   ```bash
   npm run clean
   # or manually
   rm -rf dist app .next
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   yarn install
   ```

3. Try building the regular version first:
   ```bash
   npm run build:linux
   ```

### Cross-platform builds fail

Cross-platform building (building for macOS/Windows on Linux) requires additional tools:
- For macOS: Requires actual macOS machine or cloud build service
- For Windows: Install wine and mono (`sudo apt-get install wine mono`)

## Output

Built packages will be in the `dist/` directory:
```
dist/
├── Sora-Enterprise-0.2.1-x64.AppImage
├── Sora-Enterprise-0.2.1-x64.deb
├── Sora-Enterprise-0.2.1-x64.rpm
├── sora-enterprise_0.2.1_amd64.snap
└── checksums.json
```

## Configuration Files Reference

- `electron-builder-enterprise.yml` - Main build configuration
- `build-config-enterprise.json` - Enterprise features/metadata
- `fileAssociations.yml` - File associations and protocols
- `scripts/build-enterprise.js` - Automated build script
- `scripts/installer.nsh` - Windows installer customization

## Next Steps

After successful build:
1. Test the generated packages
2. Set up code signing certificates
3. Configure update server URLs
4. Set up CI/CD pipeline

For detailed documentation, see `ENTERPRISE_BUILD.md`.
