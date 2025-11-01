import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, Cpu, MemoryStick, Network, Activity, AlertTriangle } from 'lucide-react';
import monitoring from '@/lib/monitoring';

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

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    try {
      const newMetrics = await monitoring.getPerformanceMetrics();
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getMemoryUsagePercentage = (): number => {
    if (!metrics) return 0;
    return (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
  };

  const getCpuUsagePercentage = (): number => {
    if (!metrics) return 0;
    return Math.min(metrics.cpu.usage * 10, 100); // Scale for display
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Button
          onClick={refreshMetrics}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCpuUsagePercentage().toFixed(1)}%</div>
                <Progress value={getCpuUsagePercentage()} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Load: {metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getMemoryUsagePercentage().toFixed(1)}%</div>
                <Progress value={getMemoryUsagePercentage()} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatBytes(metrics.memory.heapUsed)} / {formatBytes(metrics.memory.heapTotal)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUptime(metrics.app.uptime)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.app.windowCount} window{metrics.app.windowCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.errors.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.errors.lastError ? 'Last: ' + metrics.errors.lastError.substring(0, 20) + '...' : 'No errors'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Memory Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>RSS</span>
                  <span className="font-mono">{formatBytes(metrics.memory.rss)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Heap Total</span>
                  <span className="font-mono">{formatBytes(metrics.memory.heapTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Heap Used</span>
                  <span className="font-mono">{formatBytes(metrics.memory.heapUsed)}</span>
                </div>
                <div className="flex justify-between">
                  <span>External</span>
                  <span className="font-mono">{formatBytes(metrics.memory.external)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Array Buffers</span>
                  <span className="font-mono">{formatBytes(metrics.memory.arrayBuffers)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.features).map(([key, data]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{key}</h4>
                      <Badge variant="secondary">{data.count} uses</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Time:</span>
                        <span className="ml-2 font-mono">{data.totalTime}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Average Time:</span>
                        <span className="ml-2 font-mono">{data.averageTime.toFixed(2)}ms</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Used:</span>
                        <span className="ml-2 font-mono">
                          {new Date(data.lastUsed).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {Object.keys(metrics.features).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No feature usage data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Total Requests:</span>
                    <span className="ml-2 font-mono">{metrics.network.requests}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Size:</span>
                    <span className="ml-2 font-mono">{formatBytes(metrics.network.totalSize)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Average Response Time:</span>
                    <span className="ml-2 font-mono">{metrics.network.averageResponseTime.toFixed(2)}ms</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;