"use client";

import React, { useEffect, useState } from "react";
import { useToast } from "hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Badge } from "components/ui/badge";
import { ActivityIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon } from "lucide-react";

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  errorCount: number;
  lastUpdate: Date;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  threshold?: {
    memory: number; // MB
    renderTime: number; // ms
  };
}

export function PerformanceMonitor({ 
  enabled = true, 
  threshold = { memory: 100, renderTime: 100 } 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    errorCount: 0,
    lastUpdate: new Date(),
  });
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!enabled) return;

    let animationFrame: number;
    let startTime = performance.now();

    const measurePerformance = () => {
      const currentTime = performance.now();
      const renderTime = currentTime - startTime;

      // Get memory usage if available
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;

      setMetrics(prev => ({
        memoryUsage,
        renderTime,
        errorCount: prev.errorCount,
        lastUpdate: new Date(),
      }));

      // Check thresholds
      if (memoryUsage > threshold.memory) {
        toast({
          title: "High Memory Usage",
          description: `Memory usage is ${memoryUsage.toFixed(2)}MB, above threshold of ${threshold.memory}MB`,
          variant: "destructive",
        });
      }

      if (renderTime > threshold.renderTime) {
        toast({
          title: "Slow Render",
          description: `Render time is ${renderTime.toFixed(2)}ms, above threshold of ${threshold.renderTime}ms`,
          variant: "destructive",
        });
      }

      startTime = currentTime;
      animationFrame = requestAnimationFrame(measurePerformance);
    };

    animationFrame = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [enabled, threshold, toast]);

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
      }));

      toast({
        title: "JavaScript Error",
        description: event.message,
        variant: "destructive",
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
      }));

      toast({
        title: "Unhandled Promise Rejection",
        description: event.reason?.toString() || "Unknown error",
        variant: "destructive",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [toast]);

  const getStatusColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return "bg-green-500";
    if (value <= threshold) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusIcon = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    if (value <= threshold) return <ClockIcon className="h-4 w-4 text-yellow-500" />;
    return <AlertTriangleIcon className="h-4 w-4 text-red-500" />;
  };

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Performance Monitor</CardTitle>
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {isVisible ? "Hide" : "Show"}
            </button>
          </div>
          <CardDescription className="text-xs">
            Real-time performance metrics
          </CardDescription>
        </CardHeader>
        {isVisible && (
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <ActivityIcon className="h-3 w-3" />
                  Memory Usage
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{metrics.memoryUsage.toFixed(2)}MB</span>
                  {getStatusIcon(metrics.memoryUsage, threshold.memory)}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getStatusColor(metrics.memoryUsage, threshold.memory)}`}
                  style={{ width: `${Math.min((metrics.memoryUsage / threshold.memory) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  Render Time
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{metrics.renderTime.toFixed(2)}ms</span>
                  {getStatusIcon(metrics.renderTime, threshold.renderTime)}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${getStatusColor(metrics.renderTime, threshold.renderTime)}`}
                  style={{ width: `${Math.min((metrics.renderTime / threshold.renderTime) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span>Errors</span>
              <Badge variant={metrics.errorCount > 0 ? "destructive" : "secondary"}>
                {metrics.errorCount}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground">
              Last update: {metrics.lastUpdate.toLocaleTimeString()}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}