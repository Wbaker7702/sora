import fixPath from "fix-path";
fixPath();

import { app, ipcMain, dialog, BrowserWindow } from "electron";
import serve from "electron-serve";
const { readFile } = require("fs").promises;

// Analytics
import { initialize } from "@aptabase/electron/main";
import { trackEvent } from "@aptabase/electron/main";

import { createWindow } from "./helpers";
import { executeSorobanCommand } from "./helpers/soroban-helper";
import { handleProjects } from "./helpers/manage-projects";
import { handleIdentities } from "./helpers/manage-identities";
import { findContracts } from "./helpers/find-contracts";
import { checkEditors } from "./helpers/check-editors";
import { openProjectInEditor } from "./helpers/open-project-in-editor";
import { handleContractEvents } from "./helpers/manage-contract-events";
import * as OpenAIHelper from "./helpers/openai-helper";
import * as CursorAgentHelper from "./helpers/cursor-agent-helper";

const path = require("node:path");
const fs = require("fs");
const toml = require("toml");
const { shell } = require("electron");
const log = require("electron-log/main");
const { autoUpdater } = require("electron-updater");

const isProd = process.env.NODE_ENV === "production";

const Store = require("electron-store");

const schema = {
  projects: {
    type: "array",
    default: [],
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        path: { type: "string" },
        active: { type: "boolean" },
      },
      required: ["name", "path"],
    },
  },
  identities: {
    type: "array",
    default: [],
    items: {
      type: "object",
      properties: {
        name: { type: "string" },
        address: { type: "string" },
      },
    },
  },
  contractEvents: {
    type: "array",
    default: [],
    items: {
      type: "object",
      properties: {
        start_ledger: { type: "string" },
        cursor: { type: "string" },
        output: {
          type: "string",
          enum: ["pretty", "plain", "json"],
          default: "pretty",
        },
        count: { type: "string" },
        contract_id: {
          type: "string",
        },
        topic_filters: {
          type: "string",
        },
        event_type: {
          type: "string",
          enum: ["all", "contract", "system"],
          default: "all",
        },
        is_global: { type: "boolean", default: false },
        config_dir: { type: "string", default: "." },
        rpc_url: { type: "string" },
        network_passphrase: { type: "string" },
        network: { type: "string" },
      },
      required: [
        "start_ledger",
        "cursor",
        "rpc_url",
        "network_passphrase",
        "network",
      ],
    },
  },
  conversation: {
    type: "object",
    default: {
      threadId: "",
      assistantId: "",
    },
  },
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
          enum: ["mac", "linux", "win32", "win64", "mac-universal"],
        },
        status: {
          type: "string",
          enum: ["idle", "running", "completed", "failed", "paused"],
        },
        trigger: {
          type: "string",
          enum: ["manual", "git", "schedule"],
        },
        createdAt: { type: "string" },
        completedAt: { type: "string" },
        duration: { type: "number" },
        error: { type: "string" },
        commitHash: { type: "string" },
        commitMessage: { type: "string" },
        logPath: { type: "string" },
      },
      required: ["id", "name", "project", "platform", "status", "createdAt"],
    },
  },
  buildConfigs: {
    type: "array",
    default: [],
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        project: { type: "string" },
        trigger: {
          type: "string",
          enum: ["manual", "git", "schedule"],
        },
        gitBranch: { type: "string" },
        schedule: { type: "string" },
      },
      required: ["id", "name", "project"],
    },
  },
};

const store = new Store({ schema });

// Aptabase Analytics
initialize("A-EU-8145589126");

// Set up logging
const commandLog = log.create("command");
commandLog.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}]  {text}";
commandLog.transports.file.fileName = "soroban-commands.log";
commandLog.transports.file.file = path.join(
  app.getPath("userData"),
  "soroban-commands.log"
);

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
log.transports.file.fileName = "sora.log";
log.transports.file.file = path.join(app.getPath("userData"), "app.log");
const logFilePath = log.transports.file.getFile().path;

async function handleFileOpen() {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (!canceled) {
      log.info("File open dialog completed. Selected directory:", filePaths[0]);
      trackEvent("directory_opened", { path: filePaths[0] });
      return filePaths[0];
    }
  } catch (error) {
    log.error("Error occurred while opening the file dialog:", error);
  }
}

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();
  trackEvent("app_started");
  autoUpdater.checkForUpdatesAndNotify();

  const mainWindow = createWindow("main", {
    width: 1500,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  ipcMain.handle("app:reload", () => {
    if (mainWindow) {
      mainWindow.reload();
    }
  });

  ipcMain.handle("open-external-link", async (event, url) => {
    if (url) {
      trackEvent("external_link_opened", { url });
      await shell.openExternal(url);
    }
  });

  ipcMain.handle("openai:saveApiKey", async (_, apiKey: string) => {
    return await OpenAIHelper.saveApiKey(apiKey);
  });

  ipcMain.handle("openai:getApiKey", async () => {
    return await OpenAIHelper.getApiKey();
  });

  ipcMain.handle("openai:deleteApiKey", async () => {
    return await OpenAIHelper.deleteApiKey();
  });

  ipcMain.handle("openai:createGeneralAssistant", async () => {
    return await OpenAIHelper.createGeneralAssistant();
  });

  ipcMain.handle("openai:createCliAssistant", async () => {
    return await OpenAIHelper.createCliAssistant();
  });

  ipcMain.handle("openai:createThread", async (_, initialMessage?: string) => {
    return await OpenAIHelper.createThread(initialMessage);
  });

  ipcMain.handle(
    "openai:sendMessage",
    async (_, threadId: string, message: string) => {
      return await OpenAIHelper.sendMessage(threadId, message);
    }
  );

  ipcMain.handle(
    "openai:runAssistant",
    async (_, threadId: string, assistantId: string) => {
      return await OpenAIHelper.runAssistant(threadId, assistantId);
    }
  );

  ipcMain.handle(
    "openai:getRunStatus",
    async (_, threadId: string, runId: string) => {
      return await OpenAIHelper.getRunStatus(threadId, runId);
    }
  );

  ipcMain.handle("openai:getMessages", async (_, threadId: string) => {
    return await OpenAIHelper.getMessages(threadId);
  });

  ipcMain.handle(
    "openai:saveConversation",
    async (
      _,
      threadId: string,
      assistantId: string,
      assistantType: "general" | "cli"
    ) => {
      return await OpenAIHelper.saveConversation(
        store,
        threadId,
        assistantId,
        assistantType
      );
    }
  );

  ipcMain.handle(
    "openai:clearConversation",
    async (_, assistantType: "general" | "cli") => {
      return await OpenAIHelper.clearConversation(store, assistantType);
    }
  );

  ipcMain.handle(
    "openai:getConversation",
    async (_, assistantType: "general" | "cli") => {
      return await OpenAIHelper.getConversation(store, assistantType);
    }
  );

  // Cursor Agent handlers
  ipcMain.handle("cursor:saveApiKey", async (_, apiKey: string) => {
    return await CursorAgentHelper.saveCursorApiKey(apiKey);
  });

  ipcMain.handle("cursor:getApiKey", async () => {
    return await CursorAgentHelper.getCursorApiKey();
  });

  ipcMain.handle("cursor:deleteApiKey", async () => {
    return await CursorAgentHelper.deleteCursorApiKey();
  });

  ipcMain.handle("cursor:getAgentInfo", async () => {
    return await CursorAgentHelper.getCursorAgentInfo();
  });

  ipcMain.handle("cursor:createConversation", async () => {
    return await CursorAgentHelper.createCursorAgentConversation();
  });

  ipcMain.handle(
    "cursor:sendMessage",
    async (_, conversationId: string, message: string) => {
      return await CursorAgentHelper.sendMessageToCursorAgent(conversationId, message);
    }
  );

  ipcMain.handle("cursor:getMessages", async (_, conversationId: string) => {
    return await CursorAgentHelper.getCursorAgentMessages(conversationId);
  });

  ipcMain.handle("cursor:saveConversation", async (_, conversationId: string) => {
    return await CursorAgentHelper.saveCursorConversation(store, conversationId);
  });

  ipcMain.handle("cursor:getConversation", async () => {
    return await CursorAgentHelper.getCursorConversation(store);
  });

  ipcMain.handle("cursor:clearConversation", async () => {
    return await CursorAgentHelper.clearCursorConversation(store);
  });

  ipcMain.handle("cursor:mockResponse", async (_, message: string) => {
    return await CursorAgentHelper.mockCursorAgentResponse(message);
  });

  ipcMain.handle("check-editors", async () => {
    return await checkEditors();
  });

  ipcMain.handle("open-editor", async (event, projectPath, editor) => {
    return await openProjectInEditor(projectPath, editor);
  });

  ipcMain.handle("get-app-version", async () => {
    const packagePath = path.join(app.getAppPath(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    return packageJson.version;
  });

  ipcMain.handle("get-soroban-version", async () => {
    const versionOutput = await executeSorobanCommand("--version");

    const versionData = {
      sorobanVersion: "Loading...",
      sorobanEnvVersion: "Loading...",
      sorobanEnvInterfaceVersion: "Loading...",
      stellarXdrVersion: "Loading...",
      xdrCurrVersion: "Loading...",
    };

    const lines = versionOutput.split("\n");
    lines.forEach((line) => {
      if (line.includes("soroban ")) {
        versionData.sorobanVersion = line.split(" ")[1];
      } else if (line.includes("soroban-env ")) {
        if (line.includes("interface version")) {
          versionData.sorobanEnvInterfaceVersion = line.split(" ")[3];
        } else {
          versionData.sorobanEnvVersion = line.split(" ")[1];
        }
      } else if (line.includes("stellar-xdr ")) {
        versionData.stellarXdrVersion = line.split(" ")[1];
      } else if (line.includes("xdr curr ")) {
        versionData.xdrCurrVersion = line.split(" ")[2];
      }
    });

    return versionData;
  });

  ipcMain.handle("check-file-exists", async (event, filePath) => {
    return fs.existsSync(filePath);
  });

  ipcMain.handle(
    "soroban-command",
    async (event, command, subcommand, args?, flags?, path?) => {
      try {
        trackEvent("command_executed", {
          command,
          subcommand,
          args,
          flags,
          path,
        });

        const result = await executeSorobanCommand(
          command,
          subcommand,
          args,
          flags,
          path
        );

        if (
          command &&
          (command === "contract" ||
            command === "lab" ||
            command === "xdr" ||
            command === "events")
        ) {
          const formattedResult = result
            ? `Result: ${JSON.stringify(result)}`
            : "";

          // Check the installed CLI type
          const versionOutput = await executeSorobanCommand("--version");
          const cliType = versionOutput.trim().startsWith("stellar")
            ? "stellar"
            : "soroban";

          commandLog.info(
            cliType,
            command,
            subcommand ? subcommand : "",
            args ? args.join(" ") : "",
            flags ? flags.join(" ") : "",
            path ? path : "",
            formattedResult
          );
        }

        return result;
      } catch (error) {
        log.error("Error while executing command:", error);
        throw error;
      }
    }
  );

  // Add an IPC handler to fetch the logs
  ipcMain.handle("fetch-logs", async () => {
    try {
      const data = await readFile(logFilePath, "utf-8");
      return data;
    } catch (error) {
      log.error(`Error reading log file: ${error}`);
      throw error;
    }
  });

  ipcMain.handle("fetch-command-logs", async () => {
    try {
      const commandLogFilePath = commandLog.transports.file.getFile().path;
      const data = await readFile(commandLogFilePath, "utf-8");
      return data;
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle("dialog:openDirectory", handleFileOpen);

  // Store: Projects Handler
  ipcMain.handle("store:manageProjects", async (event, action, project) => {
    try {
      trackEvent("project_action", { action, project });
      log.info(
        "Project Interaction. Action:",
        action,
        project ? "Project: " + project : ""
      );
      const result = await handleProjects(store, action, project);
      return result;
    } catch (error) {
      log.error("Error on managing projects:", error);
      throw error;
    }
  });

  ipcMain.handle("contracts:list", async (event, directoryPath) => {
    try {
      const contractFiles = findContracts(directoryPath);
      return contractFiles;
    } catch (error) {
      console.error("Error on projects:", error);
      return false;
    }
  });

  ipcMain.handle(
    "store:manageIdentities",
    async (event, action, identity, newIdentity?) => {
      try {
        trackEvent("identity_action", { action, identity, newIdentity });
        log.info(
          "Identity Interaction.",
          action ? "Action: " + action : "",
          identity ? "Identity: " + identity : "",
          newIdentity ? "New Identity: " + newIdentity : ""
        );
        const result = await handleIdentities(
          store,
          action,
          identity,
          newIdentity
        );
        return result;
      } catch (error) {
        log.error("Error on managing identities:", error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    "store:manageContractEvents",
    async (event, action, contractEvents) => {
      try {
        const result = await handleContractEvents(
          store,
          action,
          contractEvents
        );
        return result;
      } catch (error) {
        console.error("Error on contracts:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("is-soroban-project", async (event, directoryPath) => {
    try {
      const cargoTomlPath = path.join(directoryPath, "Cargo.toml");
      if (!fs.existsSync(cargoTomlPath)) {
        return false;
      }

      const cargoTomlContent = fs.readFileSync(cargoTomlPath, "utf8");
      const parsedToml = toml.parse(cargoTomlContent);

      if (parsedToml.dependencies && "soroban-sdk" in parsedToml.dependencies) {
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error while checking for Soroban project: ${error}`);
      return false;
    }
  });

  ipcMain.handle("is-soroban-installed", async (event) => {
    try {
      if (mainWindow) {
        const result = await executeSorobanCommand("--version");
        const trimmedResult = result.trim();

        if (trimmedResult.startsWith("stellar")) {
          const versionMatch = trimmedResult.match(/stellar (\d+\.\d+\.\d+)/);
          if (versionMatch) {
            return {
              installed: true,
              type: "stellar",
              version: versionMatch[1],
            };
          }
        } else if (trimmedResult.startsWith("soroban")) {
          const versionMatch = trimmedResult.match(/soroban (\d+\.\d+\.\d+)/);
          if (versionMatch) {
            return {
              installed: true,
              type: "soroban",
              version: versionMatch[1],
            };
          }
        }

        // If we couldn't parse the version, but it starts with stellar or soroban
        if (
          trimmedResult.startsWith("stellar") ||
          trimmedResult.startsWith("soroban")
        ) {
          return {
            installed: true,
            type: trimmedResult.startsWith("stellar") ? "stellar" : "soroban",
            version: "unknown",
          };
        }

        // If we get here, the command succeeded but the output was unexpected
        return {
          installed: false,
          type: null,
          version: null,
          error: "Unexpected output format",
        };
      } else {
        console.error("Main window not found");
        return {
          installed: false,
          type: null,
          version: null,
          error: "Main window not found",
        };
      }
    } catch (error) {
      console.error(`Error while checking for Soroban installation: ${error}`);
      return {
        installed: false,
        type: null,
        version: null,
        error: error.message || "Unknown error",
      };
    }
  });

  // IPC handler for reading the JSON file
  ipcMain.handle("json:read", async (event, filePath, directoryPath) => {
    try {
      const data = fs.readFileSync(path.join(filePath, directoryPath), "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to read file", error);
      return null; // or handle error as needed
    }
  });

  // IPC handler for updating the JSON file
  ipcMain.handle(
    "json:update",
    async (event, filePath, directoryPath, jsonContent) => {
      try {
        fs.writeFileSync(
          path.join(filePath, directoryPath),
          JSON.stringify(jsonContent, null, 2),
          "utf8"
        );
        return true; // success
      } catch (error) {
        console.error("Failed to write file", error);
        return false; // or handle error as needed
      }
    }
  );

  // Builds IPC Handlers
  const getBuildLogPath = (buildId: string): string => {
    const userData = app.getPath("userData");
    const buildDir = path.join(userData, "builds", buildId);
    return path.join(buildDir, "logs.txt");
  };

  ipcMain.handle("builds:save", async (event, build) => {
    try {
      const builds = store.get("builds", []);
      builds.push(build);
      store.set("builds", builds);

      // Save logs to file if provided
      if (build.logPath || build.logs) {
        const logPath = getBuildLogPath(build.id);
        const buildDir = path.dirname(logPath);
        if (!fs.existsSync(buildDir)) {
          fs.mkdirSync(buildDir, { recursive: true });
        }
        const logContent = build.logs || "";
        fs.writeFileSync(logPath, logContent, "utf-8");
      }

      // Notify renderer
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send("build:completed", build);
      }

      return true;
    } catch (error) {
      log.error(`Error saving build: ${error}`);
      return false;
    }
  });

  ipcMain.handle("builds:getAll", async () => {
    try {
      return store.get("builds", []);
    } catch (error) {
      log.error(`Error getting builds: ${error}`);
      return [];
    }
  });

  ipcMain.handle("builds:get", async (event, id: string) => {
    try {
      const builds = store.get("builds", []);
      return builds.find((b: any) => b.id === id) || null;
    } catch (error) {
      log.error(`Error getting build: ${error}`);
      return null;
    }
  });

  ipcMain.handle("builds:delete", async (event, id: string) => {
    try {
      const builds = store.get("builds", []);
      const filtered = builds.filter((b: any) => b.id !== id);
      store.set("builds", filtered);

      // Delete log files
      const logPath = getBuildLogPath(id);
      if (fs.existsSync(logPath)) {
        const buildDir = path.dirname(logPath);
        fs.rmSync(buildDir, { recursive: true, force: true });
      }

      return true;
    } catch (error) {
      log.error(`Error deleting build: ${error}`);
      return false;
    }
  });

  ipcMain.handle("builds:getLogs", async (event, buildId: string) => {
    try {
      const logPath = getBuildLogPath(buildId);
      if (fs.existsSync(logPath)) {
        const data = await readFile(logPath, "utf-8");
        return data;
      }
      return "";
    } catch (error) {
      log.error(`Error reading build logs: ${error}`);
      return "";
    }
  });

  ipcMain.handle("builds:searchLogs", async (event, buildId: string, query: string) => {
    try {
      const logPath = getBuildLogPath(buildId);
      if (!fs.existsSync(logPath)) {
        return [];
      }

      const logContent = await readFile(logPath, "utf-8");
      const lines = logContent.split("\n");
      const matches: any[] = [];

      const regex = new RegExp(query, "gi");
      lines.forEach((line, index) => {
        const lineMatches: number[] = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          lineMatches.push(match.index);
        }
        if (lineMatches.length > 0) {
          matches.push({
            line: index + 1,
            content: line,
            matches: lineMatches,
          });
        }
      });

      return matches;
    } catch (error) {
      log.error(`Error searching build logs: ${error}`);
      return [];
    }
  });

  ipcMain.handle("builds:saveLogs", async (event, buildId: string, logs: string) => {
    try {
      const logPath = getBuildLogPath(buildId);
      const buildDir = path.dirname(logPath);
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
      }
      fs.writeFileSync(logPath, logs, "utf-8");
      return true;
    } catch (error) {
      log.error(`Error saving build logs: ${error}`);
      return false;
    }
  });

  // Build watchers for real-time updates
  const buildWatchers = new Set<Electron.WebContents>();

  ipcMain.handle("builds:subscribe", (event) => {
    buildWatchers.add(event.sender);
    event.sender.on("destroyed", () => {
      buildWatchers.delete(event.sender);
    });
  });

  async function retrieveAndStoreIdentities() {
    try {
      const result = await executeSorobanCommand("keys", "ls");
      const identityNames = result
        .split("\n")
        .filter(
          (identity) => identity.trim() !== "" && identity.trim() !== "*"
        );

      for (const name of identityNames) {
        // Create an identity object
        const identity = {
          name: name,
        };

        // Add each identity to the store
        try {
          await handleIdentities(store, "add", identity);
        } catch (error) {
          console.error(`Error adding identity '${name}':`, error);
        }
      }
    } catch (error) {
      console.error("Error retrieving identities:", error);
    }
  }

  ipcMain.handle("identity:refresh", async (event) => {
    try {
      const envVars = retrieveAndStoreIdentities();
      return envVars;
    } catch (error) {
      console.error("Failed to read identities from soroban:", error);
      return { error };
    }
  });

  await retrieveAndStoreIdentities();

  if (isProd) {
    await mainWindow.loadURL("app://./projects");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/projects`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on("window-all-closed", () => {
  trackEvent("app_closed");
  app.quit();
});

app.on("before-quit", () => {
  log.info("App is about to quit.");
});

ipcMain.on("message", async (event, arg) => {
  event.reply("message", `${arg} World!`);
});
