# Build Search Migration Guide

## Overview

This guide helps you migrate from mock data to the real build search implementation. The migration should be done incrementally to minimize disruption.

## Migration Strategy

### Phase 1: Storage Infrastructure (Week 1)

**Goal**: Set up storage and IPC without breaking existing UI

#### Step 1: Add Store Schema

**File**: `main/background.ts`

```typescript
// Add to existing schema around line 106
const buildSchema = {
  builds: {
    type: "array",
    default: [],
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        project: { type: "string" },
        platform: { 
          type: "string",
          enum: ["mac", "linux", "win32", "win64", "mac-universal"]
        },
        status: { 
          type: "string",
          enum: ["idle", "running", "completed", "failed", "paused"]
        },
        trigger: {
          type: "string",
          enum: ["manual", "git", "schedule"]
        },
        createdAt: { type: "string" },
        completedAt: { type: "string" },
        duration: { type: "number" },
        error: { type: "string" },
        commitHash: { type: "string" },
        commitMessage: { type: "string" },
      },
      required: ["id", "name", "project", "platform", "status", "createdAt"]
    }
  }
};

// Update store initialization (around line 108)
const store = new Store({ schema: { ...existingSchema, ...buildSchema } });
```

#### Step 2: Add IPC Handlers

**File**: `main/background.ts`

Add after existing IPC handlers (around line 430):

```typescript
// Builds IPC Handlers
ipcMain.handle("builds:save", async (_, build: BuildRecord) => {
  try {
    const builds = store.get("builds", []);
    builds.push(build);
    store.set("builds", builds);
    return true;
  } catch (error) {
    log.error(`Error saving build: ${error}`);
    return false;
  }
});

ipcMain.handle("builds:getAll", async () => {
  return store.get("builds", []);
});

ipcMain.handle("builds:get", async (_, id: string) => {
  const builds = store.get("builds", []);
  return builds.find((b: BuildRecord) => b.id === id) || null;
});

ipcMain.handle("builds:delete", async (_, id: string) => {
  try {
    const builds = store.get("builds", []);
    const filtered = builds.filter((b: BuildRecord) => b.id !== id);
    store.set("builds", filtered);
    return true;
  } catch (error) {
    log.error(`Error deleting build: ${error}`);
    return false;
  }
});

ipcMain.handle("builds:getLogs", async (_, buildId: string) => {
  try {
    const logPath = path.join(app.getPath("userData"), "builds", buildId, "logs.txt");
    const data = await fs.readFile(logPath, "utf-8");
    return data;
  } catch (error) {
    log.error(`Error reading build logs: ${error}`);
    return "";
  }
});
```

#### Step 3: Add Preload API

**File**: `main/preload.ts`

Add to the `handler` object (around line 180):

```typescript
builds: {
  save: async (build: BuildRecord) => {
    return ipcRenderer.invoke("builds:save", build);
  },
  getAll: async () => {
    return ipcRenderer.invoke("builds:getAll");
  },
  get: async (id: string) => {
    return ipcRenderer.invoke("builds:get", id);
  },
  delete: async (id: string) => {
    return ipcRenderer.invoke("builds:delete", id);
  },
  getLogs: async (buildId: string) => {
    return ipcRenderer.invoke("builds:getLogs", buildId);
  },
  on: (event: string, callback: Function) => {
    return handler.on(event, callback);
  },
  off: (event: string, callback: Function) => {
    return handler.off(event, callback);
  }
},
```

#### Step 4: Create Type Definitions

**File**: `renderer/types/builds.ts` (new file)

```typescript
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
```

#### Step 5: Update Electron Types

**File**: `renderer/types/electron.d.ts`

Add to `SorobanApi` interface:

```typescript
builds: {
  save: (build: BuildRecord) => Promise<boolean>;
  getAll: () => Promise<BuildRecord[]>;
  get: (id: string) => Promise<BuildRecord | null>;
  delete: (id: string) => Promise<boolean>;
  getLogs: (buildId: string) => Promise<string>;
  on: (event: string, callback: Function) => () => void;
  off: (event: string, callback: Function) => void;
};
```

### Phase 2: Replace Mock Data (Week 3)

**Goal**: Replace mock data with real data fetching

#### Step 1: Update DeploymentPipeline Component

**File**: `renderer/components/deployment-pipeline/DeploymentPipeline.tsx`

**Before:**
```typescript
const mockPipelines: Pipeline[] = [/* ... */];
const [pipelines, setPipelines] = useState<Pipeline[]>(mockPipelines);
```

**After:**
```typescript
const [pipelines, setPipelines] = useState<Pipeline[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function loadPipelines() {
    try {
      const builds = await window.sorobanApi.builds.getAll();
      // Convert BuildRecord[] to Pipeline[]
      const convertedPipelines = builds.map(build => ({
        id: build.id,
        name: build.name,
        project: build.project,
        status: build.status,
        steps: [], // Will be populated from config
        createdAt: build.createdAt,
        updatedAt: build.completedAt || build.createdAt,
        duration: build.duration,
        trigger: build.trigger
      }));
      setPipelines(convertedPipelines);
    } catch (error) {
      console.error("Failed to load pipelines:", error);
    } finally {
      setLoading(false);
    }
  }

  loadPipelines();

  // Subscribe to updates
  const handleBuildUpdate = (build: BuildRecord) => {
    setPipelines(prev => {
      const index = prev.findIndex(p => p.id === build.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: build.status,
          updatedAt: build.completedAt || build.createdAt,
          duration: build.duration
        };
        return updated;
      }
      return [convertToPipeline(build), ...prev];
    });
  };

  window.sorobanApi.builds.on("build:completed", handleBuildUpdate);
  window.sorobanApi.builds.on("build:updated", handleBuildUpdate);

  return () => {
    window.sorobanApi.builds.off("build:completed", handleBuildUpdate);
    window.sorobanApi.builds.off("build:updated", handleBuildUpdate);
  };
}, []);
```

#### Step 2: Update PipelineHistory Component

**File**: `renderer/components/deployment-pipeline/PipelineHistory.tsx`

The component already has search functionality. Update it to use real data:

```typescript
// The component receives pipelines as props, so no changes needed here
// But enhance search to use BuildSearchService

import { BuildSearchService } from "lib/build-search";

const searchService = useMemo(() => {
  return new BuildSearchService(pipelines.map(convertToBuildRecord));
}, [pipelines]);

const filteredPipelines = useMemo(() => {
  if (!searchTerm && statusFilter === "all" && projectFilter === "all") {
    return pipelines;
  }

  // Use search service for advanced search
  if (searchTerm) {
    const results = searchService.search({
      query: searchTerm,
      filters: {
        status: statusFilter !== "all" ? [statusFilter as BuildStatus] : undefined,
        project: projectFilter !== "all" ? [projectFilter] : undefined
      }
    });
    return results.builds.map(convertToPipeline);
  }

  // Simple filtering
  return pipelines.filter(pipeline => {
    const matchesStatus = statusFilter === "all" || pipeline.status === statusFilter;
    const matchesProject = projectFilter === "all" || pipeline.project === projectFilter;
    return matchesStatus && matchesProject;
  });
}, [pipelines, searchTerm, statusFilter, projectFilter]);
```

#### Step 3: Update PipelineLogs Component

**File**: `renderer/components/deployment-pipeline/PipelineLogs.tsx`

**Before:**
```typescript
const mockLogs = [/* ... */];
const [logs, setLogs] = useState(mockLogs);

useEffect(() => {
  if (selectedPipeline) {
    setLogs(mockLogs);
  }
}, [selectedPipeline]);
```

**After:**
```typescript
const [logs, setLogs] = useState<LogEntry[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  async function loadLogs() {
    if (!selectedPipeline) return;

    setLoading(true);
    try {
      const logContent = await window.sorobanApi.builds.getLogs(selectedPipeline.id);
      const logLines = logContent.split("\n").filter(line => line.trim());
      
      const parsedLogs = logLines.map((line, index) => {
        // Parse log line format
        const timestampMatch = line.match(/\[(.+?)\]/);
        const levelMatch = line.match(/\[(\w+)\]/);
        const message = line.replace(/\[.+?\]/g, "").trim();

        return {
          timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
          level: levelMatch ? levelMatch[1].toLowerCase() : "info",
          message: message || line
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
```

### Phase 3: Add Search Functionality (Week 2-3)

#### Step 1: Install Dependencies

```bash
npm install fuse.js
npm install --save-dev @types/fuse.js
```

#### Step 2: Create BuildSearchService

**File**: `renderer/lib/build-search.ts` (new file)

See the plan document for complete implementation.

#### Step 3: Integrate Search into PipelineHistory

Already covered in Phase 2, Step 2.

### Phase 4: Global Search Integration (Week 3)

#### Step 1: Update Global Search

**File**: `renderer/components/common/global-search.tsx`

Add build-related items:

```typescript
import { HistoryIcon } from "lucide-react";

const searchableItems: SearchableItem[] = [
  // ... existing items ...
  
  // Add build-related items
  {
    id: "build-history",
    title: "Build History",
    description: "View past build executions",
    href: "/deployment-pipeline?tab=history",
    category: "Builds",
    icon: HistoryIcon,
    tags: ["build", "history", "deployment"]
  },
  {
    id: "search-builds",
    title: "Search Builds",
    description: "Search build history and logs",
    href: "/deployment-pipeline?tab=history&search=true",
    category: "Builds",
    icon: SearchIcon,
    tags: ["build", "search", "logs"]
  }
];

// Add recent builds to suggestions
const recentBuilds = useMemo(async () => {
  const builds = await window.sorobanApi.builds.getAll();
  return builds.slice(0, 5).map(build => ({
    id: `build-${build.id}`,
    title: build.name,
    description: `${build.project} • ${build.platform}`,
    href: `/deployment-pipeline?tab=history&build=${build.id}`,
    category: "Recent Builds",
    icon: HistoryIcon,
    tags: [build.project, build.platform, build.status]
  }));
}, []);

// Combine with searchableItems in filteredItems
```

### Phase 5: Build Script Integration (Week 4)

#### Step 1: Update Build Script

**File**: `scripts/build.js`

Add build record saving (see plan document for complete code).

#### Step 2: Add File Watcher

**File**: `main/background.ts`

Add file watcher to process build records (see plan document).

## Testing the Migration

### Test Checklist

- [ ] Store schema validates correctly
- [ ] IPC handlers work correctly
- [ ] Preload API accessible from renderer
- [ ] Builds can be saved and retrieved
- [ ] Mock data removed from components
- [ ] Real data loads correctly
- [ ] Search works with real data
- [ ] Logs load correctly
- [ ] Events fire correctly
- [ ] No breaking changes to existing UI

### Manual Testing Steps

1. **Save a Build:**
   ```typescript
   const build = { /* ... */ };
   await window.sorobanApi.builds.save(build);
   ```

2. **Verify in Store:**
   ```typescript
   const builds = await window.sorobanApi.builds.getAll();
   console.log(builds);
   ```

3. **Test Search:**
   - Open Deployment Pipeline
   - Navigate to History tab
   - Type in search box
   - Verify results update

4. **Test Logs:**
   - Select a build
   - Navigate to Logs tab
   - Verify logs load

5. **Test Events:**
   - Trigger a build completion
   - Verify UI updates automatically

## Rollback Plan

If issues occur during migration:

1. **Keep mock data temporarily:**
   ```typescript
   const useMockData = process.env.NODE_ENV === "development";
   const pipelines = useMockData ? mockPipelines : await loadPipelines();
   ```

2. **Feature flag:**
   ```typescript
   const enableBuildSearch = store.get("enableBuildSearch", false);
   ```

3. **Gradual rollout:**
   - Enable for specific users first
   - Monitor for errors
   - Roll out gradually

## Common Issues

### Issue: Builds not loading

**Solution:**
- Check IPC handlers are registered
- Verify preload API is exposed
- Check store schema is correct
- Verify types are imported correctly

### Issue: Search not working

**Solution:**
- Verify fuse.js is installed
- Check BuildSearchService is initialized
- Verify builds are loaded before searching
- Check query parsing logic

### Issue: Events not firing

**Solution:**
- Verify event listeners are registered
- Check IPC event names match
- Verify cleanup in useEffect
- Check main process is sending events

### Issue: Logs not loading

**Solution:**
- Verify log files exist
- Check file path is correct
- Verify build ID matches
- Check file permissions

## Next Steps

After migration is complete:

1. Remove mock data files
2. Update documentation
3. Add unit tests
4. Add integration tests
5. Performance optimization
6. User testing and feedback

## See Also

- [Build Search Plan](./build-search-plan.md)
- [Build Search Architecture](./build-search-architecture.md)
- [Build Search API Reference](./build-search-api-reference.md)
