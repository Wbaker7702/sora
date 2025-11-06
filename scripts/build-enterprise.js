#!/usr/bin/env node

/**
 * Enterprise Build Script
 * Builds Sora for enterprise deployment with enhanced features
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_CONFIG = require('../build-config-enterprise.json');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    log(`\n${colors.blue}▶ ${command}${colors.reset}`);
    
    // Determine if we should use yarn or npm
    const useYarn = fs.existsSync(path.join(__dirname, '..', 'yarn.lock'));
    let actualCommand = command;
    
    // If command starts with a package command, try to use yarn
    if (useYarn && !command.startsWith('npx') && !command.includes('node ')) {
      // For yarn PnP, we need to use yarn run
      if (command.includes('nextron') || command.includes('electron-builder')) {
        actualCommand = `yarn ${command}`;
      }
    }
    
    execSync(actualCommand, { 
      stdio: 'inherit',
      cwd: options.cwd || path.join(__dirname, '..'),
      ...options 
    });
    return true;
  } catch (error) {
    log(`\n${colors.red}✖ Command failed: ${command}${colors.reset}`);
    return false;
  }
}

function validateEnvironment() {
  log('\n=== Validating Environment ===', colors.bright);
  
  // Check if required directories exist
  const requiredDirs = ['main', 'renderer', 'resources', 'scripts'];
  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      log(`✖ Missing required directory: ${dir}`, colors.red);
      return false;
    }
  }
  
  log('✓ Environment validation passed', colors.green);
  return true;
}

function setupEnterpriseResources() {
  log('\n=== Setting up Enterprise Resources ===', colors.bright);
  
  const resourceDirs = ['licenses', 'docs', 'templates'];
  for (const dir of resourceDirs) {
    const dirPath = path.join(__dirname, '..', 'resources', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log(`✓ Created directory: resources/${dir}`, colors.green);
    }
  }
  
  // Create enterprise marker file in multiple locations
  const markerData = JSON.stringify({
    version: BUILD_CONFIG.enterprise.version,
    buildDate: new Date().toISOString(),
    features: BUILD_CONFIG.enterprise.features
  }, null, 2);
  
  // Create in root for build process to pick up
  const rootMarker = path.join(__dirname, '..', '.enterprise');
  fs.writeFileSync(rootMarker, markerData);
  
  // Create in app directory if it exists (post-build)
  const appDir = path.join(__dirname, '..', 'app');
  if (fs.existsSync(appDir)) {
    const appMarker = path.join(appDir, '.enterprise');
    fs.writeFileSync(appMarker, markerData);
  }
  
  log('✓ Created enterprise marker file', colors.green);
  
  return true;
}

function prepareApp() {
  log('\n=== Preparing Application ===', colors.bright);
  
  // Build using the standard nextron build process
  log('Building application with nextron...', colors.blue);
  const buildCmd = 'nextron build --no-pack';
  
  // Try with npx if direct command fails
  if (!exec(buildCmd)) {
    log('Retrying with npx...', colors.yellow);
    if (!exec(`npx ${buildCmd}`)) {
      log('✖ Failed to build application', colors.red);
      return false;
    }
  }
  
  log('✓ Application prepared', colors.green);
  return true;
}

function buildEnterprise(platform = 'all') {
  log(`\n=== Building Enterprise Version for ${platform} ===`, colors.bright);
  
  // Use electron-builder directly with enterprise config
  const config = 'electron-builder-enterprise.yml';
  let command = '';
  
  switch (platform) {
    case 'mac':
      command = `npx electron-builder --mac --universal --config ${config}`;
      break;
    case 'windows':
    case 'win':
      command = `npx electron-builder --win --x64 --ia32 --config ${config}`;
      break;
    case 'linux':
      command = `npx electron-builder --linux --config ${config}`;
      break;
    case 'all':
      log('\n Building for all platforms...', colors.yellow);
      // Note: Building sequentially instead of parallel to avoid issues
      log('\n⚠️  Note: Sequential builds may take a long time. Consider building per platform.', colors.yellow);
      const macResult = buildEnterprise('mac');
      if (!macResult) log('⚠️  macOS build failed', colors.yellow);
      
      const winResult = buildEnterprise('windows');
      if (!winResult) log('⚠️  Windows build failed', colors.yellow);
      
      const linuxResult = buildEnterprise('linux');
      if (!linuxResult) log('⚠️  Linux build failed', colors.yellow);
      
      return macResult || winResult || linuxResult; // Success if at least one succeeds
    default:
      log(`Unknown platform: ${platform}`, colors.red);
      return false;
  }
  
  return exec(command, { 
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: 'true'
    },
    cwd: path.join(__dirname, '..')
  });
}

function generateChecksums() {
  log('\n=== Generating Checksums ===', colors.bright);
  
  const distPath = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distPath)) {
    log('✖ Dist directory not found', colors.red);
    return false;
  }
  
  try {
    const crypto = require('crypto');
    const files = fs.readdirSync(distPath);
    const checksums = {};
    
    for (const file of files) {
      const filePath = path.join(distPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && !file.endsWith('.yml') && !file.endsWith('.json')) {
        const content = fs.readFileSync(filePath);
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        checksums[file] = {
          sha256: hash,
          size: stats.size,
          date: stats.mtime.toISOString()
        };
        log(`✓ ${file}: ${hash}`, colors.green);
      }
    }
    
    fs.writeFileSync(
      path.join(distPath, 'checksums.json'),
      JSON.stringify(checksums, null, 2)
    );
    log('✓ Checksums generated', colors.green);
    return true;
  } catch (error) {
    log(`✖ Error generating checksums: ${error.message}`, colors.red);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || 'all';
  
  log('\n╔════════════════════════════════════════╗', colors.bright);
  log('║   SORA ENTERPRISE BUILD SCRIPT        ║', colors.bright);
  log('╚════════════════════════════════════════╝', colors.bright);
  
  log(`\nVersion: ${BUILD_CONFIG.enterprise.version}`, colors.blue);
  log(`Platform: ${platform}`, colors.blue);
  log(`Date: ${new Date().toISOString()}`, colors.blue);
  
  if (!validateEnvironment()) {
    log('\n✖ Environment validation failed', colors.red);
    process.exit(1);
  }
  
  if (!setupEnterpriseResources()) {
    log('\n✖ Failed to setup enterprise resources', colors.red);
    process.exit(1);
  }
  
  if (!prepareApp()) {
    log('\n✖ Failed to prepare application', colors.red);
    process.exit(1);
  }
  
  if (!buildEnterprise(platform)) {
    log('\n✖ Build failed', colors.red);
    process.exit(1);
  }
  
  if (!generateChecksums()) {
    log('\n⚠ Warning: Failed to generate checksums', colors.yellow);
  }
  
  log('\n╔════════════════════════════════════════╗', colors.green);
  log('║   ✓ ENTERPRISE BUILD COMPLETED        ║', colors.green);
  log('╚════════════════════════════════════════╝', colors.green);
}

if (require.main === module) {
  main();
}

module.exports = { buildEnterprise, generateChecksums };
