"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  PlayIcon,
  GitBranchIcon,
  CalendarIcon,
  FilterIcon,
  SearchIcon
} from "lucide-react";

interface Pipeline {
  id: string;
  name: string;
  project: string;
  status: "idle" | "running" | "completed" | "failed" | "paused";
  createdAt: string;
  updatedAt: string;
  duration?: number;
  trigger: "manual" | "git" | "schedule";
  commitHash?: string;
  commitMessage?: string;
}

interface PipelineHistoryProps {
  pipelines: Pipeline[];
}

export default function PipelineHistory({ pipelines }: PipelineHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const filteredPipelines = pipelines.filter(pipeline => {
    const matchesSearch = pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pipeline.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || pipeline.status === statusFilter;
    const matchesProject = projectFilter === "all" || pipeline.project === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

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
      case "paused": return <ClockIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const projects = Array.from(new Set(pipelines.map(p => p.project)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pipelines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project} value={project}>{project}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredPipelines.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FilterIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No pipelines found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredPipelines.map((pipeline) => (
            <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(pipeline.status)}`} />
                      <h3 className="text-lg font-semibold">{pipeline.name}</h3>
                      <Badge variant="outline">
                        {getStatusIcon(pipeline.status)}
                        <span className="ml-1 capitalize">{pipeline.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <GitBranchIcon className="h-4 w-4" />
                        <span>{pipeline.project}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDate(pipeline.createdAt)}</span>
                      </div>
                      {pipeline.duration && (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>{formatDuration(pipeline.duration)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{pipeline.trigger}</span>
                      </div>
                    </div>

                    {pipeline.commitHash && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                            {pipeline.commitHash.substring(0, 8)}
                          </span>
                          <span className="text-muted-foreground">
                            {pipeline.commitMessage}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      View Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}