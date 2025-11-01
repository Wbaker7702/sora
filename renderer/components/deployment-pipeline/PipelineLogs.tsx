"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { ScrollArea } from "components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Input } from "components/ui/input";
import { 
  PlayIcon, 
  PauseIcon,
  DownloadIcon,
  CopyIcon,
  TerminalIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  SearchIcon,
  ChevronUpIcon,
  ChevronDownIcon
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

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export default function PipelineLogs({ selectedPipeline }: PipelineLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedStep, setSelectedStep] = useState<string>("all");
  const [logLevel, setLogLevel] = useState<string>("all");
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadLogs() {
      if (!selectedPipeline) {
        setLogs([]);
        return;
      }

      setLoading(true);
      try {
        const logContent = await window.sorobanApi.builds.getLogs(selectedPipeline.id);
        
        if (!logContent) {
          setLogs([]);
          return;
        }

        const logLines = logContent.split("\n").filter(line => line.trim());
        const parsedLogs: LogEntry[] = logLines.map((line) => {
          // Try to parse structured log format
          const timestampMatch = line.match(/\[(.+?)\]/);
          const levelMatch = line.match(/\[(\w+)\]/g);
          let level = "info";
          let timestamp = new Date().toISOString();
          let message = line;

          if (timestampMatch) {
            timestamp = timestampMatch[1];
          }

          if (levelMatch && levelMatch.length > 1) {
            level = levelMatch[1].replace(/[\[\]]/g, "").toLowerCase();
          }

          // Remove timestamps and levels from message
          message = line.replace(/\[.+?\]/g, "").trim() || line;

          return {
            timestamp,
            level,
            message,
          };
        });

        setLogs(parsedLogs);
      } catch (error) {
        console.error("Failed to load logs:", error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, [selectedPipeline]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const regex = new RegExp(searchQuery, "gi");
    const matches: number[] = [];
    logs.forEach((log, index) => {
      if (regex.test(log.message)) {
        matches.push(index);
      }
    });
    setSearchMatches(matches);
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
    }
  }, [searchQuery, logs]);

  const filteredLogs = logs.filter(log => {
    const matchesStep = selectedStep === "all" || log.message.toLowerCase().includes(selectedStep.toLowerCase());
    const matchesLevel = logLevel === "all" || log.level === logLevel;
    const matchesSearch = !searchQuery || searchMatches.includes(logs.indexOf(log));
    return matchesStep && matchesLevel && matchesSearch;
  });

  const navigateMatch = (direction: "next" | "prev") => {
    if (searchMatches.length === 0) return;

    let newIndex = currentMatchIndex;
    if (direction === "next") {
      newIndex = (currentMatchIndex + 1) % searchMatches.length;
    } else {
      newIndex = currentMatchIndex <= 0 ? searchMatches.length - 1 : currentMatchIndex - 1;
    }
    setCurrentMatchIndex(newIndex);
    
    // Scroll to match
    const matchIndex = searchMatches[newIndex];
    const element = document.getElementById(`log-line-${matchIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

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
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
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
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs... (e.g., 'error', 'warning')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && searchMatches.length > 0 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {currentMatchIndex + 1} / {searchMatches.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMatch("prev")}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronUpIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateMatch("next")}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">No logs found</p>
            </div>
          ) : (
            <ScrollArea className="h-96 w-full border rounded-lg">
              <div className="p-4 space-y-1">
                {filteredLogs.map((log, index) => {
                  const originalIndex = logs.indexOf(log);
                  const isMatch = searchMatches.includes(originalIndex) && currentMatchIndex !== -1 && searchMatches[currentMatchIndex] === originalIndex;
                  return (
                    <div
                      key={index}
                      id={`log-line-${originalIndex}`}
                      className={`flex items-start gap-3 text-sm font-mono ${isMatch ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}
                    >
                      <span className="text-muted-foreground text-xs mt-0.5">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <div className={`flex items-center gap-1 ${getLogLevelColor(log.level)}`}>
                        {getLogLevelIcon(log.level)}
                        <span className="font-semibold uppercase text-xs">
                          {log.level}
                        </span>
                      </div>
                      <span className="flex-1">
                        {searchQuery ? (
                          <span dangerouslySetInnerHTML={{
                            __html: log.message.replace(
                              new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                              '<mark>$1</mark>'
                            )
                          }} />
                        ) : (
                          log.message
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
