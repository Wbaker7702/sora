# Build Search Quick Start Guide

## Overview

This guide helps you quickly get started with implementing the build search feature. Follow these steps in order to get a working prototype.

## Prerequisites

- Node.js installed
- Sora project cloned and dependencies installed
- Basic understanding of Electron IPC patterns
- Familiarity with TypeScript and React

## Quick Start (30 minutes)

### Step 1: Install Dependencies (2 minutes)

```bash
npm install fuse.js
npm install --save-dev @types/fuse.js
```

### Step 2: Create Type Definitions (5 minutes)

**File**: `renderer/types/builds.ts`

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
}

export interface BuildFilters {
  status?: BuildStatus[];
  platform?: BuildPlatform[];
  project?: string[];
  dateRange?: { start: Date; end: Date };
}
```

### Step 3: Add Store Schema (5 minutes)

**File**: `main/background.ts`

Add to existing schema (around line 106):

```typescript
builds: {
  type: "array",
  default: [],
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      project: { type: "string" },
      platform: { type: "string", enum: ["mac", "linux", "win32", "win64", "mac-universal"] },
      status: { type: "string", enum: ["idle", "running", "completed", "failed", "paused"] },
      trigger: { type: "string", enum: ["manual", "git", "schedule"] },
      createdAt: { type: "string" },
      completedAt: { type: "string" },
      duration: { type: "number" },
      error: { type: "string" },
    },
    required: ["id", "name", "project", "platform", "status", "createdAt"]
  }
}
```

### Step 4: Add IPC Handler (5 minutes)

**File**: `main/background.ts`

Add after existing IPC handlers:

```typescript
ipcMain.handle("builds:getAll", async () => {
  return store.get("builds", []);
});

ipcMain.handle("builds:save", async (_, build) => {
  const builds = store.get("builds", []);
  builds.push(build);
  store.set("builds", builds);
  return true;
});
```

### Step 5: Add Preload API (3 minutes)

**File**: `main/preload.ts`

Add to handler object:

```typescript
builds: {
  getAll: async () => ipcRenderer.invoke("builds:getAll"),
  save: async (build) => ipcRenderer.invoke("builds:save", build),
}
```

### Step 6: Update Electron Types (2 minutes)

**File**: `renderer/types/electron.d.ts`

Add to `SorobanApi` interface:

```typescript
builds: {
  getAll: () => Promise<BuildRecord[]>;
  save: (build: BuildRecord) => Promise<boolean>;
};
```

### Step 7: Create Simple Search Service (5 minutes)

**File**: `renderer/lib/build-search.ts`

```typescript
import Fuse from "fuse.js";
import { BuildRecord, BuildFilters } from "types/builds";

export class BuildSearchService {
  private fuse: Fuse<BuildRecord>;

  constructor(builds: BuildRecord[]) {
    this.fuse = new Fuse(builds, {
      keys: ["name", "project", "platform", "status"],
      threshold: 0.3,
    });
  }

  search(query: string, filters?: BuildFilters): BuildRecord[] {
    let results = this.fuse.search(query).map(r => r.item);

    if (filters?.status) {
      results = results.filter(b => filters.status!.includes(b.status));
    }

    if (filters?.platform) {
      results = results.filter(b => filters.platform!.includes(b.platform));
    }

    return results;
  }
}
```

### Step 8: Test It (3 minutes)

**Create a test component:**

```typescript
// renderer/components/test-build-search.tsx
import { useEffect, useState } from "react";
import { BuildRecord } from "types/builds";
import { BuildSearchService } from "lib/build-search";

export default function TestBuildSearch() {
  const [builds, setBuilds] = useState<BuildRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadBuilds() {
      const data = await window.sorobanApi.builds.getAll();
      setBuilds(data);
    }
    loadBuilds();
  }, []);

  // Create a test build
  const createTestBuild = async () => {
    const testBuild: BuildRecord = {
      id: crypto.randomUUID(),
      name: "Test Build",
      project: "test-project",
      platform: "linux",
      status: "completed",
      trigger: "manual",
      createdAt: new Date().toISOString(),
    };
    await window.sorobanApi.builds.save(testBuild);
    // Reload builds
    const data = await window.sorobanApi.builds.getAll();
    setBuilds(data);
  };

  const searchService = new BuildSearchService(builds);
  const results = searchQuery
    ? searchService.search(searchQuery)
    : builds;

  return (
    <div className="p-4">
      <h1>Build Search Test</h1>
      <button onClick={createTestBuild}>Create Test Build</button>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search builds..."
      />
      <div>
        <h2>Results ({results.length})</h2>
        {results.map(build => (
          <div key={build.id}>
            {build.name} - {build.project} - {build.platform}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Next Steps

Once you have the basic prototype working:

1. **Integrate with PipelineHistory**: Replace mock data with real data
2. **Add log search**: Implement log file searching
3. **Enhance global search**: Add build items to global search
4. **Add real-time updates**: Implement event subscriptions
5. **Build script integration**: Connect with build scripts

## Testing Checklist

- [ ] Can save a build via API
- [ ] Can retrieve builds via API
- [ ] Search returns correct results
- [ ] Filters work correctly
- [ ] UI updates when builds change

## Common Issues

### Issue: `window.sorobanApi.builds` is undefined

**Solution**: Make sure preload script is loaded and types are updated.

### Issue: Builds not saving

**Solution**: Check IPC handler is registered and store schema is correct.

### Issue: Search not working

**Solution**: Verify fuse.js is installed and BuildSearchService is initialized with builds.

## Resources

- [Build Search Plan](./build-search-plan.md) - Complete implementation plan
- [Build Search Architecture](./build-search-architecture.md) - System architecture
- [Build Search API Reference](./build-search-api-reference.md) - API documentation
- [Build Search Migration Guide](./build-search-migration.md) - Migration steps

## Getting Help

If you encounter issues:

1. Check the [API Reference](./build-search-api-reference.md) for correct usage
2. Review the [Architecture](./build-search-architecture.md) for system flow
3. Look at existing IPC patterns in `main/background.ts`
4. Check console for errors

## Example: Complete Integration

Here's a complete example integrating search into PipelineHistory:

```typescript
// renderer/components/deployment-pipeline/PipelineHistory.tsx
import { useState, useEffect, useMemo } from "react";
import { BuildRecord } from "types/builds";
import { BuildSearchService } from "lib/build-search";

export default function PipelineHistory({ pipelines }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [allBuilds, setAllBuilds] = useState<BuildRecord[]>([]);

  useEffect(() => {
    async function loadBuilds() {
      const builds = await window.sorobanApi.builds.getAll();
      setAllBuilds(builds);
    }
    loadBuilds();
  }, []);

  const searchService = useMemo(
    () => new BuildSearchService(allBuilds),
    [allBuilds]
  );

  const filteredBuilds = useMemo(() => {
    if (!searchQuery) return allBuilds;
    return searchService.search(searchQuery);
  }, [searchQuery, searchService, allBuilds]);

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search builds..."
      />
      <div>
        {filteredBuilds.map(build => (
          <div key={build.id}>{build.name}</div>
        ))}
      </div>
    </div>
  );
}
```

This gives you a working search implementation in just a few minutes!
