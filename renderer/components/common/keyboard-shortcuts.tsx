"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { useToast } from "hooks/use-toast";
import { GlobalSearch } from "./global-search";
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
  SearchIcon,
  MoonIcon,
  SunIcon,
  MonitorIcon,
} from "lucide-react";

interface KeyboardShortcutsProps {
  children?: React.ReactNode;
}

const shortcuts = [
  {
    key: "ctrl+k",
    description: "Open command palette",
    action: "search",
  },
  {
    key: "ctrl+shift+d",
    description: "Toggle dark mode",
    action: "theme",
  },
  {
    key: "ctrl+1",
    description: "Go to Projects",
    action: "navigate",
    href: "/projects",
  },
  {
    key: "ctrl+2",
    description: "Go to Identities",
    action: "navigate",
    href: "/identities",
  },
  {
    key: "ctrl+3",
    description: "Go to Contracts",
    action: "navigate",
    href: "/contracts",
  },
  {
    key: "ctrl+4",
    description: "Go to Events",
    action: "navigate",
    href: "/events",
  },
  {
    key: "ctrl+5",
    description: "Go to Lab",
    action: "navigate",
    href: "/lab",
  },
  {
    key: "ctrl+6",
    description: "Go to Cursor Agent",
    action: "navigate",
    href: "/cursor-agent",
  },
  {
    key: "ctrl+7",
    description: "Go to Settings",
    action: "navigate",
    href: "/settings",
  },
  {
    key: "ctrl+8",
    description: "Go to Logs",
    action: "navigate",
    href: "/logs",
  },
  {
    key: "ctrl+9",
    description: "Go to About",
    action: "navigate",
    href: "/about",
  },
];

const navigationItems = [
  { title: "Projects", href: "/projects", icon: DatabaseIcon },
  { title: "Identities", href: "/identities", icon: CircuitBoardIcon },
  { title: "Contracts", href: "/contracts", icon: HomeIcon },
  { title: "Events", href: "/events", icon: RadioIcon },
  { title: "Lab", href: "/lab", icon: MonitorXIcon },
  { title: "Cursor Agent", href: "/cursor-agent", icon: BotIcon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
  { title: "Logs", href: "/logs", icon: BookKeyIcon },
  { title: "About", href: "/about", icon: BookIcon },
];

export function KeyboardShortcuts({ children }: KeyboardShortcutsProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Command palette
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }

      // Theme toggle
      if (e.key === "d" && e.metaKey && e.shiftKey) {
        e.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
        toast({
          title: "Theme changed",
          description: `Switched to ${theme === "dark" ? "light" : "dark"} mode`,
        });
      }

      // Navigation shortcuts
      const numKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      if (numKeys.includes(e.key) && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (navigationItems[index]) {
          router.push(navigationItems[index].href);
          toast({
            title: "Navigated",
            description: `Switched to ${navigationItems[index].title}`,
          });
        }
      }

      // Show shortcuts help
      if (e.key === "?" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router, theme, setTheme, toast]);

  return (
    <>
      {children}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Keyboard Shortcuts Help Dialog */}
      <CommandDialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <CommandInput placeholder="Search shortcuts..." />
        <CommandList>
          <CommandEmpty>No shortcuts found.</CommandEmpty>
          <CommandGroup heading="General">
            {shortcuts.slice(0, 2).map((shortcut) => (
              <CommandItem key={shortcut.key}>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  {shortcut.key}
                </kbd>
                <span className="ml-2">{shortcut.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Navigation">
            {shortcuts.slice(2).map((shortcut) => (
              <CommandItem key={shortcut.key}>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  {shortcut.key}
                </kbd>
                <span className="ml-2">{shortcut.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}