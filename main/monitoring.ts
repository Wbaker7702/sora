import { app, BrowserWindow } from 'electron';
import { initSentry, captureException, captureMessage, setupErrorBoundary } from '../src/monitoring/sentry';
import BuildMonitor from '../src/monitoring/build-monitor';
import PerformanceDashboard from '../src/monitoring/performance-dashboard';

class MonitoringManager {
  private performanceDashboard: PerformanceDashboard;
  private buildMonitor: BuildMonitor | null = null;

  constructor() {
    this.performanceDashboard = new PerformanceDashboard();
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize Sentry
      initSentry();
      console.log('✅ Sentry initialized');

      // Start performance dashboard
      this.performanceDashboard.start();
      console.log('✅ Performance dashboard started');

      // Set up error handling
      this.setupErrorHandling();

      // Set up app event listeners
      this.setupAppEventListeners();

    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
      captureException(error as Error);
    }
  }

  private setupErrorHandling(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      captureException(error);
      this.performanceDashboard.trackError(error.message);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      captureException(new Error(`Unhandled Rejection: ${reason}`));
      this.performanceDashboard.trackError(`Unhandled Rejection: ${reason}`);
    });

    // Handle Electron app errors
    app.on('render-process-gone', (event, webContents, details) => {
      console.error('Render process gone:', details);
      captureMessage(`Render process gone: ${details.reason}`, 'error');
      this.performanceDashboard.trackError(`Render process gone: ${details.reason}`);
    });

    app.on('child-process-gone', (event, details) => {
      console.error('Child process gone:', details);
      captureMessage(`Child process gone: ${details.type}`, 'error');
      this.performanceDashboard.trackError(`Child process gone: ${details.type}`);
    });
  }

  private setupAppEventListeners(): void {
    // Track app lifecycle events
    app.on('ready', () => {
      captureMessage('App ready', 'info');
      this.performanceDashboard.trackFeature('app', 'ready');
    });

    app.on('window-all-closed', () => {
      captureMessage('All windows closed', 'info');
      this.performanceDashboard.trackFeature('app', 'all-windows-closed');
    });

    app.on('before-quit', () => {
      captureMessage('App quitting', 'info');
      this.performanceDashboard.trackFeature('app', 'quitting');
      this.performanceDashboard.stop();
    });

    // Track window events
    app.on('browser-window-created', (event, window) => {
      captureMessage('Browser window created', 'info');
      this.performanceDashboard.trackFeature('window', 'created');
    });

    app.on('browser-window-focus', (event, window) => {
      this.performanceDashboard.trackFeature('window', 'focused');
    });

    app.on('browser-window-blur', (event, window) => {
      this.performanceDashboard.trackFeature('window', 'blurred');
    });
  }

  public startBuildMonitor(platform: string): BuildMonitor {
    this.buildMonitor = new BuildMonitor(platform);
    this.buildMonitor.startBuild();
    return this.buildMonitor;
  }

  public getPerformanceDashboard(): PerformanceDashboard {
    return this.performanceDashboard;
  }

  public async generateMonitoringReport(): Promise<string> {
    const performanceReport = this.performanceDashboard.generateReport();
    const buildReport = this.buildMonitor?.generateReport() || 'No build data available';
    
    return `
# Sora Monitoring Report

Generated at: ${new Date().toLocaleString()}

## Performance Metrics
${performanceReport}

## Build Metrics
${buildReport}

## System Information
- **Platform**: ${process.platform}
- **Architecture**: ${process.arch}
- **Node Version**: ${process.version}
- **Electron Version**: ${process.versions.electron}
- **App Version**: ${app.getVersion()}
    `.trim();
  }

  public async saveMonitoringReport(): Promise<void> {
    try {
      const report = await this.generateMonitoringReport();
      const fs = require('fs');
      const path = require('path');
      
      const reportPath = path.join(process.cwd(), 'monitoring-report.md');
      fs.writeFileSync(reportPath, report);
      
      console.log('📊 Monitoring report saved to monitoring-report.md');
    } catch (error) {
      console.error('Failed to save monitoring report:', error);
      captureException(error as Error);
    }
  }
}

export default MonitoringManager;