export const MONITORING_CONFIG = {
  // Sentry configuration
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
  },

  // Performance monitoring
  performance: {
    collectionInterval: 5000, // 5 seconds
    maxMetricsHistory: 1000, // Keep last 1000 entries
    enableFeatureTracking: true,
    enableNetworkTracking: true,
    enableErrorTracking: true,
  },

  // Build monitoring
  build: {
    enableBuildTracking: true,
    trackDependencies: true,
    trackBuildSize: true,
    trackBuildHealth: true,
    maxBuildHistory: 100, // Keep last 100 builds
  },

  // Feature tracking
  features: {
    trackButtonClicks: true,
    trackFormSubmissions: true,
    trackNavigation: true,
    trackFileOperations: true,
    trackSorobanCommands: true,
  },

  // Error tracking
  errors: {
    enableErrorBoundary: true,
    trackUnhandledRejections: true,
    trackUncaughtExceptions: true,
    trackRenderProcessCrashes: true,
    trackChildProcessCrashes: true,
  },

  // Network monitoring
  network: {
    trackRequests: true,
    trackResponseTimes: true,
    trackRequestSizes: true,
    trackErrors: true,
  },

  // Privacy settings
  privacy: {
    anonymizeUserData: true,
    excludeSensitiveData: true,
    enableDataRetention: true,
    dataRetentionDays: 30,
  },
};

export default MONITORING_CONFIG;