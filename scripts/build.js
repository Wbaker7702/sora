#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    log(`\n🔧 Executing: ${command}`, 'cyan');
    execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      ...options 
    });
    return true;
  } catch (error) {
    log(`❌ Command failed: ${command}`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'blue');
  
  // Check if Node.js is installed
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`✅ Node.js: ${nodeVersion}`, 'green');
  } catch (error) {
    log('❌ Node.js is not installed', 'red');
    return false;
  }

  // Check if npm/yarn is available
  try {
    const packageManager = fs.existsSync('yarn.lock') ? 'yarn' : 'npm';
    const version = execSync(`${packageManager} --version`, { encoding: 'utf8' }).trim();
    log(`✅ Package Manager: ${packageManager} ${version}`, 'green');
  } catch (error) {
    log('❌ Package manager not found', 'red');
    return false;
  }

  // Check if soroban-cli is installed
  try {
    const sorobanVersion = execSync('soroban --version', { encoding: 'utf8' }).trim();
    log(`✅ Soroban CLI: ${sorobanVersion}`, 'green');
  } catch (error) {
    log('⚠️  Soroban CLI not found - this is required for the app to function', 'yellow');
  }

  return true;
}

function cleanBuild() {
  log('\n🧹 Cleaning previous builds...', 'blue');
  return execCommand('npm run clean');
}

function installDependencies() {
  log('\n📦 Installing dependencies...', 'blue');
  const packageManager = fs.existsSync('yarn.lock') ? 'yarn' : 'npm';
  const installCommand = packageManager === 'yarn' ? 'yarn install --frozen-lockfile' : 'npm ci';
  return execCommand(installCommand);
}

function runLinting() {
  log('\n🔍 Running linting...', 'blue');
  return execCommand('npm run lint');
}

function runTypeChecking() {
  log('\n🔍 Running type checking...', 'blue');
  return execCommand('npm run type-check');
}

function runTests() {
  log('\n🧪 Running tests...', 'blue');
  return execCommand('npm run test');
}

// Helper function to get git commit hash
function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    return undefined;
  }
}

// Helper function to get git commit message
function getGitCommitMessage() {
  try {
    return execSync('git log -1 --pretty=%B', { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    return undefined;
  }
}

// Save build record to pending directory for Electron to process
function saveBuildRecord(platform, success, errorMessage, startTime, logs = []) {
  try {
    const buildId = crypto.randomBytes(16).toString('hex');
    const projectName = process.env.PROJECT_NAME || path.basename(process.cwd());
    
    // Normalize platform name to match BuildPlatform type
    let normalizedPlatform = platform;
    if (platform === 'mac-universal') {
      normalizedPlatform = 'mac-universal';
    } else if (platform === 'mac') {
      normalizedPlatform = 'mac';
    } else if (platform === 'linux') {
      normalizedPlatform = 'linux';
    } else if (platform === 'win32') {
      normalizedPlatform = 'win32';
    } else if (platform === 'win64') {
      normalizedPlatform = 'win64';
    } else {
      normalizedPlatform = 'linux'; // default
    }

    const buildRecord = {
      id: buildId,
      name: `Build ${platform}`,
      project: projectName,
      platform: normalizedPlatform,
      status: success ? 'completed' : 'failed',
      trigger: process.env.CI ? 'git' : 'manual',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      duration: Math.floor((Date.now() - startTime) / 1000),
      error: errorMessage || undefined,
      commitHash: process.env.GIT_COMMIT || getGitCommit(),
      commitMessage: process.env.GIT_COMMIT_MESSAGE || getGitCommitMessage(),
    };

    // Determine temp directory - use .sora in home directory
    const userHome = os.homedir();
    const tempDir = path.join(userHome, '.sora', 'builds', 'pending');
    const logDir = path.join(userHome, '.sora', 'builds', buildId);

    // Ensure directories exist
    fs.mkdirSync(tempDir, { recursive: true });
    fs.mkdirSync(logDir, { recursive: true });

    // Write build record to temp file (Electron will pick this up)
    const tempFile = path.join(tempDir, `${buildId}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(buildRecord, null, 2), 'utf-8');

    // Write logs if provided (they'll be moved by Electron watcher)
    if (logs.length > 0) {
      const logPath = path.join(logDir, 'logs.txt');
      fs.writeFileSync(logPath, logs.join('\n'), 'utf-8');
    }

    log(`\n📦 Build record saved: ${buildId}`, 'green');
    log(`   Location: ${tempFile}`, 'cyan');
    return buildRecord;
  } catch (error) {
    log(`⚠️  Failed to save build record: ${error.message}`, 'yellow');
    return null;
  }
}

function buildApplication(platform = 'all') {
  log(`\n🏗️  Building application for ${platform}...`, 'blue');
  
  const buildCommands = {
    'all': 'npm run build',
    'mac': 'npm run build:mac',
    'mac-universal': 'npm run build:mac:universal',
    'linux': 'npm run build:linux',
    'win32': 'npm run build:win32',
    'win64': 'npm run build:win64',
    'production': 'npm run build:production'
  };

  const command = buildCommands[platform];
  if (!command) {
    log(`❌ Unknown platform: ${platform}`, 'red');
    return false;
  }

  const startTime = Date.now();
  const success = execCommand(command);
  const errorMessage = success ? undefined : 'Build command failed';
  
  // Save build record (even if build failed)
  saveBuildRecord(platform, success, errorMessage, startTime);
  
  return success;
}

function createReleasePackage() {
  log('\n📦 Creating release package...', 'blue');
  return execCommand('npm run release');
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || 'all';
  const skipTests = args.includes('--skip-tests');
  const skipLint = args.includes('--skip-lint');
  const production = args.includes('--production');

  // Track overall build start time
  const overallStartTime = Date.now();
  let buildSuccess = true;
  let buildError = undefined;

  log('🚀 SORA Build Script', 'bright');
  log('====================', 'bright');

  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }

  // Clean previous builds
  if (!cleanBuild()) {
    log('❌ Clean failed', 'red');
    process.exit(1);
  }

  // Install dependencies
  if (!installDependencies()) {
    log('❌ Dependency installation failed', 'red');
    process.exit(1);
  }

  // Run linting (unless skipped)
  if (!skipLint) {
    if (!runLinting()) {
      log('❌ Linting failed', 'red');
      process.exit(1);
    }
  }

  // Run type checking
  if (!runTypeChecking()) {
    log('❌ Type checking failed', 'red');
    process.exit(1);
  }

  // Run tests (unless skipped)
  if (!skipTests) {
    if (!runTests()) {
      log('❌ Tests failed', 'red');
      process.exit(1);
    }
  }

  // Build application
  const buildPlatform = production ? 'production' : platform;
  if (!buildApplication(buildPlatform)) {
    log('❌ Build failed', 'red');
    process.exit(1);
  }

  // Create release package if requested
  if (args.includes('--release')) {
    if (!createReleasePackage()) {
      log('❌ Release package creation failed', 'red');
      process.exit(1);
    }
  }

  log('\n✅ Build completed successfully!', 'green');
  log(`📁 Build artifacts are in the 'dist' directory`, 'cyan');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`
SORA Build Script

Usage: node scripts/build.js [platform] [options]

Platforms:
  all           Build for all platforms (default)
  mac           Build for macOS (Intel)
  mac-universal Build for macOS (Universal)
  linux         Build for Linux
  win32         Build for Windows (32-bit)
  win64         Build for Windows (64-bit)
  production    Production build

Options:
  --skip-tests  Skip running tests
  --skip-lint   Skip linting
  --production  Production build
  --release     Create release package
  --help, -h    Show this help

Examples:
  node scripts/build.js
  node scripts/build.js linux --skip-tests
  node scripts/build.js mac --production --release
  `, 'cyan');
  process.exit(0);
}

main();