"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Switch } from "components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Badge } from "components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { 
  PlusIcon, 
  TrashIcon, 
  SaveIcon, 
  TestTubeIcon, 
  CodeIcon, 
  RocketIcon,
  GitBranchIcon,
  ClockIcon,
  SettingsIcon
} from "lucide-react";

interface PipelineStep {
  id: string;
  name: string;
  type: "checkout" | "install" | "test" | "build" | "deploy";
  command: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  timeout?: number;
  retryCount?: number;
  condition?: string;
}

interface PipelineConfig {
  name: string;
  description: string;
  project: string;
  trigger: "manual" | "git" | "schedule";
  gitBranch?: string;
  schedule?: string;
  steps: PipelineStep[];
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    webhook?: string;
  };
}

const stepTypes = [
  { value: "checkout", label: "Code Checkout", icon: GitBranchIcon },
  { value: "install", label: "Install Dependencies", icon: SettingsIcon },
  { value: "test", label: "Run Tests", icon: TestTubeIcon },
  { value: "build", label: "Build Contract", icon: CodeIcon },
  { value: "deploy", label: "Deploy Contract", icon: RocketIcon },
];

export default function PipelineConfig() {
  const [config, setConfig] = useState<PipelineConfig>({
    name: "",
    description: "",
    project: "",
    trigger: "manual",
    steps: [],
    notifications: {
      onSuccess: true,
      onFailure: true,
    }
  });

  const addStep = (type: PipelineStep["type"]) => {
    const newStep: PipelineStep = {
      id: Date.now().toString(),
      name: stepTypes.find(s => s.value === type)?.label || "",
      type,
      command: getDefaultCommand(type),
      timeout: 300,
      retryCount: 0,
    };
    setConfig(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const getDefaultCommand = (type: PipelineStep["type"]): string => {
    switch (type) {
      case "checkout": return "git checkout $BRANCH && git pull origin $BRANCH";
      case "install": return "cargo install --path .";
      case "test": return "cargo test";
      case "build": return "soroban contract build";
      case "deploy": return "soroban contract deploy --wasm target/wasm32-unknown-unknown/release/*.wasm";
      default: return "";
    }
  };

  const updateStep = (stepId: string, updates: Partial<PipelineStep>) => {
    setConfig(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  };

  const removeStep = (stepId: string) => {
    setConfig(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }));
  };

  const saveConfig = () => {
    // TODO: Implement save functionality
    console.log("Saving pipeline config:", config);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Configuration</CardTitle>
          <CardDescription>
            Configure your deployment pipeline steps and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Pipeline Name</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Deployment Pipeline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Input
                id="project"
                value={config.project}
                onChange={(e) => setConfig(prev => ({ ...prev, project: e.target.value }))}
                placeholder="my-soroban-contract"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your deployment pipeline..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select
                value={config.trigger}
                onValueChange={(value: "manual" | "git" | "schedule") => 
                  setConfig(prev => ({ ...prev, trigger: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="git">Git Push</SelectItem>
                  <SelectItem value="schedule">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.trigger === "git" && (
              <div className="space-y-2">
                <Label htmlFor="branch">Git Branch</Label>
                <Input
                  id="branch"
                  value={config.gitBranch || ""}
                  onChange={(e) => setConfig(prev => ({ ...prev, gitBranch: e.target.value }))}
                  placeholder="main"
                />
              </div>
            )}
            {config.trigger === "schedule" && (
              <div className="space-y-2">
                <Label htmlFor="schedule">Cron Schedule</Label>
                <Input
                  id="schedule"
                  value={config.schedule || ""}
                  onChange={(e) => setConfig(prev => ({ ...prev, schedule: e.target.value }))}
                  placeholder="0 2 * * *"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Steps</CardTitle>
          <CardDescription>
            Define the steps that will be executed in your deployment pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {config.steps.map((step, index) => (
              <Card key={step.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium">{step.name}</span>
                    <Badge variant="secondary">{step.type}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(step.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`step-name-${step.id}`}>Step Name</Label>
                    <Input
                      id={`step-name-${step.id}`}
                      value={step.name}
                      onChange={(e) => updateStep(step.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`step-timeout-${step.id}`}>Timeout (seconds)</Label>
                    <Input
                      id={`step-timeout-${step.id}`}
                      type="number"
                      value={step.timeout}
                      onChange={(e) => updateStep(step.id, { timeout: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label htmlFor={`step-command-${step.id}`}>Command</Label>
                  <Textarea
                    id={`step-command-${step.id}`}
                    value={step.command}
                    onChange={(e) => updateStep(step.id, { command: e.target.value })}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>

                {step.workingDirectory && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor={`step-workdir-${step.id}`}>Working Directory</Label>
                    <Input
                      id={`step-workdir-${step.id}`}
                      value={step.workingDirectory}
                      onChange={(e) => updateStep(step.id, { workingDirectory: e.target.value })}
                    />
                  </div>
                )}
              </Card>
            ))}

            <div className="flex flex-wrap gap-2">
              {stepTypes.map((stepType) => (
                <Button
                  key={stepType.value}
                  variant="outline"
                  size="sm"
                  onClick={() => addStep(stepType.value as PipelineStep["type"])}
                >
                  <stepType.icon className="h-4 w-4 mr-2" />
                  Add {stepType.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure notification settings for pipeline events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-success">Notify on Success</Label>
              <p className="text-sm text-muted-foreground">
                Send notification when pipeline completes successfully
              </p>
            </div>
            <Switch
              id="notify-success"
              checked={config.notifications.onSuccess}
              onCheckedChange={(checked) => 
                setConfig(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, onSuccess: checked }
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notify-failure">Notify on Failure</Label>
              <p className="text-sm text-muted-foreground">
                Send notification when pipeline fails
              </p>
            </div>
            <Switch
              id="notify-failure"
              checked={config.notifications.onFailure}
              onCheckedChange={(checked) => 
                setConfig(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, onFailure: checked }
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook">Webhook URL (Optional)</Label>
            <Input
              id="webhook"
              value={config.notifications.webhook || ""}
              onChange={(e) => 
                setConfig(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, webhook: e.target.value }
                }))
              }
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveConfig}>
          <SaveIcon className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}