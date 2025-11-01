export type BuildStatus = "idle" | "running" | "completed" | "failed" | "paused";
export type BuildTrigger = "manual" | "git" | "schedule";
export type BuildPlatform = "mac" | "linux" | "win32" | "win64" | "mac-universal";

export interface BuildRecord {
  id: string;
  name: string;
  project: string;
  platform: BuildPlatform;
  status: BuildStatus;
  trigger: BuildTrigger;
  createdAt: string;
  completedAt?: string;
  duration?: number;
  error?: string;
  commitHash?: string;
  commitMessage?: string;
  logPath?: string;
}

export interface BuildFilters {
  status?: BuildStatus[];
  platform?: BuildPlatform[];
  project?: string[];
  dateRange?: { start: Date; end: Date };
}

export interface BuildConfig {
  id: string;
  name: string;
  project: string;
  steps: PipelineStep[];
  trigger: BuildTrigger;
  gitBranch?: string;
  schedule?: string;
  notifications?: {
    onSuccess: boolean;
    onFailure: boolean;
    webhook?: string;
  };
}

export interface PipelineStep {
  id: string;
  name: string;
  type: "checkout" | "install" | "test" | "build" | "deploy";
  command: string;
  workingDirectory?: string;
  environment?: Record<string, string>;
  timeout?: number;
  retryCount?: number;
  condition?: string;
  status?: "pending" | "running" | "completed" | "failed" | "skipped";
  duration?: number;
  logs?: string[];
  error?: string;
}
