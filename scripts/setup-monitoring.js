#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

function setupSentry() {
  log('\n🔧 Setting up Sentry...', 'blue');
  
  // Check if Sentry is already installed
  if (fs.existsSync('node_modules/@sentry/electron')) {
    log('✅ Sentry already installed', 'green');
    return true;
  }

  // Install Sentry
  if (execCommand('npm install @sentry/electron')) {
    log('✅ Sentry installed successfully', 'green');
    return true;
  } else {
    log('❌ Failed to install Sentry', 'red');
    return false;
  }
}

function createEnvironmentFile() {
  log('\n📝 Creating monitoring environment file...', 'blue');
  
  const envContent = `# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn_here
NODE_ENV=development

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_COLLECTION_INTERVAL=5000

# Build Monitoring
ENABLE_BUILD_MONITORING=true
TRACK_BUILD_METRICS=true

# Feature Tracking
ENABLE_FEATURE_TRACKING=true
TRACK_USER_INTERACTIONS=true

# Error Tracking
ENABLE_ERROR_TRACKING=true
TRACK_CRASHES=true
`;

  const envPath = '.env.monitoring';
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    log('✅ Created .env.monitoring file', 'green');
    log('Please update the Sentry DSN in .env.monitoring', 'yellow');
  } else {
    log('✅ .env.monitoring file already exists', 'green');
  }
}

function createMonitoringDirectories() {
  log('\n📁 Creating monitoring directories...', 'blue');
  
  const directories = [
    'src/monitoring',
    'logs/monitoring',
    'reports/monitoring',
    'data/monitoring'
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`✅ Created directory: ${dir}`, 'green');
    } else {
      log(`✅ Directory exists: ${dir}`, 'green');
    }
  });
}

function setupLogging() {
  log('\n📊 Setting up logging...', 'blue');
  
  const loggingConfig = {
    level: 'info',
    format: 'json',
    transports: [
      {
        type: 'file',
        filename: 'logs/monitoring/app.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5
      },
      {
        type: 'console',
        colorize: true
      }
    ]
  };

  const configPath = 'src/monitoring/logging.json';
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(loggingConfig, null, 2));
    log('✅ Created logging configuration', 'green');
  } else {
    log('✅ Logging configuration already exists', 'green');
  }
}

function createMonitoringScripts() {
  log('\n🔧 Creating monitoring scripts...', 'blue');
  
  const scripts = {
    'scripts/monitoring/start-monitoring.js': `#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('🚀 Starting monitoring...');

// Start performance monitoring
execSync('node src/monitoring/performance-dashboard.js', { stdio: 'inherit' });

// Start error tracking
execSync('node src/monitoring/error-tracker.js', { stdio: 'inherit' });

console.log('✅ Monitoring started successfully');
`,

    'scripts/monitoring/stop-monitoring.js': `#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('🛑 Stopping monitoring...');

// Stop monitoring processes
try {
  execSync('pkill -f "performance-dashboard"', { stdio: 'pipe' });
  execSync('pkill -f "error-tracker"', { stdio: 'pipe' });
  console.log('✅ Monitoring stopped successfully');
} catch (error) {
  console.log('⚠️  Some monitoring processes may still be running');
}
`,

    'scripts/monitoring/generate-report.js': `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('📊 Generating monitoring report...');

// Read performance metrics
const performancePath = 'performance-metrics.json';
const buildPath = 'build-metrics.json';

let report = '# Monitoring Report\\n\\n';
report += \`Generated at: \${new Date().toLocaleString()}\\n\\n\`;

if (fs.existsSync(performancePath)) {
  const metrics = JSON.parse(fs.readFileSync(performancePath, 'utf8'));
  report += \`## Performance Metrics\\n\`;
  report += \`- Total entries: \${metrics.length}\\n\`;
  report += \`- Last update: \${new Date(metrics[metrics.length - 1]?.timestamp).toLocaleString()}\\n\\n\`;
}

if (fs.existsSync(buildPath)) {
  const builds = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
  report += \`## Build Metrics\\n\`;
  report += \`- Total builds: \${builds.length}\\n\`;
  report += \`- Successful builds: \${builds.filter(b => b.success).length}\\n\`;
  report += \`- Failed builds: \${builds.filter(b => !b.success).length}\\n\\n\`;
}

// Save report
const reportPath = 'reports/monitoring-report.md';
fs.writeFileSync(reportPath, report);
console.log(\`✅ Report saved to \${reportPath}\`);
`
  };

  Object.entries(scripts).forEach(([filePath, content]) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      log(`✅ Created script: ${filePath}`, 'green');
    } else {
      log(`✅ Script exists: ${filePath}`, 'green');
    }
  });
}

function updatePackageJson() {
  log('\n📦 Updating package.json...', 'blue');
  
  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add monitoring scripts
  const monitoringScripts = {
    'monitoring:start': 'node scripts/monitoring/start-monitoring.js',
    'monitoring:stop': 'node scripts/monitoring/stop-monitoring.js',
    'monitoring:report': 'node scripts/monitoring/generate-report.js',
    'monitoring:setup': 'node scripts/setup-monitoring.js'
  };
  
  packageJson.scripts = { ...packageJson.scripts, ...monitoringScripts };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  log('✅ Updated package.json with monitoring scripts', 'green');
}

function main() {
  log('🚀 Sora Monitoring Setup', 'bright');
  log('========================', 'bright');

  let allStepsPassed = true;

  // Setup steps
  if (!setupSentry()) {
    allStepsPassed = false;
  }

  createEnvironmentFile();
  createMonitoringDirectories();
  setupLogging();
  createMonitoringScripts();
  updatePackageJson();

  if (allStepsPassed) {
    log('\n✅ Monitoring setup completed successfully!', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Update .env.monitoring with your Sentry DSN', 'cyan');
    log('2. Run "npm run monitoring:start" to start monitoring', 'cyan');
    log('3. Run "npm run monitoring:report" to generate reports', 'cyan');
    log('4. Check the monitoring dashboard in the app', 'cyan');
  } else {
    log('\n⚠️  Monitoring setup completed with warnings', 'yellow');
    log('Please check the failed steps and run setup again', 'yellow');
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log(`
Sora Monitoring Setup

Usage: node scripts/setup-monitoring.js [options]

Options:
  --help, -h    Show this help

This script will:
- Install Sentry for error tracking
- Create monitoring directories
- Set up logging configuration
- Create monitoring scripts
- Update package.json with monitoring commands

Requirements:
- Node.js v20 or higher
- npm or yarn
- Internet connection for package installation
  `, 'cyan');
  process.exit(0);
}

main();