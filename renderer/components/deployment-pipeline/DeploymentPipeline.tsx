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

const mockPipelines: Pipeline[] = [
  {
    id: "1",
    name: "Production Deploy",
    project: "my-soroban-contract",
    status: "completed",
    steps: [
      { id: "1", name: "Code Checkout", status: "completed", duration: 2 },
      { id: "2", name: "Install Dependencies", status: "completed", duration: 15 },
      { id: "3", name: "Run Tests", status: "completed", duration: 45 },
      { id: "4", name: "Build Contract", status: "completed", duration: 30 },
      { id: "5", name: "Deploy to Testnet", status: "completed", duration: 60 },
      { id: "6", name: "Run Integration Tests", status: "completed", duration: 120 },
      { id: "7", name: "Deploy to Mainnet", status: "completed", duration: 90 },
    ],
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T11:45:00Z",
    duration: 362,
    trigger: "manual"
  },
  {
    id: "2",
    name: "Feature Branch Deploy",
    project: "token-contract",
    status: "running",
    steps: [
      { id: "1", name: "Code Checkout", status: "completed", duration: 3 },
      { id: "2", name: "Install Dependencies", status: "completed", duration: 12 },
      { id: "3", name: "Run Tests", status: "running", duration: 0 },
      { id: "4", name: "Build Contract", status: "pending" },
      { id: "5", name: "Deploy to Testnet", status: "pending" },
    ],
    createdAt: "2024-01-15T14:20:00Z",
    updatedAt: "2024-01-15T14:22:00Z",
    trigger: "git"
  },
  {
    id: "3",
    name: "Scheduled Deploy",
    project: "governance-contract",
    status: "failed",
    steps: [
      { id: "1", name: "Code Checkout", status: "completed", duration: 2 },
      { id: "2", name: "Install Dependencies", status: "completed", duration: 18 },
      { id: "3", name: "Run Tests", status: "failed", duration: 5, error: "Test failure in governance_test.rs" },
      { id: "4", name: "Build Contract", status: "skipped" },
      { id: "5", name: "Deploy to Testnet", status: "skipped" },
    ],
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:25:00Z",
    duration: 25,
    trigger: "schedule"
  }
];

export default function DeploymentPipelineComponent() {
  const [pipelines, setPipelines] = useState<Pipeline[]>(mockPipelines);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [activeTab, setActiveTab] = useState("pipelines");

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
          <Button>
            <SettingsIcon className="h-4 w-4 mr-2" />
            Configure Pipeline
          </Button>
          <Button variant="outline">
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
                      <Button variant="outline" onClick={() => setSelectedPipeline(pipeline)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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