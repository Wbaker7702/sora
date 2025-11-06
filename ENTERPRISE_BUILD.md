# Sora Enterprise Files Configuration

This directory contains enterprise-level configuration files for building and distributing Sora as an enterprise application.

## Configuration Files

### 1. electron-builder-enterprise.yml
Main electron-builder configuration for enterprise builds with:
- **Enhanced compression** for smaller distribution packages
- **Code signing and notarization** for all platforms
- **Multiple distribution targets**: DMG, ZIP, PKG (macOS), NSIS, MSI, Portable (Windows), AppImage, Snap, DEB, RPM (Linux)
- **File associations** for TOML, WASM, Rust, Stellar, and Soroban files
- **Protocol handlers** for `sora://`, `stellar://`, and `soroban://` URLs
- **Extra resources** bundling (licenses, docs, templates)
- **Advanced ASAR configuration** with selective unpacking
- **Dual publishing** support (GitHub + Generic server)

### 2. fileAssociations.yml
Defines file type associations and protocol handlers:
- `.toml` - TOML configuration files
- `.wasm` - WebAssembly binary files
- `.rs` - Rust source files
- `.stellar` - Stellar smart contract files
- `.soroban` - Soroban smart contract files
- Custom URL protocols: `sora://`, `stellar://`, `soroban://`

### 3. build-config-enterprise.json
Comprehensive build configuration metadata including:
- Enterprise feature flags
- Platform-specific settings
- File inclusion/exclusion rules
- Security and distribution options
- Metadata and licensing information

### 4. scripts/installer.nsh
NSIS installer customization script for Windows that handles:
- Previous version detection and cleanup
- Registry entries for enterprise mode
- File association registration
- Protocol handler registration
- Custom installer UI elements

### 5. scripts/build-enterprise.js
Enterprise build automation script that:
- Validates build environment
- Sets up enterprise-specific resources
- Builds for all platforms or specific targets
- Generates SHA-256 checksums for all artifacts
- Creates enterprise marker files

## Usage

### Building Enterprise Version

```bash
# Build for all platforms
npm run build:enterprise:all

# Build for specific platform
npm run build:enterprise:mac
npm run build:enterprise:win
npm run build:enterprise:linux

# Or use the script directly
node scripts/build-enterprise.js [platform]
```

### Platform-Specific Builds

**macOS:**
```bash
npm run build:enterprise:mac
```
Produces: DMG, ZIP, and PKG installers for x64 and ARM64

**Windows:**
```bash
npm run build:enterprise:win
```
Produces: NSIS installer, portable executable, and MSI package

**Linux:**
```bash
npm run build:enterprise:linux
```
Produces: AppImage, Snap, DEB, and RPM packages

## Enterprise Features

The enterprise configuration enables:

1. **Advanced Analytics** - Enhanced telemetry and usage tracking
2. **Team Collaboration** - Multi-user support and shared workspaces
3. **Priority Support** - Dedicated support channels
4. **Custom Branding** - White-label capabilities
5. **Single Sign-On (SSO)** - Enterprise authentication integration
6. **Audit Logs** - Comprehensive activity logging
7. **Advanced Security** - Enhanced security features and compliance

## Security

Enterprise builds include:
- Code signing for all platforms
- macOS notarization
- Hardened runtime on macOS
- Certificate-based Windows signing
- Strict snap confinement on Linux

## Distribution

### GitHub Releases
Automatic publishing to GitHub Releases with:
- Auto-update support
- Differential updates for faster patches
- Release notes generation

### Generic Server
Support for custom update servers:
- Configurable at `https://releases.example.com/sora`
- Multiple channels: stable, beta, alpha

## Requirements

### Environment Variables

**macOS Signing:**
```bash
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=certificate-password
export APPLE_ID=your-apple-id@email.com
export APPLE_ID_PASSWORD=app-specific-password
export APPLE_TEAM_ID=your-team-id
```

**Windows Signing:**
```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=certificate-password
```

### Build Tools

- Node.js 18+
- npm or yarn
- Platform-specific tools:
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools
  - Linux: Standard build tools (gcc, make, etc.)

## Resource Structure

```
resources/
├── icon.icns           # macOS icon
├── icon.ico            # Windows icon
├── icon.png            # Linux icon
├── background.png      # DMG background
├── installer-header.bmp    # Windows installer header
├── installer-sidebar.bmp   # Windows installer sidebar
├── icons/
│   ├── toml.ico
│   ├── wasm.ico
│   ├── rust.ico
│   ├── stellar.ico
│   └── soroban.ico
├── licenses/           # License files
├── docs/              # Documentation
└── templates/         # Project templates
```

## File Filtering

Enterprise builds use aggressive filtering to minimize package size:
- Excludes development files (tests, examples, .d.ts files)
- Removes unnecessary documentation (README, CHANGELOG)
- Filters out development tools and configs
- Keeps only production dependencies
- Optimizes node_modules

## Checksums

All enterprise builds generate SHA-256 checksums in `dist/checksums.json`:
```json
{
  "Sora-Enterprise-0.2.1-x64.dmg": {
    "sha256": "abc123...",
    "size": 123456789,
    "date": "2024-11-05T18:30:00.000Z"
  }
}
```

## Troubleshooting

### Build Fails

1. Check environment variables are set correctly
2. Ensure all required certificates are valid
3. Verify platform-specific tools are installed
4. Check disk space in dist/ directory

### Code Signing Issues

**macOS:**
- Verify Apple ID and app-specific password
- Check Team ID is correct
- Ensure certificate is valid and not expired

**Windows:**
- Verify certificate file exists and is accessible
- Check certificate password is correct
- Ensure certificate supports code signing

### Missing Icons

Create placeholder icons if resources are missing:
```bash
# macOS
iconutil -c icns resources/icon.iconset

# Windows (requires ImageMagick)
convert resources/icon.png -define icon:auto-resize=256,128,64,48,32,16 resources/icon.ico
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Enterprise Build

on:
  push:
    tags:
      - 'v*-enterprise'

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Enterprise
        env:
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run build:enterprise
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: enterprise-builds
          path: dist/*
```

## License

Enterprise builds include all licensing information in `resources/licenses/`.

## Support

For enterprise support, contact: tolgayayci@protonmail.com
