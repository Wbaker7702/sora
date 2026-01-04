// Import necessary components and hooks
import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";

import { SideNav } from "components/sidebar-nav";
import { ModeToggle } from "components/toggle-mode";
import { ReloadToggle } from "components/toggle-reload";
import IdentitySwitcher from "components/identities/identity-switcher";
import { Toaster } from "components/ui/toaster";
import { cn } from "lib/utils";
import { TooltipProvider } from "components/ui/tooltip";
import { Separator } from "components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "components/ui/resizable";
import { ChatbotButton } from "components/chatbot/chatbot-button";
import { KeyboardShortcuts } from "components/common/keyboard-shortcuts";
import { PerformanceMonitor } from "components/common/performance-monitor";
import { ErrorBoundary } from "components/common/error-boundary";

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
  GitBranchIcon,
  FileTextIcon,
  Coins,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Set initial layout and collapsed state
  const defaultLayout = [15, 85];
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const navCollapsedSize = 4;

  const handleCollapse = React.useCallback(() => {
    setIsCollapsed((prevState) => !prevState); // Toggle the collapsed state
    document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
      isCollapsed
    )}`;
  }, []);

  return (
    <ErrorBoundary>
      <KeyboardShortcuts>
        <div className="flex flex-col h-screen w-full">
          <header className="flex flex-row items-center space-x-4 py-4 w-full justify-between border-b pl-1 pr-4">
          {theme === "dark" ? (
            <Image
              key={theme}
              src="/images/sora-light.svg"
              width={120}
              height={25}
              alt="sora_logo_dark"
            />
          ) : (
            <Image
              key={theme}
              src="/images/sora-dark.svg"
              width={120}
              height={25}
              alt="sora_logo_light"
            />
          )}
          <div className="flex flex-row space-x-2">
            <IdentitySwitcher />
            <ReloadToggle />
            <ModeToggle />
          </div>
        </header>
        <TooltipProvider delayDuration={0}>
          <ResizablePanelGroup
            orientation="horizontal"
            onLayoutChange={(layout) => {
              document.cookie = `react-resizable-panels:layout=${JSON.stringify(
                layout
              )}`;
            }}
            className="h-full items-stretch"
          >
            <ResizablePanel
              defaultSize={defaultLayout[0]}
              collapsedSize={navCollapsedSize}
              collapsible={true}
              minSize={10}
              maxSize={15}
              onResize={(layout) => {
                const collapsed = layout.asPercentage < 10;
                setIsCollapsed(collapsed);
                document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                  collapsed
                )}`;
              }}
              className={cn(
                isCollapsed &&
                  "min-w-[50px] transition-all duration-300 ease-in-out"
              )}
            >
              <div className="flex flex-col h-full">
                <div className="flex-grow">
                  <SideNav
                    isCollapsed={isCollapsed}
                    links={[
                      {
                        title: "Projects",
                        label: "",
                        href: "/projects",
                        icon: DatabaseIcon,
                        variant: router.pathname.startsWith("/projects")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "Identities",
                        label: "",
                        href: "/identities",
                        icon: CircuitBoardIcon,
                        variant: router.pathname.startsWith("/identities")
                          ? "default"
                          : "ghost",
                      },

                      {
                        title: "Contracts",
                        label: "",
                        href: "/contracts",
                        icon: HomeIcon,
                        variant: router.pathname.startsWith("/contracts")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "Events",
                        label: "",
                        href: "/events",
                        icon: RadioIcon,
                        variant: router.pathname.startsWith("/events")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "Lab",
                        label: "",
                        href: "/lab",
                        icon: MonitorXIcon,
                        variant: router.pathname.startsWith("/lab")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "Metrics",
                        label: "",
                        href: "/metrics",
                        icon: BarChart3Icon,
                        variant: router.pathname.startsWith("/metrics")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "Nasacoin Core",
                        label: "",
                        href: "/nasacoin-core",
                        icon: Coins,
                        variant: router.pathname.startsWith("/nasacoin-core")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "Pipeline",
                        label: "",
                        href: "/deployment-pipeline",
                        icon: GitBranchIcon,
                        variant: router.pathname.startsWith("/deployment-pipeline")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "Docs",
                        label: "",
                        href: "/documentation-generator",
                        icon: FileTextIcon,
                        variant: router.pathname.startsWith("/documentation-generator")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "Cursor Agent",
                        label: "",
                        href: "/cursor-agent",
                        icon: BotIcon,
                        variant: router.pathname.startsWith("/cursor-agent")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "Config",
                        label: "",
                        href: "/settings",
                        icon: SettingsIcon,
                        variant: router.pathname.startsWith("/settings")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "Logs",
                        label: "",
                        href: "/logs",
                        icon: BookKeyIcon,
                        variant: router.pathname.startsWith("/logs")
                          ? "default"
                          : "ghost",
                      },
                      {
                        title: "About",
                        label: "",
                        href: "/about",
                        icon: BookIcon,
                        variant: router.pathname.startsWith("/about")
                          ? "default"
                          : "ghost",
                      },
                    ]}
                  />
                  <Separator />
                </div>
                <div className="p-2">
                  <ChatbotButton />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={defaultLayout[1]} className="p-4 ">
              <main>{children}</main>
            </ResizablePanel>
          </ResizablePanelGroup>
          </TooltipProvider>
        </div>
        <Toaster />
        <PerformanceMonitor enabled={process.env.NODE_ENV === "development"} />
      </KeyboardShortcuts>
    </ErrorBoundary>
  );
}
