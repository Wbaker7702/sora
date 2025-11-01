# Build Search Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Renderer Process                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              UI Components                                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ Global Search│  │ Pipeline Hist│  │ Pipeline Logs│   │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │  │
│  └─────────┼──────────────────┼──────────────────┼──────────┘  │
│            │                  │                  │                │
│  ┌─────────┼──────────────────┼──────────────────┼──────────┐  │
│  │         │  Build Search     │                  │          │  │
│  │         │  Service          │                  │          │  │
│  │         │  (fuse.js)        │                  │          │  │
│  │         └─────────┬─────────┘                  │          │  │
│  └───────────────────┼─────────────────────────────┼──────────┘  │
│                      │                              │              │
│  ┌───────────────────┼──────────────────────────────┼──────────┐  │
│  │            IPC Communication                      │          │  │
│  │       window.sorobanApi.builds.*                 │          │  │
│  └───────────────────┼──────────────────────────────┼──────────┘  │
└──────────────────────┼──────────────────────────────┼──────────────┘
                       │                              │
                       │ IPC (contextBridge)          │
                       │                              │
┌──────────────────────┼──────────────────────────────┼──────────────┐
│         Main Process │                              │              │
│                      │                              │              │
│  ┌───────────────────┼──────────────────────────────┼──────────┐  │
│  │        IPC Handlers                              │          │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────┐│          │  │
│  │  │ builds:save  │ │ builds:getAll│ │builds:get  ││          │  │
│  │  │ builds:search│ │ builds:getLogs││builds:delete│          │  │
│  │  └──────┬───────┘ └──────┬───────┘ └─────┬─────┘│          │  │
│  └─────────┼─────────────────┼───────────────┼──────┘          │  │
│            │                  │               │                   │  │
│  ┌─────────┼──────────────────┼───────────────┼──────────────┐  │  │
│  │         │  Electron Store    │              │ File System   │  │  │
│  │         │  (Schema-based)   │              │               │  │  │
│  │         │  ┌──────────────┐ │              │ ┌──────────┐  │  │  │
│  │         │  │ Build Metadata│ │              │ │ Log Files│  │  │  │
│  │         │  │ - builds[]    │ │              │ │ {buildId}│  │  │  │
│  │         │  │ - configs[]   │ │              │ │ /logs.txt│  │  │  │
│  │         │  └──────────────┘ │              │ └──────────┘  │  │  │
│  └─────────┼──────────────────┼──────────────┼───────────────┘  │  │
│            │                  │               │                   │  │
│  ┌─────────┼──────────────────┼───────────────┼──────────────┐  │  │
│  │         │ File Watcher      │              │               │  │  │
│  │         │ (Build Scripts)  │              │               │  │  │
│  │         │ ~/.sora/builds/   │              │               │  │  │
│  │         │ pending/*.json    │              │               │  │  │
│  └─────────┼──────────────────┼───────────────┼───────────────┘  │  │
└────────────┼──────────────────┼───────────────┼────────────────────┘  │
             │                  │               │
             │                  │               │
┌────────────┼──────────────────┼───────────────┼────────────────────┐
│ External   │                  │               │                      │
│ Build      │                  │               │                      │
│ Scripts    │                  │               │                      │
│ (Node.js)  │                  │               │                      │
│            │                  │               │                      │
│ scripts/   │                  │               │                      │
│ build.js   │                  │               │                      │
│            │                  │               │                      │
│ Writes to: │                  │               │                      │
│ ~/.sora/   │                  │               │                      │
│ builds/    │                  │               │                      │
│ pending/   │                  │               │                      │
└────────────┴──────────────────┴───────────────┴────────────────────┘
```

## Data Flow

### 1. Build Creation Flow

```
Build Script Execution
    │
    ├─> Execute build process
    │
    ├─> Collect logs
    │
    ├─> Generate build record
    │
    └─> Write to ~/.sora/builds/pending/{id}.json
         │
         │ File System
         │
         ▼
File Watcher (Main Process)
    │
    ├─> Detect new file
    │
    ├─> Read JSON file
    │
    ├─> Save to Electron Store
    │
    ├─> Save logs to {userData}/builds/{id}/logs.txt
    │
    └─> Send IPC event: 'build:completed'
         │
         │ IPC Event
         │
         ▼
Renderer Process
    │
    ├─> Receive event
    │
    ├─> Update UI state
    │
    └─> Update search index
```

### 2. Search Flow

```
User Input (Global Search or Pipeline History)
    │
    ├─> Debounce (300ms)
    │
    ├─> Parse query (extract filters)
    │
    └─> Call BuildSearchService.search()
         │
         │ Renderer Process
         │
         ├─> Load builds from state/cache
         │
         ├─> Apply fuse.js search
         │
         ├─> Apply filters
         │
         ├─> Paginate results
         │
         └─> Return SearchResult
              │
              ▼
         Update UI
              │
              ├─> Display results
              │
              ├─> Highlight matches
              │
              └─> Show result count
```

### 3. Log Search Flow

```
User Input (Pipeline Logs Search)
    │
    ├─> Get build ID
    │
    └─> Call window.sorobanApi.builds.searchLogs(buildId, query)
         │
         │ IPC Invoke
         │
         ▼
Main Process
    │
    ├─> Read log file: {userData}/builds/{buildId}/logs.txt
    │
    ├─> Search lines (regex)
    │
    ├─> Return LogMatch[]
    │
    └─> Renderer Process
         │
         ├─> Highlight matching lines
         │
         ├─> Navigate between matches
         │
         └─> Update UI
```

## Component Structure

```
renderer/
├── types/
│   └── builds.ts              # TypeScript interfaces
├── lib/
│   ├── build-storage.ts       # Storage service (optional wrapper)
│   └── build-search.ts        # Search service (fuse.js)
├── components/
│   ├── common/
│   │   └── global-search.tsx  # Enhanced with build items
│   └── deployment-pipeline/
│       ├── DeploymentPipeline.tsx  # Main component
│       ├── PipelineHistory.tsx     # Enhanced search
│       ├── PipelineLogs.tsx        # Log search
│       └── PipelineConfig.tsx      # Config management
└── pages/
    └── deployment-pipeline.tsx      # Page wrapper

main/
├── background.ts              # IPC handlers, store schema
├── preload.ts                 # Context bridge API
└── helpers/
    └── build-runner.ts        # (Future) Real-time build execution
```

## Storage Schema

```typescript
electron-store schema:
{
  projects: [...],
  identities: [...],
  contractEvents: [...],
  conversation: {...},
  builds: [                    // NEW
    {
      id: string,
      name: string,
      project: string,
      platform: BuildPlatform,
      status: BuildStatus,
      trigger: BuildTrigger,
      createdAt: string,
      completedAt?: string,
      duration?: number,
      error?: string,
      commitHash?: string,
      commitMessage?: string,
      logPath?: string
    }
  ],
  buildConfigs: [...]          // NEW
}

File System:
{userData}/
  builds/
    {buildId}/
      logs.txt
      steps/
        step-1.log (optional)
```

## IPC Communication Pattern

### Request-Response Pattern (IPC Invoke)

```typescript
// Renderer → Main
await window.sorobanApi.builds.save(build);
await window.sorobanApi.builds.getAll();
await window.sorobanApi.builds.search(query, filters);

// Main → Renderer (via preload)
ipcRenderer.invoke("builds:save", build);
```

### Event Pattern (IPC Events)

```typescript
// Main → Renderer
webContents.send("build:completed", buildRecord);
webContents.send("build:updated", buildRecord);
webContents.send("build:log", buildId, logLine);

// Renderer → Main (subscribe)
window.sorobanApi.builds.on("build:completed", handler);
```

## Search Index Structure

```typescript
// In-memory index (fuse.js)
Fuse<BuildRecord> {
  list: BuildRecord[],        // All builds
  keys: [
    { name: "name", weight: 0.3 },
    { name: "project", weight: 0.3 },
    { name: "platform", weight: 0.2 },
    { name: "status", weight: 0.1 },
    { name: "error", weight: 0.1 }
  ],
  threshold: 0.3,            // Fuzzy matching
  includeScore: true
}

// Index updates:
- On app start: Load all builds from store
- On new build: Add to index
- On build update: Update index
- On build delete: Remove from index
```

## Performance Considerations

### Caching Strategy

```
┌─────────────────────────────────────────┐
│         Renderer Process               │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   BuildSearchService              │  │
│  │   (Singleton)                     │  │
│  │                                    │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │  Cache Layer                │  │  │
│  │  │  - Builds array (memory)     │  │  │
│  │  │  - Search index (fuse.js)   │  │  │
│  │  │  - Query cache (Map)         │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Cache Invalidation:                    │
│  - On build create/update/delete        │
│  - On app start (reload from store)     │
└─────────────────────────────────────────┘
```

### Lazy Loading Strategy

```
Log File Loading:
┌─────────────────────────────────────┐
│  1. Load build metadata (store)     │
│     ↓                                │
│  2. Display in list (no logs)       │
│     ↓                                │
│  3. User clicks "View Logs"         │
│     ↓                                │
│  4. Load log file (IPC)             │
│     ↓                                │
│  5. Display logs                    │
└─────────────────────────────────────┘

For large logs (> 1MB):
- Stream log file
- Load in chunks
- Virtual scrolling
```

## Security Considerations

```
┌─────────────────────────────────────────┐
│         Security Boundaries             │
│                                         │
│  Renderer Process:                     │
│  - No direct file system access        │
│  - All operations via IPC              │
│  - Query sanitization                  │
│                                         │
│  Main Process:                         │
│  - File path validation                │
│  - Schema validation (electron-store)  │
│  - Log injection prevention            │
│                                         │
│  Build Scripts:                        │
│  - Run in separate process             │
│  - Sandboxed execution                 │
│  - Output sanitization                 │
└─────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────┐
│         Error Handling                  │
│                                         │
│  IPC Errors:                           │
│  - Try-catch in handlers               │
│  - Return error objects                │
│  - Log via electron-log                │
│                                         │
│  Search Errors:                        │
│  - Empty query handling                 │
│  - Invalid filter handling             │
│  - Index corruption recovery           │
│                                         │
│  Storage Errors:                       │
│  - Schema validation errors            │
│  - File read/write errors              │
│  - Fallback to empty state             │
└─────────────────────────────────────────┘
```

## Future Enhancements Architecture

```
┌─────────────────────────────────────────┐
│      Future: Real-time Build Execution │
│                                         │
│  Main Process:                         │
│  ┌────────────────────────────────┐    │
│  │  BuildRunner                   │    │
│  │  - Spawn child process         │    │
│  │  - Stream stdout/stderr        │    │
│  │  - Real-time log updates       │    │
│  │  - Progress tracking           │    │
│  └────────────────────────────────┘    │
│                                         │
│  IPC Events:                           │
│  - build:started                       │
│  - build:log                           │
│  - build:progress                      │
│  - build:completed                     │
│  - build:failed                        │
└─────────────────────────────────────────┘
```
