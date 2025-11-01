# Search & Build Implementation Roadmap

## ?? Current Implementation Status

### ? Completed (100%)

#### Core Infrastructure
- ? **Build Storage System**
  - Electron Store schema for build metadata
  - File system storage for build logs
  - Complete IPC handlers (`builds:save`, `builds:getAll`, `builds:get`, `builds:delete`, etc.)
  - Preload API exposed (`window.sorobanApi.builds.*`)
  - TypeScript type definitions

- ? **Search Engine**
  - `BuildSearchService` class with fuse.js integration
  - Fuzzy search across all build fields
  - Field-specific query parsing (`status:failed`, `platform:linux`)
  - Filter support (status, platform, project, date range)
  - Pagination support
  - Search suggestions

- ? **Log Search**
  - Log file reading and searching
  - Regex pattern matching
  - Match navigation (next/prev)
  - Result highlighting
  - Match counter

- ? **UI Components**
  - PipelineHistory with enhanced search
  - PipelineLogs with real-time log search
  - Global search integration
  - Real-time build updates via IPC events

### ?? Planned but Not Implemented (0%)

#### Build Script Integration
- ? **Automatic Build Tracking**
  - File watcher for build records
  - Automatic processing of build records
  - Real-time log streaming during builds

**Status**: Architecture documented, code examples provided, but not integrated into `scripts/build.js`

**Impact**: Builds run via scripts are NOT automatically tracked. Users must manually save build records or use the API.

## ?? Missing Integration: Build Script ? Build Tracking

### Current Gap

The `scripts/build.js` file currently:
- ? Runs builds successfully
- ? Checks prerequisites
- ? Handles errors
- ? **Does NOT save build records**
- ? **Does NOT track build metadata**
- ? **Does NOT stream logs**

### What Needs to Be Added

#### Option 1: File-Based Integration (Recommended for Initial Implementation)

**Modify `scripts/build.js`:**

```javascript
// Add at top
const crypto = require('crypto');
const os = require('os');

// Add after execCommand function
function saveBuildRecord(platform, success, errorMessage, startTime, logs = []) {
  const buildId = crypto.randomBytes(16).toString('hex');
  const buildRecord = {
    id: buildId,
    name: `Build ${platform}`,
    project: process.env.PROJECT_NAME || path.basename(process.cwd()),
    platform: platform === 'mac-universal' ? 'mac-universal' : platform,
    status: success ? 'completed' : 'failed',
    trigger: process.env.CI ? 'git' : 'manual',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    duration: Math.floor((Date.now() - startTime) / 1000),
    error: errorMessage || undefined,
    commitHash: process.env.GIT_COMMIT || getGitCommit(),
    commitMessage: process.env.GIT_COMMIT_MESSAGE || getGitCommitMessage(),
  };

  // Determine temp directory
  const userData = os.homedir();
  const tempDir = path.join(userData, '.sora', 'builds', 'pending');
  const logDir = path.join(userData, '.sora', 'builds', buildId);

  // Ensure directories exist
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(logDir, { recursive: true });

  // Write build record to temp file
  const tempFile = path.join(tempDir, `${buildId}.json`);
  fs.writeFileSync(tempFile, JSON.stringify(buildRecord, null, 2), 'utf-8');

  // Write logs if provided
  if (logs.length > 0) {
    fs.writeFileSync(
      path.join(logDir, 'logs.txt'),
      logs.join('\n'),
      'utf-8'
    );
  }

  log(`?? Build record saved: ${tempFile}`, 'green');
  return buildRecord;
}

// Helper functions
function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
}

function getGitCommitMessage() {
  try {
    return execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
}

// Modify buildApplication function
function buildApplication(platform = 'all') {
  log(`\n???  Building application for ${platform}...`, 'blue');
  
  const startTime = Date.now();
  const collectedLogs = [];
  
  // ... existing build logic ...
  
  const success = execCommand(command);
  
  // Save build record
  saveBuildRecord(
    platform,
    success,
    success ? undefined : 'Build failed',
    startTime,
    collectedLogs
  );
  
  return success;
}
```

#### Option 2: Electron-Side File Watcher (Required for Option 1)

**Add to `main/background.ts`:**

```typescript
import { watch, readFile } from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);

// Add after app ready
function watchBuildRecords() {
  const userData = app.getPath('userData');
  const pendingDir = path.join(userData, 'builds', 'pending');
  
  // Ensure directory exists
  if (!fs.existsSync(pendingDir)) {
    fs.mkdirSync(pendingDir, { recursive: true });
  }
  
  // Watch for new JSON files
  fs.watch(pendingDir, async (eventType, filename) => {
    if (eventType === 'rename' && filename && filename.endsWith('.json')) {
      const filePath = path.join(pendingDir, filename);
      
      try {
        // Wait a bit for file to be fully written
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const content = await readFileAsync(filePath, 'utf-8');
        const buildRecord = JSON.parse(content);
        
        // Save to electron store
        const builds = store.get('builds', []);
        builds.push(buildRecord);
        store.set('builds', builds);
        
        // Save logs if logPath exists
        if (buildRecord.logPath) {
          // Logs already saved by script
        }
        
        // Notify renderer
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('build:completed', buildRecord);
        }
        
        // Move to processed directory
        const processedDir = path.join(userData, 'builds', 'processed');
        fs.mkdirSync(processedDir, { recursive: true });
        
        const processedPath = path.join(processedDir, filename);
        fs.renameSync(filePath, processedPath);
        
        log.info(`Processed build record: ${buildRecord.id}`);
      } catch (error) {
        log.error(`Error processing build record ${filename}: ${error}`);
      }
    }
  });
}

// Call in app ready handler
watchBuildRecords();
```

## ?? Implementation Priority

### Phase 1: Build Script Integration (High Priority)
1. ? Document integration approach (DONE - this file)
2. ? Add build record saving to `scripts/build.js`
3. ? Add file watcher to `main/background.ts`
4. ? Test integration end-to-end
5. ? Update documentation

**Estimated Time**: 2-3 hours

### Phase 2: Enhancements (Medium Priority)
1. ? Add search result caching
2. ? Improve UI with date picker
3. ? Add unit tests
4. ? Performance optimization

**Estimated Time**: 1-2 days

### Phase 3: Advanced Features (Low Priority)
1. ? Build analytics dashboard
2. ? Export functionality
3. ? Build comparison
4. ? AI-powered search

**Estimated Time**: 1-2 weeks

## ?? Quick Start: Implementing Build Script Integration

### Step 1: Modify Build Script

1. Open `scripts/build.js`
2. Add the helper functions (saveBuildRecord, getGitCommit, etc.)
3. Modify `buildApplication` to track timing and save records
4. Test with: `node scripts/build.js linux`

### Step 2: Add File Watcher

1. Open `main/background.ts`
2. Add `watchBuildRecords()` function
3. Call it in app ready handler
4. Test by running a build and checking if it appears in UI

### Step 3: Test Integration

1. Run a build: `node scripts/build.js linux`
2. Check `~/.sora/builds/pending/` for JSON file
3. Verify Electron processes it
4. Check UI for new build record
5. Test search functionality

### Step 4: Clean Up

1. Verify old build records are moved to `processed/`
2. Add cleanup for old processed files (optional)
3. Document the workflow

## ?? Verification Steps

After implementing build script integration:

- [ ] Run build: `node scripts/build.js linux`
- [ ] Verify JSON file created in `~/.sora/builds/pending/`
- [ ] Verify Electron processes file (check logs)
- [ ] Verify build appears in DeploymentPipeline UI
- [ ] Verify search finds the build
- [ ] Verify log file exists and can be searched
- [ ] Verify processed file moved to `processed/` directory
- [ ] Test with multiple platforms
- [ ] Test with failed builds
- [ ] Test with successful builds

## ?? Code Locations

### Files to Modify

1. **`scripts/build.js`**
   - Add build record saving
   - Track build timing
   - Capture logs (if possible)

2. **`main/background.ts`**
   - Add file watcher function
   - Process build records
   - Emit IPC events

3. **Documentation**
   - Update this roadmap
   - Update API reference if needed
   - Update user guide

## ?? Important Considerations

### Error Handling
- Build script failures should still save records (with `status: failed`)
- File watcher should handle file system errors gracefully
- Missing directories should be created automatically

### Performance
- File watcher should not block Electron
- Large log files should be handled efficiently
- Old processed files should be cleaned up periodically

### Security
- Validate build record structure before saving
- Sanitize file paths
- Prevent path traversal attacks

### Compatibility
- Work on macOS, Linux, and Windows
- Handle different path separators
- Respect user data directory conventions

## ?? Related Documentation

- [Search & Build Overview](./search-build-overview.md) - Complete feature overview
- [Build Search API Reference](./build-search-api-reference.md) - API documentation
- [Build Search Plan](./build-search-plan.md) - Original implementation plan
- [Implementation Summary](./build-search-implementation-summary.md) - What was built
- [Action Checklist](./search-build-action-checklist.md) - Testing checklist

## ? Success Criteria

Build script integration is complete when:

1. ? Running `node scripts/build.js [platform]` automatically creates a build record
2. ? Build records appear in the DeploymentPipeline UI without manual intervention
3. ? Build logs are searchable
4. ? Failed builds are tracked with error status
5. ? Build metadata includes timing, platform, and project info
6. ? The integration works on all platforms (macOS, Linux, Windows)

---

**Status**: ?? Planned but not implemented
**Priority**: High
**Estimated Effort**: 2-3 hours
**Blocker**: None - can be implemented independently
