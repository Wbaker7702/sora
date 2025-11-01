# Build Search Plan - Review & Recommendations

## Executive Summary

The build search plan is comprehensive and well-structured, covering all major aspects of implementation. However, several areas need refinement to align with the existing codebase architecture and patterns. This review identifies gaps, suggests improvements, and provides specific recommendations.

## ✅ Strengths

1. **Comprehensive Coverage**: Plan covers all major functionality areas (search, storage, UI, integration)
2. **Well-Structured**: Clear phases with logical progression
3. **User-Focused**: Good UX considerations and scenarios
4. **Technical Depth**: Appropriate technical details and considerations

## ⚠️ Areas Requiring Attention

### 1. Storage Architecture Alignment

#### Current State
- `electron-store` is **already installed** (v11.0.2) ✓
- Store uses schema validation pattern (see `main/background.ts:34-108`)
- Logs are stored in files using `electron-log`
- Command logs stored separately via `commandLog` transport

#### Recommendations

**Update Storage Plan**:
```typescript
// Align with existing schema pattern
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
        platform: { type: "string" },
        status: { 
          type: "string",
          enum: ["idle", "running", "completed", "failed", "paused"]
        },
        // ... other fields
      },
      required: ["id", "name", "project", "status", "createdAt"]
    }
  },
  buildConfigs: {
    type: "array",
    default: [],
    // ... schema for configs
  }
};

// Add to existing store schema in main/background.ts
const store = new Store({ schema: { ...existingSchema, ...buildSchema } });
```

**Log Storage Strategy**:
- Use existing `electron-log` infrastructure for build logs
- Store log files in `app.getPath('userData')/builds/{buildId}/logs.txt`
- Leverage existing `fetch-logs` and `fetch-command-logs` IPC pattern
- Create new IPC handlers: `builds:getLogs`, `builds:searchLogs`

### 2. IPC Communication Pattern

#### Current State
- IPC handlers registered in `main/background.ts`
- Preload exposes API via `contextBridge` in `main/preload.ts`
- Renderer accesses via `window.sorobanApi.*`

#### Recommendations

**Follow Existing Pattern**:
```typescript
// main/background.ts
ipcMain.handle("builds:save", async (_, build: BuildRecord) => {
  const builds = store.get("builds", []);
  builds.push(build);
  store.set("builds", builds);
  return true;
});

ipcMain.handle("builds:search", async (_, query: string, filters?: BuildFilters) => {
  // Search implementation
});

ipcMain.handle("builds:getLogs", async (_, buildId: string) => {
  const logPath = path.join(app.getPath('userData'), 'builds', buildId, 'logs.txt');
  return await readFile(logPath, 'utf-8');
});

// main/preload.ts
builds: {
  save: async (build: BuildRecord) => {
    return ipcRenderer.invoke("builds:save", build);
  },
  search: async (query: string, filters?: BuildFilters) => {
    return ipcRenderer.invoke("builds:search", query, filters);
  },
  getLogs: async (buildId: string) => {
    return ipcRenderer.invoke("builds:getLogs", buildId);
  },
  // ... other methods
}

// renderer usage
const builds = await window.sorobanApi.builds.search("production deploy");
```

### 3. Build Script Integration

#### Current State
- Build scripts are Node.js scripts (`scripts/build.js`)
- Run outside Electron context
- No direct IPC communication available

#### Recommendations

**Option A: Hybrid Approach** (Recommended)
- Keep build scripts as standalone Node.js scripts
- After build completion, write build metadata to a JSON file
- Have Electron monitor this file or use a trigger mechanism
- Electron reads and stores in `electron-store`

```javascript
// scripts/build.js - Add at end
const buildRecord = {
  id: generateId(),
  name: `Build ${platform}`,
  // ... other fields
  completedAt: new Date().toISOString(),
  logs: collectedLogs.join('\n')
};

// Write to temp file that Electron can read
const tempPath = path.join(process.env.APPDATA || process.env.HOME, '.sora', 'builds', `${buildRecord.id}.json`);
fs.writeFileSync(tempPath, JSON.stringify(buildRecord, null, 2));

// Electron can periodically check or use file watcher
```

**Option B: Electron Integration**
- Create Electron wrapper for build scripts
- Use `child_process` to execute build commands
- Capture stdout/stderr in real-time
- Store build metadata via IPC

**Recommendation**: Start with Option A for simplicity, migrate to Option B for real-time updates.

### 4. Migration from Mock Data

#### Current State
- `DeploymentPipeline.tsx` uses mock data
- `PipelineHistory.tsx` uses mock data
- `PipelineLogs.tsx` uses mock data

#### Recommendations

**Implementation Strategy**:
1. **Phase 1**: Create storage layer and IPC handlers
2. **Phase 2**: Replace mock data with real data fetching
3. **Phase 3**: Add search functionality
4. **Phase 4**: Enhance UI with advanced features

**Migration Path**:
```typescript
// Before (mock data)
const [pipelines, setPipelines] = useState<Pipeline[]>(mockPipelines);

// After (real data)
const [pipelines, setPipelines] = useState<Pipeline[]>([]);

useEffect(() => {
  async function loadPipelines() {
    const builds = await window.sorobanApi.builds.getAll();
    setPipelines(builds);
  }
  loadPipelines();
}, []);
```

### 5. Search Library Recommendation

#### Current State
- Plan mentions `fuse.js` or `lunr.js`
- No existing search library in use

#### Recommendations

**Recommendation: `fuse.js`**
- Simpler API
- Better TypeScript support
- Good performance for moderate datasets (< 10k items)
- Supports fuzzy search out of the box

**For larger datasets**, consider:
- `lunr.js` - Full-text search index (better for large datasets)
- `minisearch` - Lightweight alternative
- Custom implementation for simple text matching

**Implementation**:
```typescript
import Fuse from 'fuse.js';

const fuse = new Fuse(builds, {
  keys: ['name', 'project', 'platform', 'status'],
  threshold: 0.3, // Fuzzy matching threshold
  includeScore: true
});

const results = fuse.search(query);
```

### 6. Log File Management

#### Current State
- Logs stored in application log files
- File-based storage already exists

#### Recommendations

**Storage Structure**:
```
{userData}/
  builds/
    {buildId}/
      metadata.json
      logs.txt
      steps/
        step-1.log
        step-2.log
```

**Log Rotation**:
- Keep last 100 builds by default
- Configurable retention policy
- Compress old logs (optional)
- Clean up on app start

**Search Implementation**:
- For small logs (< 1MB): Load entire file, search in memory
- For large logs (> 1MB): Stream and search line-by-line
- Index log files for faster searching (optional)

### 7. Real-time Updates

#### Current State
- No real-time update mechanism visible
- Electron IPC supports one-way communication

#### Recommendations

**Use Electron IPC Events**:
```typescript
// main/background.ts
ipcMain.handle("builds:subscribe", (event) => {
  // Store renderer window reference
  buildWatchers.add(event.sender);
});

// When build completes
buildWatchers.forEach(window => {
  window.webContents.send("build:updated", buildRecord);
});

// renderer
useEffect(() => {
  const handleBuildUpdate = (build: BuildRecord) => {
    setPipelines(prev => [build, ...prev]);
  };
  
  window.sorobanApi.on("build:updated", handleBuildUpdate);
  return () => window.sorobanApi.off("build:updated", handleBuildUpdate);
}, []);
```

### 8. Type Safety

#### Recommendations

**Centralize Types**:
```typescript
// renderer/types/builds.ts
export interface BuildRecord {
  id: string;
  name: string;
  project: string;
  platform: string;
  status: "idle" | "running" | "completed" | "failed" | "paused";
  trigger: "manual" | "git" | "schedule";
  createdAt: string;
  completedAt?: string;
  duration?: number;
  logs?: string[];
  config?: BuildConfig;
  error?: string;
  commitHash?: string;
  commitMessage?: string;
}

export interface BuildFilters {
  status?: BuildStatus[];
  platform?: string[];
  project?: string[];
  dateRange?: { start: Date; end: Date };
}
```

**Update Preload Types**:
```typescript
// renderer/types/electron.d.ts
interface SorobanApi {
  // ... existing methods
  builds: {
    save: (build: BuildRecord) => Promise<boolean>;
    getAll: () => Promise<BuildRecord[]>;
    get: (id: string) => Promise<BuildRecord | null>;
    search: (query: string, filters?: BuildFilters) => Promise<BuildRecord[]>;
    getLogs: (buildId: string) => Promise<string>;
    searchLogs: (buildId: string, query: string) => Promise<LogMatch[]>;
    delete: (id: string) => Promise<boolean>;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
  };
}
```

### 9. Performance Considerations

#### Recommendations

**Lazy Loading**:
- Don't load full logs until requested
- Load log metadata separately
- Stream large logs

**Caching Strategy**:
- Cache search results in memory
- Invalidate cache on new builds
- Use React Query or SWR for data fetching

**Indexing**:
- Build search index on app start
- Update index incrementally
- Store index in electron-store

### 10. Testing Strategy Enhancement

#### Recommendations

**Add**:
- Mock IPC handlers for testing
- Test storage serialization/deserialization
- Test search algorithms with various inputs
- Integration tests for IPC communication
- Performance tests for large datasets

**Testing Utilities**:
```typescript
// __tests__/helpers/build-test-utils.ts
export function createMockBuild(overrides?: Partial<BuildRecord>): BuildRecord {
  return {
    id: 'test-1',
    name: 'Test Build',
    project: 'test-project',
    platform: 'linux',
    status: 'completed',
    trigger: 'manual',
    createdAt: new Date().toISOString(),
    ...overrides
  };
}
```

## 📋 Updated Implementation Plan

### Phase 1: Foundation (Week 1)
- [x] Review existing storage patterns
- [ ] Extend store schema with build data
- [ ] Create IPC handlers following existing pattern
- [ ] Set up preload API for builds
- [ ] Define TypeScript interfaces
- [ ] Create build storage service

### Phase 2: Search Engine (Week 2)
- [ ] Install and configure `fuse.js`
- [ ] Implement basic text search
- [ ] Add field-specific search
- [ ] Implement fuzzy search
- [ ] Add search result ranking
- [ ] Create search index management

### Phase 3: UI Components (Week 3)
- [ ] Replace mock data with real data fetching
- [ ] Enhance global search with build items
- [ ] Improve PipelineHistory search
- [ ] Add log search to PipelineLogs
- [ ] Create search result components
- [ ] Add real-time updates

### Phase 4: Integration (Week 4)
- [ ] Integrate with build scripts (Option A)
- [ ] Add build metadata capture
- [ ] Implement log file storage
- [ ] Test end-to-end workflows
- [ ] Add error handling
- [ ] Write comprehensive tests

### Phase 5: Polish (Week 5)
- [ ] Add keyboard shortcuts
- [ ] Improve UX based on feedback
- [ ] Optimize performance
- [ ] Write user documentation
- [ ] Create search tutorial

## 🔧 Specific Code Changes Needed

### 1. Update `main/background.ts`
- Add build schema to store
- Add IPC handlers for builds
- Add log file management

### 2. Update `main/preload.ts`
- Add builds API to contextBridge
- Add event listeners for real-time updates

### 3. Create `renderer/lib/build-storage.ts`
- Implement storage service
- Follow existing patterns from other lib files

### 4. Create `renderer/lib/build-search.ts`
- Implement search service
- Use fuse.js for search

### 5. Update `renderer/components/deployment-pipeline/*`
- Replace mock data
- Add search functionality
- Add real-time updates

### 6. Update `renderer/components/common/global-search.tsx`
- Add build-related items
- Support build search

## 🎯 Success Criteria (Updated)

1. **Functional**
   - ✅ All builds searchable via global search
   - ✅ Advanced search in PipelineHistory
   - ✅ Log search in PipelineLogs
   - ✅ Real-time build updates

2. **Performance**
   - ✅ Search results in < 300ms
   - ✅ Handle 1000+ builds efficiently
   - ✅ Handle 10MB+ log files

3. **Code Quality**
   - ✅ Follows existing IPC patterns
   - ✅ Uses existing store schema pattern
   - ✅ Type-safe throughout
   - ✅ Comprehensive tests

4. **User Experience**
   - ✅ Intuitive search interface
   - ✅ Clear error messages
   - ✅ Helpful search suggestions
   - ✅ Keyboard shortcuts

## 🔍 Missing Considerations

1. **Build Artifact Storage**: Plan doesn't address storing build artifacts (WASM files, etc.)
2. **Build Configuration Persistence**: Plan mentions configs but doesn't detail storage
3. **Build Scheduling**: Plan mentions scheduled builds but doesn't detail implementation
4. **Build Notifications**: Plan mentions notifications but doesn't detail integration
5. **Build Cleanup**: Plan mentions cleanup but doesn't detail retention policy
6. **Error Recovery**: Plan doesn't address handling corrupted build data
7. **Backup/Restore**: Plan doesn't address backing up build history

## 📝 Documentation Updates Needed

1. Update API documentation with new IPC handlers
2. Add build search guide to user docs
3. Add developer guide for extending search
4. Document storage schema
5. Document IPC communication patterns

## ✅ Final Recommendations

1. **Start Small**: Begin with basic search, then add advanced features
2. **Follow Patterns**: Use existing IPC and storage patterns
3. **Type Safety**: Ensure TypeScript types throughout
4. **Testing**: Write tests alongside implementation
5. **Documentation**: Keep docs updated as you build
6. **Performance**: Monitor and optimize as needed
7. **User Feedback**: Gather feedback early and often

## Conclusion

The plan is solid but needs alignment with existing codebase patterns. The recommendations above will ensure a seamless integration that feels native to the Sora application. Focus on following existing patterns, especially around IPC communication and storage, to maintain code consistency and reduce maintenance burden.
