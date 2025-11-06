#!/usr/bin/env node

/**
 * Simple Enterprise Build Wrapper
 * Uses the existing build system with enterprise configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function exec(command) {
  try {
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    return true;
  } catch (error) {
    return false;
  }
}

const platform = process.argv[2] || 'linux';

log('\n╔════════════════════════════════════════╗', colors.bright);
log('║   SORA ENTERPRISE BUILD (SIMPLE)      ║', colors.bright);
log('╚════════════════════════════════════════╝', colors.bright);

log(`\nBuilding for: ${platform}`, colors.blue);
log('Using electron-builder-enterprise.yml configuration\n', colors.blue);

// Map platform to electron-builder commands
const platformMap = {
  'mac': '--mac',
  'macos': '--mac',
  'darwin': '--mac',
  'win': '--win',
  'windows': '--win',
  'linux': '--linux',
  'all': '--mac --win --linux'
};

const buildFlag = platformMap[platform.toLowerCase()] || '--linux';

// Use electron-builder directly with enterprise config
const command = `npx electron-builder ${buildFlag} --config electron-builder-enterprise.yml`;

log(`${colors.blue}Running: ${command}${colors.reset}\n`);

if (exec(command)) {
  log('\n╔════════════════════════════════════════╗', colors.green);
  log('║   ✓ BUILD COMPLETED                   ║', colors.green);
  log('╚════════════════════════════════════════╝', colors.green);
  log('\nBuilt files are in the dist/ directory', colors.green);
} else {
  log('\n╔════════════════════════════════════════╗', colors.red);
  log('║   ✖ BUILD FAILED                      ║', colors.red);
  log('╚════════════════════════════════════════╝', colors.red);
  log('\nTry running: npm run build:linux first', colors.yellow);
  log('Then run: npx electron-builder --linux --config electron-builder-enterprise.yml', colors.yellow);
  process.exit(1);
}
