import { ipcRenderer } from 'electron';

// Performance monitoring for renderer process
class RendererMonitoring {
  private featureTimers: Map<string, number> = new Map();

  constructor() {
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
  }

  private setupErrorHandling(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.trackError(`Uncaught Error: ${event.error?.message || event.message}`);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(`Unhandled Rejection: ${event.reason}`);
    });

    // Handle React errors (if using React Error Boundary)
    if (window.React && window.React.Component) {
      const originalComponentDidCatch = window.React.Component.prototype.componentDidCatch;
      window.React.Component.prototype.componentDidCatch = function(error: Error, errorInfo: any) {
        this.trackError(`React Error: ${error.message}`, errorInfo);
        if (originalComponentDidCatch) {
          originalComponentDidCatch.call(this, error, errorInfo);
        }
      };
    }
  }

  private setupPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.trackPerformance('page_load', {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
        });
      }
    });

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.trackResourceLoad(entry as PerformanceResourceTiming);
        }
      }
    });
    observer.observe({ entryTypes: ['resource'] });
  }

  public startFeatureTimer(feature: string, action: string): void {
    const key = `${feature}:${action}`;
    this.featureTimers.set(key, Date.now());
    
    // Also track in main process
    ipcRenderer.invoke('start-feature-timer', feature, action);
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

  public trackFeature(feature: string, action: string, duration?: number): void {
    // Track in main process
    ipcRenderer.invoke('track-feature', feature, action, duration);
    
    // Log for debugging
    console.log(`📊 Feature: ${feature} - ${action}${duration ? ` (${duration}ms)` : ''}`);
  }

  public trackPerformance(name: string, metrics: Record<string, number>): void {
    console.log(`📊 Performance: ${name}`, metrics);
    
    // Track in main process
    ipcRenderer.invoke('track-feature', 'performance', name, metrics.totalTime || 0);
  }

  public trackResourceLoad(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.requestStart;
    const size = entry.transferSize || 0;
    
    // Track in main process
    ipcRenderer.invoke('track-network-request', size, duration);
    
    console.log(`📊 Resource: ${entry.name} (${duration}ms, ${this.formatBytes(size)})`);
  }

  public trackError(error: string, context?: any): void {
    console.error('📊 Error tracked:', error, context);
    
    // Track in main process
    ipcRenderer.invoke('track-error', error);
  }

  public async getPerformanceMetrics(): Promise<any> {
    return await ipcRenderer.invoke('get-performance-metrics');
  }

  public async getFeatureMetrics(): Promise<any> {
    return await ipcRenderer.invoke('get-feature-metrics');
  }

  public async getMemoryUsage(): Promise<any> {
    return await ipcRenderer.invoke('get-memory-usage');
  }

  public async getCpuUsage(): Promise<any> {
    return await ipcRenderer.invoke('get-cpu-usage');
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create global instance
const monitoring = new RendererMonitoring();

// Export for use in components
export default monitoring;

// Export individual functions for convenience
export const {
  startFeatureTimer,
  endFeatureTimer,
  trackFeature,
  trackPerformance,
  trackError,
  getPerformanceMetrics,
  getFeatureMetrics,
  getMemoryUsage,
  getCpuUsage,
} = monitoring;