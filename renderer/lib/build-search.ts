import Fuse from "fuse.js";
import { BuildRecord, BuildFilters } from "types/builds";

export interface SearchOptions {
  query: string;
  filters?: BuildFilters;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  builds: BuildRecord[];
  total: number;
  highlights: Highlight[];
}

export interface LogMatch {
  line: number;
  content: string;
  matches: number[];
}

export interface Highlight {
  field: string;
  positions: number[];
}

export class BuildSearchService {
  private fuse: Fuse<BuildRecord>;
  private builds: BuildRecord[] = [];

  constructor(builds: BuildRecord[]) {
    this.builds = builds;
    this.initializeSearch();
  }

  private initializeSearch() {
    this.fuse = new Fuse(this.builds, {
      keys: [
        { name: "name", weight: 0.3 },
        { name: "project", weight: 0.3 },
        { name: "platform", weight: 0.2 },
        { name: "status", weight: 0.1 },
        { name: "error", weight: 0.1 },
      ],
      threshold: 0.3, // Fuzzy matching threshold (0 = exact, 1 = match anything)
      includeScore: true,
      minMatchCharLength: 2,
    });
  }

  search(options: SearchOptions): SearchResult {
    let results = this.fuse.search(options.query);

    // Apply filters
    if (options.filters) {
      results = this.applyFilters(results, options.filters);
    }

    // Apply pagination
    const total = results.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      builds: paginatedResults.map((r) => r.item),
      total,
      highlights: this.extractHighlights(paginatedResults, options.query),
    };
  }

  private applyFilters(
    results: Fuse.FuseResult<BuildRecord>[],
    filters: BuildFilters
  ): Fuse.FuseResult<BuildRecord>[] {
    return results.filter((result) => {
      const build = result.item;

      if (filters.status && !filters.status.includes(build.status)) {
        return false;
      }
      if (filters.platform && !filters.platform.includes(build.platform)) {
        return false;
      }
      if (filters.project && !filters.project.includes(build.project)) {
        return false;
      }
      if (filters.dateRange) {
        const createdAt = new Date(build.createdAt);
        if (
          createdAt < filters.dateRange.start ||
          createdAt > filters.dateRange.end
        ) {
          return false;
        }
      }
      return true;
    });
  }

  searchLogs(buildId: string, query: string): Promise<LogMatch[]> {
    return window.sorobanApi.builds.searchLogs(buildId, query);
  }

  suggest(query: string): string[] {
    if (query.length < 2) return [];

    const results = this.fuse.search(query, { limit: 5 });
    const suggestions = new Set<string>();

    results.forEach((result) => {
      const build = result.item;
      suggestions.add(build.name);
      suggestions.add(build.project);
      suggestions.add(build.platform);
    });

    return Array.from(suggestions).slice(0, 5);
  }

  private extractHighlights(
    results: Fuse.FuseResult<BuildRecord>[],
    query: string
  ): Highlight[] {
    const highlights: Highlight[] = [];
    const queryLower = query.toLowerCase();

    results.forEach((result) => {
      const build = result.item;
      const fields = ["name", "project", "platform", "status", "error"] as const;

      fields.forEach((field) => {
        const value = String(build[field] || "").toLowerCase();
        const index = value.indexOf(queryLower);
        if (index !== -1) {
          highlights.push({
            field,
            positions: [index],
          });
        }
      });
    });

    return highlights;
  }

  updateBuilds(builds: BuildRecord[]) {
    this.builds = builds;
    this.initializeSearch();
  }

  // Parse query for field-specific syntax (e.g., "status:failed platform:linux")
  static parseQuery(query: string): { text: string; filters: Partial<BuildFilters> } {
    const filters: Partial<BuildFilters> = {};
    let text = query;

    // Extract status filter
    const statusMatch = query.match(/status:(\w+)/i);
    if (statusMatch) {
      filters.status = [statusMatch[1] as BuildRecord["status"]];
      text = text.replace(/status:\w+/gi, "").trim();
    }

    // Extract platform filter
    const platformMatch = query.match(/platform:(\w+)/i);
    if (platformMatch) {
      filters.platform = [platformMatch[1] as BuildRecord["platform"]];
      text = text.replace(/platform:\w+/gi, "").trim();
    }

    // Extract project filter
    const projectMatch = query.match(/project:([^\s]+)/i);
    if (projectMatch) {
      filters.project = [projectMatch[1]];
      text = text.replace(/project:[^\s]+/gi, "").trim();
    }

    return { text, filters };
  }
}
