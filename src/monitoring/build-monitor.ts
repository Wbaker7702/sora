import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { captureMessage, trackBuild, trackPerformance } from './sentry';

interface BuildMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  platform: string;
  arch: string;
  nodeVersion: string;
  npmVersion: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  buildSize: number;
  success: boolean;
  error?: string;
  warnings: string[];
  dependencies: {
    total: number;
    outdated: number;
    vulnerabilities: number;
  };
}

class BuildMonitor {
  private metrics: BuildMetrics;
  private startTime: number;
  private warnings: string[] = [];

  constructor(platform: string) {
    this.startTime = Date.now();
    this.metrics = {
      startTime: this.startTime,
      endTime: 0,
      duration: 0,
      platform,
      arch: process.arch,
      nodeVersion: process.version,
      npmVersion: this.getNpmVersion(),
      memoryUsage: process.memoryUsage(),
      buildSize: 0,
      success: false,
      warnings: [],
      dependencies: {
        total: 0,
        outdated: 0,
        vulnerabilities: 0,
      },
    };
  }

  private getNpmVersion(): string {
    try {
      return execSync('npm --version', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  public startBuild(): void {
    console.log(`🚀 Starting build for ${this.metrics.platform}...`);
    captureMessage(`Build started for ${this.metrics.platform}`, 'info');
  }

  public addWarning(warning: string): void {
    this.warnings.push(warning);
    console.warn(`⚠️  ${warning}`);
  }

  public async checkDependencies(): Promise<void> {
    try {
      console.log('📦 Checking dependencies...');
      
      // Check outdated dependencies
      const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(outdatedOutput);
      this.metrics.dependencies.outdated = Object.keys(outdated).length;

      // Check vulnerabilities
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditOutput);
      this.metrics.dependencies.vulnerabilities = audit.metadata?.vulnerabilities?.total || 0;

      // Get total dependencies
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      this.metrics.dependencies.total = Object.keys(packageJson.dependencies || {}).length + 
                                       Object.keys(packageJson.devDependencies || {}).length;

      if (this.metrics.dependencies.outdated > 0) {
        this.addWarning(`${this.metrics.dependencies.outdated} outdated dependencies found`);
      }

      if (this.metrics.dependencies.vulnerabilities > 0) {
        this.addWarning(`${this.metrics.dependencies.vulnerabilities} vulnerabilities found`);
      }

    } catch (error) {
      this.addWarning(`Failed to check dependencies: ${error.message}`);
    }
  }

  public async measureBuildSize(): Promise<void> {
    try {
      const distPath = join(process.cwd(), 'dist');
      if (existsSync(distPath)) {
        const sizeOutput = execFileSync('du', ['-sh', distPath], { encoding: 'utf8' });
        const sizeMatch = sizeOutput.match(/^(\d+(?:\.\d+)?)([KMGT]?)/);
        if (sizeMatch) {
          const size = parseFloat(sizeMatch[1]);
          const unit = sizeMatch[2];
          this.metrics.buildSize = this.convertToBytes(size, unit);
        }
      }
    } catch (error) {
      this.addWarning(`Failed to measure build size: ${error.message}`);
    }
  }

  private convertToBytes(size: number, unit: string): number {
    const multipliers: { [key: string]: number } = {
      'K': 1024,
      'M': 1024 * 1024,
      'G': 1024 * 1024 * 1024,
      'T': 1024 * 1024 * 1024 * 1024,
    };
    return size * (multipliers[unit] || 1);
  }

  public async checkBuildHealth(): Promise<void> {
    try {
      console.log('🏥 Checking build health...');
      
      // Check if main files exist
      const mainFiles = ['app/background.js', 'app/preload.js'];
      for (const file of mainFiles) {
        if (!existsSync(join(process.cwd(), file))) {
          this.addWarning(`Missing main file: ${file}`);
        }
      }

      // Check for common build issues
      const distPath = join(process.cwd(), 'dist');
      if (existsSync(distPath)) {
        // Recursively find up to 10 ".js" files in distPath (no shell execution)
        const jsFiles: string[] = [];
        function findJsFiles(dir: string) {
          if (jsFiles.length >= 10) return;
          let entries;
          try {
            entries = require('fs').readdirSync(dir, { withFileTypes: true });
          } catch (e) {
            return;
          }
          for (const entry of entries) {
            if (jsFiles.length >= 10) break;
            const entryPath = require('path').join(dir, entry.name);
            if (entry.isDirectory()) {
              findJsFiles(entryPath);
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
              jsFiles.push(entryPath);
            }
          }
        }
        findJsFiles(distPath);
        if (jsFiles.length === 0) {
          this.addWarning('No JavaScript files found in dist directory');
        }
      }

    } catch (error) {
      this.addWarning(`Build health check failed: ${error.message}`);
    }
  }

  public finishBuild(success: boolean, error?: string): void {
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.startTime;
    this.metrics.success = success;
    this.metrics.error = error;
    this.metrics.warnings = this.warnings;
    this.metrics.memoryUsage = process.memoryUsage();

    // Track performance
    trackPerformance('build', this.metrics.duration, {
      platform: this.metrics.platform,
      success: this.metrics.success,
      buildSize: this.metrics.buildSize,
    });

    // Track build info
    trackBuild({
      version: process.env.npm_package_version || 'unknown',
      platform: this.metrics.platform,
      arch: this.metrics.arch,
      buildTime: this.metrics.duration,
      success: this.metrics.success,
    });

    // Log results
    if (success) {
      console.log(`✅ Build completed successfully in ${this.metrics.duration}ms`);
      captureMessage(`Build completed successfully for ${this.metrics.platform}`, 'info');
    } else {
      console.error(`❌ Build failed: ${error}`);
      captureMessage(`Build failed for ${this.metrics.platform}: ${error}`, 'error');
    }

    // Save metrics
    this.saveMetrics();
  }

  private saveMetrics(): void {
    try {
      const metricsPath = join(process.cwd(), 'build-metrics.json');
      const existingMetrics = existsSync(metricsPath) ? 
        JSON.parse(readFileSync(metricsPath, 'utf8')) : [];
      
      existingMetrics.push(this.metrics);
      
      // Keep only last 100 builds
      if (existingMetrics.length > 100) {
        existingMetrics.splice(0, existingMetrics.length - 100);
      }
      
      writeFileSync(metricsPath, JSON.stringify(existingMetrics, null, 2));
      console.log('📊 Build metrics saved');
    } catch (error) {
      console.error('Failed to save build metrics:', error);
    }
  }

  public getMetrics(): BuildMetrics {
    return this.metrics;
  }

  public generateReport(): string {
    const metrics = this.metrics;
    const report = `
# Build Report

## Summary
- **Platform**: ${metrics.platform}
- **Architecture**: ${metrics.arch}
- **Duration**: ${metrics.duration}ms
- **Success**: ${metrics.success ? '✅' : '❌'}
- **Build Size**: ${this.formatBytes(metrics.buildSize)}

## Dependencies
- **Total**: ${metrics.dependencies.total}
- **Outdated**: ${metrics.dependencies.outdated}
- **Vulnerabilities**: ${metrics.dependencies.vulnerabilities}

## Memory Usage
- **RSS**: ${this.formatBytes(metrics.memoryUsage.rss)}
- **Heap Total**: ${this.formatBytes(metrics.memoryUsage.heapTotal)}
- **Heap Used**: ${this.formatBytes(metrics.memoryUsage.heapUsed)}
- **External**: ${this.formatBytes(metrics.memoryUsage.external)}

## Warnings
${metrics.warnings.length > 0 ? metrics.warnings.map(w => `- ${w}`).join('\n') : 'None'}

## Error
${metrics.error ? metrics.error : 'None'}
    `.trim();

    return report;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default BuildMonitor;