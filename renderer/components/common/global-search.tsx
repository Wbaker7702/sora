"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { useDebounce } from "react-use";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Badge } from "components/ui/badge";
import {
  HomeIcon,
  DatabaseIcon,
  MonitorXIcon,
  CircuitBoardIcon,
  SettingsIcon,
  BookIcon,
  BookKeyIcon,
  RadioIcon,
  BotIcon,
  BarChart3Icon,
  SearchIcon,
  FileTextIcon,
  CodeIcon,
  ZapIcon,
  GitBranchIcon,
  HistoryIcon,
} from "lucide-react";

interface SearchableItem {
  id: string;
  title: string;
  description: string;
  href: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const searchableItems: SearchableItem[] = [
  // Navigation items
  {
    id: "projects",
    title: "Projects",
    description: "Manage your Soroban projects",
    href: "/projects",
    category: "Navigation",
    icon: DatabaseIcon,
    tags: ["projects", "manage", "soroban"],
  },
  {
    id: "identities",
    title: "Identities",
    description: "Manage your Soroban identities",
    href: "/identities",
    category: "Navigation",
    icon: CircuitBoardIcon,
    tags: ["identities", "keys", "wallet"],
  },
  {
    id: "contracts",
    title: "Contracts",
    description: "Interact with Soroban contracts",
    href: "/contracts",
    category: "Navigation",
    icon: HomeIcon,
    tags: ["contracts", "interact", "deploy"],
  },
  {
    id: "events",
    title: "Events",
    description: "Monitor contract events",
    href: "/events",
    category: "Navigation",
    icon: RadioIcon,
    tags: ["events", "monitor", "logs"],
  },
  {
    id: "lab",
    title: "Lab",
    description: "Experimental Soroban features",
    href: "/lab",
    category: "Navigation",
    icon: MonitorXIcon,
    tags: ["lab", "experimental", "test"],
  },
  {
    id: "metrics",
    title: "Metrics",
    description: "Real-time contract analytics and testing",
    href: "/metrics",
    category: "Navigation",
    icon: BarChart3Icon,
    tags: ["metrics", "analytics", "testing", "mobile", "visualizer"],
  },
  {
    id: "deployment-pipeline",
    title: "Deployment Pipeline",
    description: "Automated testing and deployment workflows",
    href: "/deployment-pipeline",
    category: "Navigation",
    icon: GitBranchIcon,
    tags: ["pipeline", "deployment", "ci", "cd", "automation"],
  },
  {
    id: "documentation-generator",
    title: "Documentation Generator",
    description: "Auto-generate docs from contracts",
    href: "/documentation-generator",
    category: "Navigation",
    icon: FileTextIcon,
    tags: ["docs", "documentation", "generator", "contracts"],
  },
  {
    id: "cursor-agent",
    title: "Cursor Agent",
    description: "AI-powered development assistant",
    href: "/cursor-agent",
    category: "Navigation",
    icon: BotIcon,
    tags: ["ai", "assistant", "cursor"],
  },
  {
    id: "settings",
    title: "Settings",
    description: "Application configuration",
    href: "/settings",
    category: "Navigation",
    icon: SettingsIcon,
    tags: ["settings", "config", "preferences"],
  },
  {
    id: "logs",
    title: "Logs",
    description: "View application logs",
    href: "/logs",
    category: "Navigation",
    icon: BookKeyIcon,
    tags: ["logs", "debug", "monitor"],
  },
  {
    id: "about",
    title: "About",
    description: "About Sora application",
    href: "/about",
    category: "Navigation",
    icon: BookIcon,
    tags: ["about", "info", "help"],
  },
  // Commands
  {
    id: "new-project",
    title: "New Project",
    description: "Create a new Soroban project",
    href: "/projects",
    category: "Commands",
    icon: FileTextIcon,
    tags: ["new", "create", "project"],
  },
  {
    id: "deploy-contract",
    title: "Deploy Contract",
    description: "Deploy a contract to the network",
    href: "/contracts",
    category: "Commands",
    icon: CodeIcon,
    tags: ["deploy", "contract", "network"],
  },
  {
    id: "run-lab-command",
    title: "Run Lab Command",
    description: "Execute experimental commands",
    href: "/lab",
    category: "Commands",
    icon: ZapIcon,
    tags: ["run", "execute", "lab"],
  },
  {
    id: "create-pipeline",
    title: "Create Pipeline",
    description: "Set up automated deployment pipeline",
    href: "/deployment-pipeline",
    category: "Commands",
    icon: GitBranchIcon,
    tags: ["pipeline", "create", "deployment"],
  },
  {
    id: "generate-docs",
    title: "Generate Documentation",
    description: "Create documentation from contract",
    href: "/documentation-generator",
    category: "Commands",
    icon: FileTextIcon,
    tags: ["docs", "generate", "documentation"],
  },
  // Build-related items
  {
    id: "build-history",
    title: "Build History",
    description: "View past build executions",
    href: "/deployment-pipeline?tab=history",
    category: "Builds",
    icon: HistoryIcon,
    tags: ["build", "history", "deployment"],
  },
  {
    id: "search-builds",
    title: "Search Builds",
    description: "Search build history and logs",
    href: "/deployment-pipeline?tab=history&search=true",
    category: "Builds",
    icon: SearchIcon,
    tags: ["build", "search", "logs"],
  },
];

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const router = useRouter();

  useDebounce(
    () => {
      setDebouncedQuery(searchQuery);
    },
    300,
    [searchQuery]
  );

  const filteredItems = useMemo(() => {
    if (!debouncedQuery) return searchableItems;

    const query = debouncedQuery.toLowerCase();
    return searchableItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query)
    );
  }, [debouncedQuery]);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: SearchableItem[] } = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleSelect = (item: SearchableItem) => {
    router.push(item.href);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search commands, pages, or features..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <SearchIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No results found for "{debouncedQuery}"
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try searching for pages, commands, or features
            </p>
          </div>
        </CommandEmpty>
        {Object.entries(groupedItems).map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.description} ${item.tags.join(" ")}`}
                onSelect={() => handleSelect(item)}
                className="flex items-center gap-3"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}