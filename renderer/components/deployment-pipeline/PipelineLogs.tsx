"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { ScrollArea } from "components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { 
  PlayIcon, 
  PauseIcon, 
  RotateCcwIcon,
  DownloadIcon,
  CopyIcon,
  TerminalIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from "lucide-react";

interface Pipeline {
  id: string;
  name: string;
  project: string;
  status: "idle" | "running" | "completed" | "failed" | "paused";
  steps: Array<{
    id: string;
    name: string;
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    logs?: string[];
    error?: string;
  }>;
}

interface PipelineLogsProps {
  selectedPipeline: Pipeline | null;
}

const mockLogs = [
  { timestamp: "2024-01-15T10:30:15Z", level: "info", message: "Starting pipeline execution" },
  { timestamp: "2024-01-15T10:30:16Z", level: "info", message: "Checking out code from repository" },
  { timestamp: "2024-01-15T10:30:18Z", level: "info", message: "Code checkout completed successfully" },
  { timestamp: "2024-01-15T10:30:19Z", level: "info", message: "Installing dependencies..." },
  { timestamp: "2024-01-15T10:30:25Z", level: "info", message: "Dependencies installed successfully" },
  { timestamp: "2024-01-15T10:30:26Z", level: "info", message: "Running tests..." },
  { timestamp: "2024-01-15T10:30:45Z", level: "info", message: "All tests passed" },
  { timestamp: "2024-01-15T10:30:46Z", level: "info", message: "Building contract..." },
  { timestamp: "2024-01-15T10:31:15Z", level: "info", message: "Contract built successfully" },
  { timestamp: "2024-01-15T10:31:16Z", level: "info", message: "Deploying to testnet..." },
  { timestamp: "2024-01-15T10:32:15Z", level: "info", message: "Deployment to testnet completed" },
  { timestamp: "2024-01-15T10:32:16Z", level: "info", message: "Running integration tests..." },
  { timestamp: "2024-01-15T10:34:15Z", level: "info", message: "Integration tests passed" },
  { timestamp: "2024-01-15T10:34:16Z", level: "info", message: "Deploying to mainnet..." },
  { timestamp: "2024-01-15T10:35:45Z", level: "info", message: "Pipeline completed successfully" },
];

export default function PipelineLogs({ selectedPipeline }: PipelineLogsProps) {
  const [logs, setLogs] = useState(mockLogs);
  const [selectedStep, setSelectedStep] = useState<string>("all");
  const [logLevel, setLogLevel] = useState<string>("all");
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    if (selectedPipeline) {
      // In a real app, this would fetch logs for the selected pipeline
      setLogs(mockLogs);
    }
  }, [selectedPipeline]);

  const filteredLogs = logs.filter(log => {
    const matchesStep = selectedStep === "all" || log.message.toLowerCase().includes(selectedStep.toLowerCase());
    const matchesLevel = logLevel === "all" || log.level === logLevel;
    return matchesStep && matchesLevel;
  });

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error": return "text-red-500";
      case "warn": return "text-yellow-500";
      case "info": return "text-blue-500";
      case "debug": return "text-gray-500";
      default: return "text-gray-700";
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case "error": return <AlertCircleIcon className="h-4 w-4" />;
      case "warn": return <AlertCircleIcon className="h-4 w-4" />;
      case "info": return <CheckCircleIcon className="h-4 w-4" />;
      case "debug": return <ClockIcon className="h-4 w-4" />;
      default: return <TerminalIcon className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const copyLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(logText);
  };

  const downloadLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-logs-${selectedPipeline?.id || 'unknown'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!selectedPipeline) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TerminalIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pipeline Selected</h3>
          <p className="text-muted-foreground text-center">
            Select a pipeline from the Pipelines tab to view its logs
          </p>
        </CardContent>
      </Card>
    );
  }

  const steps = selectedPipeline.steps || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TerminalIcon className="h-5 w-5" />
                Pipeline Logs
              </CardTitle>
              <CardDescription>
                {selectedPipeline.name} - {selectedPipeline.project}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyLogs}>
                <CopyIcon className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadLogs}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Select value={selectedStep} onValueChange={setSelectedStep}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by step" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Steps</SelectItem>
                {steps.map(step => (
                  <SelectItem key={step.id} value={step.name}>
                    {step.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={logLevel} onValueChange={setLogLevel}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoScroll(!isAutoScroll)}
              >
                {isAutoScroll ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                Auto Scroll
              </Button>
            </div>
          </div>

          <ScrollArea className="h-96 w-full border rounded-lg">
            <div className="p-4 space-y-1">
              {filteredLogs.map((log, index) => (
                <div key={index} className="flex items-start gap-3 text-sm font-mono">
                  <span className="text-muted-foreground text-xs mt-0.5">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <div className={`flex items-center gap-1 ${getLogLevelColor(log.level)}`}>
                    {getLogLevelIcon(log.level)}
                    <span className="font-semibold uppercase text-xs">
                      {log.level}
                    </span>
                  </div>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}