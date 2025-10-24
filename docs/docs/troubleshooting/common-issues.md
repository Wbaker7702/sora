---
title: Common Issues & Solutions
sidebar_label: Common Issues
---

# Common Issues & Solutions

This guide covers the most common issues encountered when building, testing, or deploying Sora, along with their solutions.

## Build Issues

### Node.js Version Issues

#### Problem: "Node.js version is too old"
```
❌ Node.js v16.20.0 is too old. Please install Node.js 20 or higher.
```

#### Solution:
```bash
# Install Node.js 20+ using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Or download from nodejs.org
# https://nodejs.org/en/download/
```

#### Verification:
```bash
node --version  # Should show v20.x.x or higher
```

---

### Package Manager Issues

#### Problem: "Package manager not found"
```
❌ Package manager not found
```

#### Solution:
```bash
# Install npm (comes with Node.js)
npm --version

# Or install yarn
npm install -g yarn
yarn --version
```

---

### Dependency Installation Issues

#### Problem: "Failed to install dependencies"
```
❌ Failed to install dependencies
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /path/to/package.json
npm ERR! errno -2
npm ERR! enoent ENOENT: no such file or directory
```

#### Solution:
```bash
# Ensure you're in the correct directory
pwd
ls -la package.json

# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Build Failures

#### Problem: "Build failed with TypeScript errors"
```
❌ Build failed
error TS2307: Cannot find module 'react' or its corresponding type declarations.
```

#### Solution:
```bash
# Install missing dependencies
npm install

# Check TypeScript configuration
npm run type-check

# Fix type issues
npm run lint:fix
```

#### Problem: "Build failed with linting errors"
```
❌ Build failed
error: 'variable' is assigned a value but never used
```

#### Solution:
```bash
# Fix linting issues automatically
npm run lint:fix

# Or fix manually
npm run lint
# Fix the issues shown in the output
```

---

## Testing Issues

### Test Failures

#### Problem: "Tests are failing"
```
❌ Tests failed
FAIL src/components/Button.test.tsx
  ● Button component › should render correctly
    expect(received).toBe(expected)
```

#### Solution:
```bash
# Run tests with verbose output
npm run test -- --verbose

# Run specific test file
npm run test -- --testPathPattern=Button.test.tsx

# Update snapshots if needed
npm run test -- --updateSnapshot
```

#### Problem: "Test coverage is too low"
```
❌ Test coverage is below threshold
```

#### Solution:
```bash
# Run tests with coverage
npm run test:coverage

# Check coverage report
open coverage/lcov-report/index.html

# Add more tests for uncovered code
```

---

## Deployment Issues

### Local Deployment Issues

#### Problem: "No suitable executable found"
```
❌ No suitable executable found for current platform
```

#### Solution:
```bash
# Ensure build was successful
npm run build

# Check dist directory
ls -la dist/

# Build for current platform
npm run build:platform
```

#### Problem: "Permission denied when running executable"
```
❌ Permission denied: './dist/Sora.AppImage'
```

#### Solution:
```bash
# Make executable
chmod +x dist/Sora.AppImage

# Or run with proper permissions
./dist/Sora.AppImage
```

---

### GitHub Deployment Issues

#### Problem: "GitHub deployment failed"
```
❌ GitHub deployment failed
error: failed to push some refs to 'github.com:user/sora.git'
```

#### Solution:
```bash
# Check git status
git status

# Add and commit changes
git add .
git commit -m "Your commit message"

# Push to remote
git push origin main

# Or force push if needed (be careful!)
git push --force-with-lease origin main
```

#### Problem: "GitHub token not found"
```
❌ GitHub token not found
```

#### Solution:
```bash
# Set up GitHub token
export GITHUB_TOKEN=your_token_here

# Or add to .env file
echo "GITHUB_TOKEN=your_token_here" >> .env
```

---

### Release Creation Issues

#### Problem: "Release creation failed"
```
❌ Release creation failed
error: Tag already exists
```

#### Solution:
```bash
# Check existing tags
git tag -l

# Delete existing tag if needed
git tag -d v0.2.1
git push origin :refs/tags/v0.2.1

# Create new release
npm run deploy:release
```

---

## Platform-Specific Issues

### macOS Issues

#### Problem: "Code signing failed"
```
❌ Code signing failed
error: No identity found
```

#### Solution:
```bash
# Install Xcode command line tools
xcode-select --install

# Set up code signing certificates
# Follow Apple Developer documentation
```

#### Problem: "Notarization failed"
```
❌ Notarization failed
error: Invalid credentials
```

#### Solution:
```bash
# Set up Apple ID credentials
export APPLE_ID=your_apple_id
export APPLE_ID_PASSWORD=your_app_specific_password
export TEAM_ID=your_team_id
```

---

### Linux Issues

#### Problem: "AppImage not executable"
```
❌ AppImage not executable
```

#### Solution:
```bash
# Make AppImage executable
chmod +x dist/Sora.AppImage

# Run AppImage
./dist/Sora.AppImage
```

#### Problem: "Snap deployment failed"
```
❌ Snap deployment failed
error: snapcraft not found
```

#### Solution:
```bash
# Install snapcraft
sudo snap install snapcraft --classic

# Login to snap store
snapcraft login

# Deploy snap
npm run deploy:snap
```

---

### Windows Issues

#### Problem: "Windows build failed"
```
❌ Windows build failed
error: MSBuild not found
```

#### Solution:
```bash
# Install Windows Build Tools
npm install -g windows-build-tools

# Or install Visual Studio Build Tools
# Download from Microsoft website
```

---

## Performance Issues

### Slow Build Times

#### Problem: "Build is taking too long"
```
⏳ Build is taking more than 10 minutes
```

#### Solution:
```bash
# Clear build cache
npm run clean

# Use production build
npm run build:production

# Check system resources
top
df -h
```

### Memory Issues

#### Problem: "Out of memory during build"
```
❌ JavaScript heap out of memory
```

#### Solution:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or run with increased memory
node --max-old-space-size=4096 scripts/build.js
```

---

## Environment Issues

### Soroban CLI Issues

#### Problem: "Soroban CLI not found"
```
⚠️ Soroban CLI not found
```

#### Solution:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Soroban CLI
cargo install --locked soroban-cli

# Verify installation
soroban --version
```

### Environment Variables

#### Problem: "Environment variables not set"
```
❌ Environment variables not set
```

#### Solution:
```bash
# Create .env file
cp .env.example .env

# Edit .env file with your values
nano .env

# Load environment variables
source .env
```

---

## Getting Help

### Debugging Steps

1. **Check logs**:
   ```bash
   npm run build -- --verbose
   npm run test -- --verbose
   ```

2. **Verify environment**:
   ```bash
   npm run setup
   ```

3. **Check system requirements**:
   ```bash
   node --version
   npm --version
   soroban --version
   ```

4. **Clean and rebuild**:
   ```bash
   npm run clean:all
   npm install
   npm run build
   ```

### Support Channels

- **GitHub Issues**: [Create an issue](https://github.com/tolgayayci/sora/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/stellardev)
- **Documentation**: [Read the docs](https://github.com/tolgayayci/sora/docs)
- **Email Support**: [Contact us](mailto:support@sora.dev)

### Reporting Issues

When reporting issues, please include:

1. **System Information**:
   - Operating System
   - Node.js version
   - Package manager version
   - Soroban CLI version

2. **Error Details**:
   - Complete error message
   - Steps to reproduce
   - Expected vs actual behavior

3. **Environment**:
   - Build configuration
   - Environment variables
   - Network conditions

4. **Logs**:
   - Build logs
   - Test logs
   - System logs

---

## Prevention Tips

### Best Practices

1. **Keep dependencies updated**:
   ```bash
   npm run deps:check
   npm run deps:update
   ```

2. **Run tests before building**:
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

3. **Use version control**:
   ```bash
   git status
   git add .
   git commit -m "Your changes"
   ```

4. **Backup important data**:
   ```bash
   git push origin main
   ```

5. **Monitor system resources**:
   ```bash
   top
   df -h
   free -h
   ```

### Regular Maintenance

- **Weekly**: Update dependencies
- **Monthly**: Review and update documentation
- **Quarterly**: Security audit and performance review
- **Annually**: Major version updates and architecture review