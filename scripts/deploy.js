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

function checkEnvironment() {
  log('\n🔍 Checking deployment environment...', 'blue');
  
  // Check if we're in a git repository
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
    log('✅ Git repository detected', 'green');
  } catch (error) {
    log('❌ Not in a git repository', 'red');
    return false;
  }

  // Check if dist directory exists
  if (!fs.existsSync('dist')) {
    log('❌ Build directory not found. Please run build first.', 'red');
    return false;
  }

  // Check if we have build artifacts
  const distContents = fs.readdirSync('dist');
  if (distContents.length === 0) {
    log('❌ No build artifacts found in dist directory', 'red');
    return false;
  }

  log('✅ Build artifacts found', 'green');
  return true;
}

function deployToGitHub() {
  log('\n🚀 Deploying to GitHub...', 'blue');
  
  // Check if we have a remote origin
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    log(`📡 Remote origin: ${remoteUrl}`, 'cyan');
  } catch (error) {
    log('❌ No remote origin found', 'red');
    return false;
  }

  // Check if we're on main branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (currentBranch !== 'main' && currentBranch !== 'master') {
    log(`⚠️  Current branch is '${currentBranch}', not main/master`, 'yellow');
  }

  // Push to remote
  if (!execCommand('git push origin HEAD')) {
    return false;
  }

  log('✅ Successfully pushed to GitHub', 'green');
  return true;
}

function deployToGitHubReleases() {
  log('\n📦 Creating GitHub Release...', 'blue');
  
  // Get current version from package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = packageJson.version;
  
  log(`📋 Version: ${version}`, 'cyan');

  // Check if tag already exists
  try {
    execSync(`git tag -l v${version}`, { stdio: 'pipe' });
    log(`⚠️  Tag v${version} already exists`, 'yellow');
  } catch (error) {
    // Tag doesn't exist, create it
    if (!execCommand(`git tag v${version}`)) {
      return false;
    }
  }

  // Push tags
  if (!execCommand('git push origin --tags')) {
    return false;
  }

  log('✅ Successfully created and pushed release tag', 'green');
  return true;
}

function deployToLocal() {
  log('\n💻 Deploying locally...', 'blue');
  
  const platform = os.platform();
  const distPath = path.join(process.cwd(), 'dist');
  
  log(`🖥️  Platform: ${platform}`, 'cyan');
  log(`📁 Dist path: ${distPath}`, 'cyan');

  // Find the appropriate executable
  let executablePath = null;
  
  if (platform === 'darwin') {
    // macOS
    const appPath = fs.readdirSync(distPath).find(item => item.endsWith('.app'));
    if (appPath) {
      executablePath = path.join(distPath, appPath);
      log(`🍎 Found macOS app: ${appPath}`, 'green');
    }
  } else if (platform === 'linux') {
    // Linux
    const appImage = fs.readdirSync(distPath).find(item => item.endsWith('.AppImage'));
    if (appImage) {
      executablePath = path.join(distPath, appImage);
      log(`🐧 Found Linux AppImage: ${appImage}`, 'green');
    }
  } else if (platform === 'win32') {
    // Windows
    const exe = fs.readdirSync(distPath).find(item => item.endsWith('.exe'));
    if (exe) {
      executablePath = path.join(distPath, exe);
      log(`🪟 Found Windows executable: ${exe}`, 'green');
    }
  }

  if (!executablePath) {
    log('❌ No suitable executable found for current platform', 'red');
    return false;
  }

  // Make executable (Linux/macOS)
  if (platform !== 'win32') {
    execCommand(`chmod +x "${executablePath}"`);
  }

  log(`✅ Local deployment ready: ${executablePath}`, 'green');
  log('💡 You can now run the application from the dist directory', 'cyan');
  
  return true;
}

function deployToSnap() {
  log('\n📦 Deploying to Snap Store...', 'blue');
  
  // Check if snapcraft is installed
  try {
    execSync('snapcraft --version', { stdio: 'pipe' });
    log('✅ Snapcraft found', 'green');
  } catch (error) {
    log('❌ Snapcraft not found. Please install it first.', 'red');
    return false;
  }

  // Check if we have a snap file
  const snapFiles = fs.readdirSync('dist').filter(file => file.endsWith('.snap'));
  if (snapFiles.length === 0) {
    log('❌ No snap files found in dist directory', 'red');
    return false;
  }

  const snapFile = snapFiles[0];
  log(`📦 Found snap file: ${snapFile}`, 'cyan');

  // Upload to snap store without invoking a shell
  const snapPath = path.join('dist', snapFile);
  try {
    log(`\n🔧 Executing: snapcraft upload ${snapPath}`, 'cyan');
    require('child_process').execFileSync('snapcraft', ['upload', snapPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    log(`❌ Command failed: snapcraft upload ${snapPath}`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }

  log('✅ Successfully uploaded to Snap Store', 'green');
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'local';
  const options = args.slice(1);

  log('🚀 SORA Deployment Script', 'bright');
  log('==========================', 'bright');

  // Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }

  let success = false;

  switch (target) {
    case 'github':
      success = deployToGitHub();
      break;
    case 'release':
      success = deployToGitHubReleases();
      break;
    case 'local':
      success = deployToLocal();
      break;
    case 'snap':
      success = deployToSnap();
      break;
    default:
      log(`❌ Unknown deployment target: ${target}`, 'red');
      log('Available targets: local, github, release, snap', 'cyan');
      process.exit(1);
  }

  if (success) {
    log('\n✅ Deployment completed successfully!', 'green');
  } else {
    log('\n❌ Deployment failed!', 'red');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`
SORA Deployment Script

Usage: node scripts/deploy.js [target] [options]

Targets:
  local        Deploy locally (default)
  github       Deploy to GitHub (push to remote)
  release      Create GitHub release
  snap         Deploy to Snap Store

Options:
  --help, -h   Show this help

Examples:
  node scripts/deploy.js
  node scripts/deploy.js local
  node scripts/deploy.js github
  node scripts/deploy.js release
  node scripts/deploy.js snap
  `, 'cyan');
  process.exit(0);
}

main();