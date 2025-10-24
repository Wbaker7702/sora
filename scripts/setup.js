#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
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
    execSync(command, { 
      stdio: 'pipe', 
      cwd: process.cwd(),
      ...options 
    });
    return true;
  } catch (error) {
    return false;
  }
}

function checkNodeVersion() {
  log('\n🔍 Checking Node.js version...', 'blue');
  
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const version = nodeVersion.replace('v', '').split('.').map(Number);
    const majorVersion = version[0];
    
    if (majorVersion >= 20) {
      log(`✅ Node.js: ${nodeVersion}`, 'green');
      return true;
    } else {
      log(`❌ Node.js ${nodeVersion} is too old. Please install Node.js 20 or higher.`, 'red');
      return false;
    }
  } catch (error) {
    log('❌ Node.js is not installed', 'red');
    return false;
  }
}

function checkPackageManager() {
  log('\n🔍 Checking package manager...', 'blue');
  
  if (fs.existsSync('yarn.lock')) {
    try {
      const yarnVersion = execSync('yarn --version', { encoding: 'utf8' }).trim();
      log(`✅ Yarn: ${yarnVersion}`, 'green');
      return 'yarn';
    } catch (error) {
      log('❌ Yarn not found', 'red');
      return false;
    }
  } else if (fs.existsSync('package-lock.json')) {
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      log(`✅ npm: ${npmVersion}`, 'green');
      return 'npm';
    } catch (error) {
      log('❌ npm not found', 'red');
      return false;
    }
  } else {
    log('❌ No package manager lock file found', 'red');
    return false;
  }
}

function checkSorobanCLI() {
  log('\n🔍 Checking Soroban CLI...', 'blue');
  
  try {
    const sorobanVersion = execSync('soroban --version', { encoding: 'utf8' }).trim();
    log(`✅ Soroban CLI: ${sorobanVersion}`, 'green');
    return true;
  } catch (error) {
    log('⚠️  Soroban CLI not found', 'yellow');
    log('This is required for the app to function properly.', 'yellow');
    return false;
  }
}

function installDependencies(packageManager) {
  log('\n📦 Installing dependencies...', 'blue');
  
  const installCommand = packageManager === 'yarn' ? 'yarn install --frozen-lockfile' : 'npm ci';
  
  try {
    execSync(installCommand, { stdio: 'inherit' });
    log('✅ Dependencies installed successfully', 'green');
    return true;
  } catch (error) {
    log('❌ Failed to install dependencies', 'red');
    return false;
  }
}

function setupGitHooks() {
  log('\n🔧 Setting up Git hooks...', 'blue');
  
  try {
    // Install husky if it exists
    if (fs.existsSync('node_modules/.bin/husky')) {
      execSync('npx husky install', { stdio: 'inherit' });
      log('✅ Git hooks set up successfully', 'green');
    } else {
      log('⚠️  Husky not found, skipping Git hooks setup', 'yellow');
    }
    return true;
  } catch (error) {
    log('⚠️  Failed to set up Git hooks', 'yellow');
    return true; // Non-critical
  }
}

function createEnvironmentFile() {
  log('\n📝 Creating environment file...', 'blue');
  
  const envExamplePath = '.env.example';
  const envPath = '.env';
  
  if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ Created .env file from .env.example', 'green');
      log('Please update the .env file with your configuration', 'cyan');
    } catch (error) {
      log('⚠️  Failed to create .env file', 'yellow');
    }
  } else if (fs.existsSync(envPath)) {
    log('✅ .env file already exists', 'green');
  } else {
    log('⚠️  No .env.example file found', 'yellow');
  }
}

function runInitialTests() {
  log('\n🧪 Running initial tests...', 'blue');
  
  try {
    execSync('npm run test', { stdio: 'inherit' });
    log('✅ All tests passed', 'green');
    return true;
  } catch (error) {
    log('⚠️  Some tests failed, but setup can continue', 'yellow');
    return true; // Non-critical for setup
  }
}

function main() {
  log('🚀 SORA Development Environment Setup', 'bright');
  log('=====================================', 'bright');

  let allChecksPassed = true;

  // Check Node.js version
  if (!checkNodeVersion()) {
    allChecksPassed = false;
  }

  // Check package manager
  const packageManager = checkPackageManager();
  if (!packageManager) {
    allChecksPassed = false;
  }

  // Check Soroban CLI
  const sorobanInstalled = checkSorobanCLI();

  if (!allChecksPassed) {
    log('\n❌ Setup failed due to missing requirements', 'red');
    log('Please install the missing requirements and run setup again.', 'yellow');
    process.exit(1);
  }

  // Install dependencies
  if (!installDependencies(packageManager)) {
    log('\n❌ Setup failed during dependency installation', 'red');
    process.exit(1);
  }

  // Set up Git hooks
  setupGitHooks();

  // Create environment file
  createEnvironmentFile();

  // Run initial tests
  runInitialTests();

  log('\n✅ Setup completed successfully!', 'green');
  log('\nNext steps:', 'cyan');
  log('1. Update .env file with your configuration', 'cyan');
  log('2. Install Soroban CLI if not already installed', 'cyan');
  log('3. Run "npm run dev" to start development', 'cyan');
  log('4. Run "npm run build" to build the application', 'cyan');

  if (!sorobanInstalled) {
    log('\n⚠️  Remember to install Soroban CLI:', 'yellow');
    log('curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh', 'cyan');
    log('source ~/.cargo/env', 'cyan');
    log('cargo install --locked soroban-cli', 'cyan');
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`
SORA Development Environment Setup

Usage: node scripts/setup.js [options]

Options:
  --help, -h    Show this help

This script will:
- Check Node.js version (requires v20+)
- Check package manager (npm/yarn)
- Check Soroban CLI installation
- Install dependencies
- Set up Git hooks
- Create environment file
- Run initial tests

Requirements:
- Node.js v20 or higher
- npm or yarn
- Git
- Soroban CLI (optional but recommended)
  `, 'cyan');
  process.exit(0);
}

main();