---
title: Build and Deploy Guide
sidebar_label: Build & Deploy
---

# Build and Deploy Guide

This guide covers how to build and deploy the Sora application for different platforms and environments.

## Prerequisites

Before building or deploying Sora, ensure you have the following installed:

- **Node.js** (v20 or higher)
- **npm** or **yarn** package manager
- **Soroban CLI** (v0.23.1 or higher)
- **Git** (for version control)

### Installing Soroban CLI

```bash
# Install Rust (required for Soroban CLI)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Soroban CLI
cargo install --locked soroban-cli

# Verify installation
soroban --version
```

## Build Process

### Quick Build

For a quick build of the current platform:

```bash
npm run build
```

### Platform-Specific Builds

Build for specific platforms:

```bash
# macOS (Intel)
npm run build:mac

# macOS (Universal - Intel + Apple Silicon)
npm run build:mac:universal

# Linux
npm run build:linux

# Windows (32-bit)
npm run build:win32

# Windows (64-bit)
npm run build:win64

# Production build
npm run build:production
```

### Comprehensive Build

Use the build script for a complete build process:

```bash
# Build for all platforms
npm run build:all

# Build for specific platform
npm run build:platform linux

# Build with options
npm run build:platform mac --skip-tests --production
```

### Build Options

The build script supports several options:

- `--skip-tests`: Skip running tests
- `--skip-lint`: Skip linting
- `--production`: Production build
- `--release`: Create release package

## Development

### Local Development

Start the development server:

```bash
npm run dev
```

This will start both the Electron main process and the Next.js renderer process.

### Development Scripts

```bash
# Start renderer only
npm run dev:renderer

# Start main process only
npm run dev:main

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run type checking
npm run type-check

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test suite
npm run test -- --testPathPattern=unit
npm run test -- --testPathPattern=integration
npm run test -- --testPathPattern=e2e

# Run tests with coverage
npm run test:coverage
```

### Test Types

- **Unit Tests**: Component and function testing
- **Integration Tests**: API and service integration
- **E2E Tests**: End-to-end user workflows
- **Performance Tests**: Performance benchmarking
- **Security Tests**: Security vulnerability scanning

## Deployment

### Local Deployment

Deploy locally for testing:

```bash
npm run deploy:local
```

This will prepare the application for local execution.

### GitHub Deployment

Deploy to GitHub (push to remote):

```bash
npm run deploy:github
```

### Release Deployment

Create a GitHub release:

```bash
npm run deploy:release
```

### Snap Store Deployment

Deploy to Snap Store:

```bash
npm run deploy:snap
```

## CI/CD Pipeline

### GitHub Actions

The project includes several GitHub Actions workflows:

- **Quality Checks**: Linting, type checking, and testing
- **Build Pipeline**: Multi-platform builds
- **Test Suite**: Comprehensive testing across platforms
- **Security Scanning**: Vulnerability detection
- **Documentation**: Automated documentation deployment

### Workflow Triggers

- **Push to main/develop**: Runs quality checks and builds
- **Pull Requests**: Runs quality checks and tests
- **Tags**: Creates releases
- **Manual Dispatch**: Allows manual workflow execution

## Build Artifacts

### Output Directory

Build artifacts are stored in the `dist/` directory:

```
dist/
├── linux-unpacked/          # Linux build files
├── mac/                     # macOS build files
├── win-unpacked/            # Windows build files
├── *.AppImage               # Linux AppImage
├── *.dmg                    # macOS disk image
├── *.exe                    # Windows executable
└── *.snap                   # Snap package
```

### Platform-Specific Files

- **Linux**: AppImage, Snap, DEB packages
- **macOS**: DMG, ZIP archives
- **Windows**: NSIS installer, Portable executable

## Troubleshooting

### Common Issues

#### Build Failures

1. **Dependencies not installed**:
   ```bash
   npm ci
   ```

2. **TypeScript errors**:
   ```bash
   npm run type-check
   ```

3. **Linting errors**:
   ```bash
   npm run lint:fix
   ```

#### Test Failures

1. **Unit test failures**:
   ```bash
   npm run test -- --verbose
   ```

2. **Integration test failures**:
   - Ensure Soroban CLI is installed
   - Check network connectivity
   - Verify test environment setup

#### Deployment Issues

1. **GitHub deployment fails**:
   - Check repository permissions
   - Verify GitHub token
   - Ensure branch is up to date

2. **Snap deployment fails**:
   - Install snapcraft: `sudo snap install snapcraft --classic`
   - Login to snap store: `snapcraft login`
   - Check snap package configuration

### Getting Help

If you encounter issues:

1. Check the [FAQ](../troubleshooting/faq.md)
2. Search existing [GitHub Issues](https://github.com/tolgayayci/sora/issues)
3. Create a new issue with detailed information
4. Join the [Stellar Developer Discord](https://discord.gg/stellardev)

## Advanced Configuration

### Environment Variables

Set environment variables for different build configurations:

```bash
# Production build
NODE_ENV=production npm run build

# Development build
NODE_ENV=development npm run build
```

### Custom Build Configuration

Modify `electron-builder.yml` for custom build settings:

```yaml
# Custom build configuration
appId: com.electron.sora
productName: Sora
directories:
  output: dist
  buildResources: resources
```

### Custom Deployment

Create custom deployment scripts in `scripts/` directory:

```javascript
// scripts/custom-deploy.js
const { execSync } = require('child_process');

// Custom deployment logic
execSync('your-deployment-command');
```

## Best Practices

### Before Building

1. Run all tests: `npm run test`
2. Check code quality: `npm run lint && npm run type-check`
3. Update dependencies: `npm run deps:update`
4. Run security audit: `npm run security:check`

### Before Deploying

1. Ensure all tests pass
2. Update version in `package.json`
3. Create release notes
4. Test on target platforms
5. Verify build artifacts

### Version Management

- Use semantic versioning (semver)
- Update version in `package.json`
- Create git tags for releases
- Document changes in release notes

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Soroban Documentation](https://soroban.stellar.org/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)