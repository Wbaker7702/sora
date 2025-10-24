import * as Sentry from '@sentry/electron';
import { app, BrowserWindow } from 'electron';
import { version } from '../../package.json';

// Sentry configuration
const SENTRY_DSN = process.env.SENTRY_DSN || 'https://your-dsn@sentry.io/project-id';

export function initSentry() {
  // Initialize Sentry
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `sora@${version}`,
    tracesSampleRate: 0.1, // 10% of transactions
    beforeSend(event) {
      // Filter out sensitive data
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      
      // Filter out development errors in production
      if (process.env.NODE_ENV === 'production' && event.exception) {
        const error = event.exception.values?.[0];
        if (error?.type === 'ChunkLoadError' || error?.type === 'Loading chunk') {
          return null; // Don't send chunk load errors
        }
      }
      
      return event;
    },
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Console(),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
  });

  // Set user context
  Sentry.setUser({
    id: 'anonymous',
    username: 'sora-user',
  });

  // Set tags
  Sentry.setTag('app', 'sora');
  Sentry.setTag('platform', process.platform);
  Sentry.setTag('arch', process.arch);
  Sentry.setTag('electron_version', process.versions.electron);
  Sentry.setTag('node_version', process.versions.node);

  // Set context
  Sentry.setContext('app_info', {
    name: 'Sora',
    version: version,
    platform: process.platform,
    arch: process.arch,
    electron_version: process.versions.electron,
    node_version: process.versions.node,
  });

  console.log('✅ Sentry initialized successfully');
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional_info', context);
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

export function captureBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
}

export function setUser(user: { id: string; username?: string; email?: string }) {
  Sentry.setUser(user);
}

export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

export function setContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context);
}

// Performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}

export function finishTransaction(transaction: any) {
  transaction.finish();
}

// Custom error boundary for renderer process
export function setupErrorBoundary() {
  // This will be called from the renderer process
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      captureException(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      captureException(new Error(event.reason), {
        type: 'unhandledrejection',
        reason: event.reason,
      });
    });
  }
}

// Performance metrics
export function trackPerformance(name: string, duration: number, metadata?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `Performance: ${name}`,
    category: 'performance',
    level: 'info',
    data: {
      duration,
      ...metadata,
    },
    timestamp: Date.now() / 1000,
  });
}

// Feature usage tracking
export function trackFeatureUsage(feature: string, action: string, metadata?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `Feature: ${feature} - ${action}`,
    category: 'feature_usage',
    level: 'info',
    data: metadata,
    timestamp: Date.now() / 1000,
  });
}

// Build and deployment tracking
export function trackBuild(buildInfo: {
  version: string;
  platform: string;
  arch: string;
  buildTime: number;
  success: boolean;
}) {
  Sentry.setContext('build_info', buildInfo);
  
  if (buildInfo.success) {
    captureMessage(`Build successful: ${buildInfo.version}`, 'info');
  } else {
    captureMessage(`Build failed: ${buildInfo.version}`, 'error');
  }
}

// Network request tracking
export function trackNetworkRequest(url: string, method: string, status: number, duration: number) {
  Sentry.addBreadcrumb({
    message: `Network: ${method} ${url}`,
    category: 'network',
    level: status >= 400 ? 'error' : 'info',
    data: {
      url,
      method,
      status,
      duration,
    },
    timestamp: Date.now() / 1000,
  });
}

// Soroban CLI command tracking
export function trackSorobanCommand(command: string, success: boolean, duration: number, error?: string) {
  Sentry.addBreadcrumb({
    message: `Soroban CLI: ${command}`,
    category: 'soroban_cli',
    level: success ? 'info' : 'error',
    data: {
      command,
      success,
      duration,
      error,
    },
    timestamp: Date.now() / 1000,
  });
}

export default Sentry;