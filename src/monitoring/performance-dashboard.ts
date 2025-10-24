import { app, BrowserWindow, ipcMain } from 'electron';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { captureMessage, trackPerformance, trackFeatureUsage } from './sentry';

interface PerformanceMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  app: {
    uptime: number;
    windowCount: number;
    activeWindow: boolean;
  };
  features: {
    [key: string]: {
      count: number;
      totalTime: number;
      averageTime: number;
      lastUsed: number;
    };
  };
  network: {
    requests: number;
    totalSize: number;
    averageResponseTime: number;
  };
  errors: {
    count: number;
    lastError: string;
    lastErrorTime: number;
  };
}

class PerformanceDashboard {
  private metrics: PerformanceMetrics;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private featureTimers: Map<string, number> = new Map();

  constructor() {
    this.metrics = {
      timestamp: Date.now(),
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0],
      },
      memory: {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0,
      },
      app: {
        uptime: 0,
        windowCount: 0,
        activeWindow: false,
      },
      features: {},
      network: {
        requests: 0,
        totalSize: 0,
        averageResponseTime: 0,
      },
      errors: {
        count: 0,
        lastError: '',
        lastErrorTime: 0,
      },
    };
  }

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('📊 Performance dashboard started');
    
    // Start collecting metrics every 5 seconds
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, 5000);

    // Set up IPC handlers
    this.setupIpcHandlers();
  }

  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('📊 Performance dashboard stopped');
  }

  private collectMetrics(): void {
    try {
      this.metrics.timestamp = Date.now();
      
      // CPU metrics
      this.metrics.cpu.usage = process.cpuUsage().user / 1000000; // Convert to seconds
      this.metrics.cpu.loadAverage = require('os').loadavg();

      // Memory metrics
      const memUsage = process.memoryUsage();
      this.metrics.memory = {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      };

      // App metrics
      this.metrics.app.uptime = process.uptime();
      this.metrics.app.windowCount = BrowserWindow.getAllWindows().length;
      this.metrics.app.activeWindow = BrowserWindow.getFocusedWindow() !== null;

      // Save metrics
      this.saveMetrics();

    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    }
  }

  public trackFeature(feature: string, action: string, duration?: number): void {
    const key = `${feature}:${action}`;
    const now = Date.now();
    
    if (!this.metrics.features[key]) {
      this.metrics.features[key] = {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        lastUsed: now,
      };
    }

    const featureMetrics = this.metrics.features[key];
    featureMetrics.count++;
    featureMetrics.lastUsed = now;
    
    if (duration !== undefined) {
      featureMetrics.totalTime += duration;
      featureMetrics.averageTime = featureMetrics.totalTime / featureMetrics.count;
    }

    // Track in Sentry
    trackFeatureUsage(feature, action, { duration, count: featureMetrics.count });
  }

  public startFeatureTimer(feature: string, action: string): void {
    const key = `${feature}:${action}`;
    this.featureTimers.set(key, Date.now());
  }

  public endFeatureTimer(feature: string, action: string): number {
    const key = `${feature}:${action}`;
    const startTime = this.featureTimers.get(key);
    
    if (startTime) {
      const duration = Date.now() - startTime;
      this.trackFeature(feature, action, duration);
      this.featureTimers.delete(key);
      return duration;
    }
    
    return 0;
  }

  public trackNetworkRequest(size: number, responseTime: number): void {
    this.metrics.network.requests++;
    this.metrics.network.totalSize += size;
    this.metrics.network.averageResponseTime = 
      (this.metrics.network.averageResponseTime * (this.metrics.network.requests - 1) + responseTime) / 
      this.metrics.network.requests;
  }

  public trackError(error: string): void {
    this.metrics.errors.count++;
    this.metrics.errors.lastError = error;
    this.metrics.errors.lastErrorTime = Date.now();
  }

  private setupIpcHandlers(): void {
    // Get current metrics
    ipcMain.handle('get-performance-metrics', () => {
      return this.metrics;
    });

    // Get feature metrics
    ipcMain.handle('get-feature-metrics', () => {
      return this.metrics.features;
    });

    // Get memory usage
    ipcMain.handle('get-memory-usage', () => {
      return this.metrics.memory;
    });

    // Get CPU usage
    ipcMain.handle('get-cpu-usage', () => {
      return this.metrics.cpu;
    });

    // Start feature timer
    ipcMain.handle('start-feature-timer', (event, feature: string, action: string) => {
      this.startFeatureTimer(feature, action);
    });

    // End feature timer
    ipcMain.handle('end-feature-timer', (event, feature: string, action: string) => {
      return this.endFeatureTimer(feature, action);
    });

    // Track feature usage
    ipcMain.handle('track-feature', (event, feature: string, action: string, duration?: number) => {
      this.trackFeature(feature, action, duration);
    });

    // Track network request
    ipcMain.handle('track-network-request', (event, size: number, responseTime: number) => {
      this.trackNetworkRequest(size, responseTime);
    });

    // Track error
    ipcMain.handle('track-error', (event, error: string) => {
      this.trackError(error);
    });
  }

  private saveMetrics(): void {
    try {
      const metricsPath = join(process.cwd(), 'performance-metrics.json');
      const existingMetrics = existsSync(metricsPath) ? 
        JSON.parse(readFileSync(metricsPath, 'utf8')) : [];
      
      existingMetrics.push(this.metrics);
      
      // Keep only last 1000 entries (about 1.4 hours at 5-second intervals)
      if (existingMetrics.length > 1000) {
        existingMetrics.splice(0, existingMetrics.length - 1000);
      }
      
      writeFileSync(metricsPath, JSON.stringify(existingMetrics, null, 2));
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }

  public generateReport(): string {
    const metrics = this.metrics;
    const report = `
# Performance Report

## System Metrics
- **CPU Usage**: ${metrics.cpu.usage.toFixed(2)}s
- **Load Average**: ${metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}
- **Memory RSS**: ${this.formatBytes(metrics.memory.rss)}
- **Memory Heap**: ${this.formatBytes(metrics.memory.heapUsed)} / ${this.formatBytes(metrics.memory.heapTotal)}
- **Memory External**: ${this.formatBytes(metrics.memory.external)}

## App Metrics
- **Uptime**: ${Math.floor(metrics.app.uptime / 60)} minutes
- **Window Count**: ${metrics.app.windowCount}
- **Active Window**: ${metrics.app.activeWindow ? 'Yes' : 'No'}

## Feature Usage
${Object.entries(metrics.features).map(([key, data]) => `
### ${key}
- **Count**: ${data.count}
- **Total Time**: ${data.totalTime}ms
- **Average Time**: ${data.averageTime.toFixed(2)}ms
- **Last Used**: ${new Date(data.lastUsed).toLocaleString()}
`).join('')}

## Network
- **Requests**: ${metrics.network.requests}
- **Total Size**: ${this.formatBytes(metrics.network.totalSize)}
- **Average Response Time**: ${metrics.network.averageResponseTime.toFixed(2)}ms

## Errors
- **Count**: ${metrics.errors.count}
- **Last Error**: ${metrics.errors.lastError || 'None'}
- **Last Error Time**: ${metrics.errors.lastErrorTime ? new Date(metrics.errors.lastErrorTime).toLocaleString() : 'Never'}
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

  public getMetrics(): PerformanceMetrics {
    return this.metrics;
  }
}

export default PerformanceDashboard;