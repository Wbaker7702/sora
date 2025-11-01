# Build Search API Reference

## Overview

The Build Search API provides functionality to save, retrieve, search, and manage build records and their associated logs. All APIs follow the existing Sora IPC pattern using `window.sorobanApi.builds.*`.

## Type Definitions

### BuildRecord

```typescript
interface BuildRecord {
  id: string;                    // Unique build identifier (UUID)
  name: string;                  // Build name (e.g., "Build linux")
  project: string;               // Project name
  platform: BuildPlatform;       // "mac" | "linux" | "win32" | "win64" | "mac-universal"
  status: BuildStatus;          // "idle" | "running" | "completed" | "failed" | "paused"
  trigger: BuildTrigger;        // "manual" | "git" | "schedule"
  createdAt: string;            // ISO 8601 timestamp
  completedAt?: string;         // ISO 8601 timestamp (optional)
  duration?: number;             // Duration in seconds
  error?: string;                // Error message (if failed)
  commitHash?: string;           // Git commit hash
  commitMessage?: string;        // Git commit message
  logPath?: string;              // Path to log file
}
```

### BuildFilters

```typescript
interface BuildFilters {
  status?: BuildStatus[];        // Filter by status
  platform?: BuildPlatform[];    // Filter by platform
  project?: string[];            // Filter by project names
  dateRange?: {                  // Filter by date range
    start: Date;
    end: Date;
  };
}
```

### SearchOptions

```typescript
interface SearchOptions {
  query: string;                 // Search query string
  filters?: BuildFilters;        // Optional filters
  limit?: number;                // Max results (default: 50)
  offset?: number;               // Pagination offset (default: 0)
}
```

### SearchResult

```typescript
interface SearchResult {
  builds: BuildRecord[];         // Matching builds
  total: number;                  // Total number of matches
  highlights: Highlight[];        // Match positions for highlighting
}
```

### LogMatch

```typescript
interface LogMatch {
  line: number;                  // Line number (1-indexed)
  content: string;               // Line content
  matches: number[];             // Character positions of matches
}
```

## API Methods

### Builds Management

#### `builds.save(build: BuildRecord): Promise<boolean>`

Save a new build record to the store.

**Parameters:**
- `build` (BuildRecord): The build record to save

**Returns:** `Promise<boolean>` - `true` if successful, `false` otherwise

**Example:**
```typescript
const build: BuildRecord = {
  id: generateId(),
  name: "Build linux",
  project: "my-project",
  platform: "linux",
  status: "completed",
  trigger: "manual",
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  duration: 120
};

const success = await window.sorobanApi.builds.save(build);
```

#### `builds.getAll(): Promise<BuildRecord[]>`

Retrieve all build records from the store.

**Returns:** `Promise<BuildRecord[]>` - Array of all builds

**Example:**
```typescript
const builds = await window.sorobanApi.builds.getAll();
console.log(`Found ${builds.length} builds`);
```

#### `builds.get(id: string): Promise<BuildRecord | null>`

Retrieve a specific build by ID.

**Parameters:**
- `id` (string): Build ID

**Returns:** `Promise<BuildRecord | null>` - Build record or `null` if not found

**Example:**
```typescript
const build = await window.sorobanApi.builds.get("abc123");
if (build) {
  console.log(`Build: ${build.name}`);
}
```

#### `builds.delete(id: string): Promise<boolean>`

Delete a build record and its associated log files.

**Parameters:**
- `id` (string): Build ID

**Returns:** `Promise<boolean>` - `true` if successful

**Example:**
```typescript
const deleted = await window.sorobanApi.builds.delete("abc123");
```

### Search Operations

#### `builds.search(query: string, filters?: BuildFilters): Promise<BuildRecord[]>`

Search builds using fuzzy text matching and optional filters.

**Parameters:**
- `query` (string): Search query (supports field-specific syntax like `status:failed`)
- `filters` (BuildFilters, optional): Additional filters

**Returns:** `Promise<BuildRecord[]>` - Array of matching builds

**Example:**
```typescript
// Simple text search
const results = await window.sorobanApi.builds.search("production deploy");

// With filters
const failedBuilds = await window.sorobanApi.builds.search("linux", {
  status: ["failed"],
  platform: ["linux"]
});

// Field-specific query
const results = await window.sorobanApi.builds.search("status:failed platform:linux");
```

**Search Query Syntax:**
- `status:failed` - Filter by status
- `platform:linux` - Filter by platform
- `project:my-project` - Filter by project
- Multiple filters: `status:failed platform:linux`
- Text search works across name, project, platform, status, and error fields

### Log Operations

#### `builds.getLogs(buildId: string): Promise<string>`

Retrieve the complete log content for a build.

**Parameters:**
- `buildId` (string): Build ID

**Returns:** `Promise<string>` - Log file content as string

**Example:**
```typescript
const logs = await window.sorobanApi.builds.getLogs("abc123");
console.log(logs);
```

#### `builds.searchLogs(buildId: string, query: string): Promise<LogMatch[]>`

Search within a build's log file.

**Parameters:**
- `buildId` (string): Build ID
- `query` (string): Search query (regex supported)

**Returns:** `Promise<LogMatch[]>` - Array of matching log lines

**Example:**
```typescript
const matches = await window.sorobanApi.builds.searchLogs("abc123", "error");
matches.forEach(match => {
  console.log(`Line ${match.line}: ${match.content}`);
  console.log(`Matches at positions: ${match.matches.join(", ")}`);
});
```

### Event Subscription

#### `builds.on(event: string, callback: Function): () => void`

Subscribe to build-related events.

**Parameters:**
- `event` (string): Event name (`"build:completed"`, `"build:updated"`, `"build:log"`)
- `callback` (Function): Event handler function

**Returns:** Unsubscribe function

**Example:**
```typescript
const unsubscribe = window.sorobanApi.builds.on("build:completed", (build: BuildRecord) => {
  console.log(`Build completed: ${build.name}`);
  // Update UI, refresh search index, etc.
});

// Later, unsubscribe
unsubscribe();
```

**Available Events:**
- `build:completed` - Emitted when a build completes
- `build:updated` - Emitted when a build's status changes
- `build:log` - Emitted for real-time log updates (future)

#### `builds.off(event: string, callback: Function): void`

Unsubscribe from build-related events.

**Parameters:**
- `event` (string): Event name
- `callback` (Function): Event handler function to remove

**Example:**
```typescript
const handler = (build: BuildRecord) => {
  console.log(`Build: ${build.name}`);
};

window.sorobanApi.builds.on("build:completed", handler);

// Later...
window.sorobanApi.builds.off("build:completed", handler);
```

## Renderer-Side Search Service

The `BuildSearchService` class provides client-side search functionality using fuse.js.

### Usage

```typescript
import { BuildSearchService } from "lib/build-search";
import { BuildRecord } from "types/builds";

// Initialize with builds
const builds = await window.sorobanApi.builds.getAll();
const searchService = new BuildSearchService(builds);

// Search
const results = await searchService.search({
  query: "production deploy",
  filters: {
    status: ["completed"],
    platform: ["linux"]
  },
  limit: 10
});

// Search logs
const logMatches = await searchService.searchLogs("abc123", "error");

// Get suggestions
const suggestions = await searchService.suggest("prod");
```

### Methods

#### `search(options: SearchOptions): Promise<SearchResult>`

Perform fuzzy search on builds.

#### `searchLogs(buildId: string, query: string): Promise<LogMatch[]>`

Search within build logs.

#### `suggest(query: string): Promise<string[]>`

Get search suggestions based on query.

#### `updateBuilds(builds: BuildRecord[]): void`

Update the search index with new builds.

## Error Handling

All API methods throw errors that should be caught:

```typescript
try {
  const builds = await window.sorobanApi.builds.getAll();
} catch (error) {
  console.error("Failed to fetch builds:", error);
  // Handle error (show toast, log, etc.)
}
```

## IPC Channel Names

Internal IPC channels used by the API:

- `builds:save` - Save build record
- `builds:getAll` - Get all builds
- `builds:get` - Get build by ID
- `builds:delete` - Delete build
- `builds:search` - Search builds
- `builds:getLogs` - Get build logs
- `builds:searchLogs` - Search build logs
- `builds:saveLogs` - Save build logs (internal)

## Storage Locations

### Electron Store

Build metadata is stored in Electron Store under the `builds` key:

```typescript
store.get("builds", []); // Array of BuildRecord
```

### File System

Log files are stored in:

```
{userData}/builds/{buildId}/logs.txt
```

Where `{userData}` is:
- macOS: `~/Library/Application Support/sora`
- Linux: `~/.config/sora`
- Windows: `%APPDATA%/sora`

## Examples

### Complete Example: Create, Search, and Display Builds

```typescript
import { BuildRecord } from "types/builds";

// 1. Create a build
const build: BuildRecord = {
  id: crypto.randomUUID(),
  name: "Production Build",
  project: "my-contract",
  platform: "linux",
  status: "completed",
  trigger: "manual",
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  duration: 180
};

await window.sorobanApi.builds.save(build);

// 2. Search builds
const results = await window.sorobanApi.builds.search("production", {
  status: ["completed"],
  platform: ["linux"]
});

// 3. Get logs for a build
const logs = await window.sorobanApi.builds.getLogs(build.id);

// 4. Search within logs
const logMatches = await window.sorobanApi.builds.searchLogs(build.id, "error");

// 5. Subscribe to updates
window.sorobanApi.builds.on("build:completed", (newBuild: BuildRecord) => {
  console.log(`New build completed: ${newBuild.name}`);
  // Refresh UI, update search index, etc.
});
```

### React Hook Example

```typescript
import { useEffect, useState } from "react";
import { BuildRecord } from "types/builds";

function useBuilds() {
  const [builds, setBuilds] = useState<BuildRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBuilds() {
      try {
        const data = await window.sorobanApi.builds.getAll();
        setBuilds(data);
      } catch (error) {
        console.error("Failed to load builds:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBuilds();

    // Subscribe to updates
    const handleBuildUpdate = (build: BuildRecord) => {
      setBuilds(prev => {
        const index = prev.findIndex(b => b.id === build.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = build;
          return updated;
        }
        return [build, ...prev];
      });
    };

    window.sorobanApi.builds.on("build:completed", handleBuildUpdate);
    window.sorobanApi.builds.on("build:updated", handleBuildUpdate);

    return () => {
      window.sorobanApi.builds.off("build:completed", handleBuildUpdate);
      window.sorobanApi.builds.off("build:updated", handleBuildUpdate);
    };
  }, []);

  return { builds, loading };
}
```

## Performance Notes

- **Search**: Searches are performed in-memory using fuse.js. For large datasets (>1000 builds), consider pagination.
- **Logs**: Large log files (>1MB) are loaded synchronously. Consider streaming for very large logs.
- **Events**: Events are delivered asynchronously. Multiple rapid events may be batched.
- **Cache**: Build list is cached in-memory. Refresh after mutations if needed.

## See Also

- [Build Search Architecture](./build-search-architecture.md)
- [Build Search Plan](./build-search-plan.md)
- [Migration Guide](./build-search-migration.md)
