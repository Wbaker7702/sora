"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { Progress } from "components/ui/progress";
import { Alert, AlertDescription } from "components/ui/alert";
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  GitBranchIcon,
  CodeIcon,
  TestTubeIcon,
  RocketIcon,
  SettingsIcon,
  HistoryIcon,
  AlertTriangleIcon
} from "lucide-react";
import { PipelineConfig } from "./PipelineConfig";
import { PipelineHistory } from "./PipelineHistory";
import { PipelineLogs } from "./PipelineLogs";
import { BuildRecord } from "types/builds";

interface PipelineStep {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  duration?: number;
  logs?: string[];
  error?: string;
}

interface Pipeline {
  id: string;
  name: string;
  project: string;
  status: "idle" | "running" | "completed" | "failed" | "paused";
  steps: PipelineStep[];
  createdAt: string;
  updatedAt: string;
  duration?: number;
  trigger: "manual" | "git" | "schedule";
}

// Convert BuildRecord to Pipeline format
const convertToPipeline = (build: BuildRecord): Pipeline => {
  return {
    id: build.id,
    name: build.name,
    project: build.project,
    status: build.status,
    steps: [], // Steps will be populated from config if available
    createdAt: build.createdAt,
    updatedAt: build.completedAt || build.createdAt,
    duration: build.duration,
    trigger: build.trigger,
  };
};

export default function DeploymentPipelineComponent() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [activeTab, setActiveTab] = useState("pipelines");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPipelines() {
      try {
        const builds = await window.sorobanApi.builds.getAll();
        const convertedPipelines = builds.map(convertToPipeline);
        setPipelines(convertedPipelines);
      } catch (error) {
        console.error("Failed to load pipelines:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPipelines();

    // Subscribe to build updates
    const handleBuildUpdate = (build: BuildRecord) => {
      setPipelines((prev) => {
        const index = prev.findIndex((p) => p.id === build.id);
        if (index !== -1) {
          // Update existing
          const updated = [...prev];
          updated[index] = convertToPipeline(build);
          return updated;
        } else {
          // Add new
          return [convertToPipeline(build), ...prev];
        }
      });
    };

    window.sorobanApi.builds.on("build:completed", handleBuildUpdate);
    window.sorobanApi.builds.on("build:updated", handleBuildUpdate);

    return () => {
      window.sorobanApi.builds.off("build:completed", handleBuildUpdate);
      window.sorobanApi.builds.off("build:updated", handleBuildUpdate);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "running": return "bg-blue-500";
      case "failed": return "bg-red-500";
      case "paused": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircleIcon className="h-4 w-4" />;
      case "running": return <PlayIcon className="h-4 w-4" />;
      case "failed": return <XCircleIcon className="h-4 w-4" />;
      case "paused": return <PauseIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleRunPipeline = (pipelineId: string) => {
    setPipelines(prev => prev.map(p => 
      p.id === pipelineId 
        ? { ...p, status: "running" as const, updatedAt: new Date().toISOString() }
        : p
    ));
  };

  const handleStopPipeline = (pipelineId: string) => {
    setPipelines(prev => prev.map(p => 
      p.id === pipelineId 
        ? { ...p, status: "paused" as const, updatedAt: new Date().toISOString() }
        : p
    ));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployment Pipeline</h1>
          <p className="text-muted-foreground">
            Automate your Soroban contract deployment workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setActiveTab("config")}>
            <SettingsIcon className="h-4 w-4 mr-2" />
            Configure Pipeline
          </Button>
          <Button variant="outline" onClick={() => setActiveTab("history")}>
            <HistoryIcon className="h-4 w-4 mr-2" />
            View History
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Loading pipelines...</p>
              </CardContent>
            </Card>
          ) : pipelines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <HistoryIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Builds Found</h3>
                <p className="text-muted-foreground text-center">
                  Start by running a build to see it appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pipelines.map((pipeline) => (
              <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(pipeline.status)}`} />
                      <div>
                        <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                        <CardDescription>
                          Project: {pipeline.project} • Triggered by {pipeline.trigger}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getStatusIcon(pipeline.status)}
                        <span className="ml-1 capitalize">{pipeline.status}</span>
                      </Badge>
                      {pipeline.duration && (
                        <Badge variant="secondary">
                          {formatDuration(pipeline.duration)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pipeline.steps.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {pipeline.steps.filter(s => s.status === "completed").length}
                            </div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {pipeline.steps.filter(s => s.status === "running").length}
                            </div>
                            <div className="text-sm text-muted-foreground">Running</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {pipeline.steps.filter(s => s.status === "failed").length}
                            </div>
                            <div className="text-sm text-muted-foreground">Failed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">
                              {pipeline.steps.filter(s => s.status === "pending").length}
                            </div>
                            <div className="text-sm text-muted-foreground">Pending</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {pipeline.steps.filter(s => s.status === "completed").length} / {pipeline.steps.length}
                            </span>
                          </div>
                          <Progress 
                            value={(pipeline.steps.filter(s => s.status === "completed").length / pipeline.steps.length) * 100} 
                            className="h-2"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Platform: {build.platform} • Created: {new Date(pipeline.createdAt).toLocaleString()}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {pipeline.status === "idle" && (
                        <Button onClick={() => handleRunPipeline(pipeline.id)}>
                          <PlayIcon className="h-4 w-4 mr-2" />
                          Run Pipeline
                        </Button>
                      )}
                      {pipeline.status === "running" && (
                        <Button variant="outline" onClick={() => handleStopPipeline(pipeline.id)}>
                          <StopIcon className="h-4 w-4 mr-2" />
                          Stop Pipeline
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => {
                        setSelectedPipeline(pipeline);
                        setActiveTab("logs");
                      }}>
                        View Logs
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedPipeline(pipeline)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="config">
          <PipelineConfig />
        </TabsContent>

        <TabsContent value="history">
          <PipelineHistory pipelines={pipelines} />
        </TabsContent>

        <TabsContent value="logs">
          <PipelineLogs selectedPipeline={selectedPipeline} />
        </TabsContent>
      </Tabs>
    </div>
  );
}