import * as fs from "fs";
import { LogEntry } from "../types";

export function readLogFile(filePath: string): LogEntry[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const entries = content.split("\n").filter((line) => line.trim() !== "");
    return entries
      .map((entry) => parseLogEntry(entry))
      .filter((entry): entry is LogEntry => entry !== null);
  } catch (error) {
    console.error(`Error reading log file: ${error}`);
    return [];
  }
}

function parseLogEntry(entry: string): LogEntry | null {
  const match = entry.match(/\[(.*?)\] (.*?) (\/.*?) Result: (.*)/s);
  if (match) {
    return {
      timestamp: match[1],
      command: match[2],
      path: match[3],
      result: match[4],
    };
  }
  return null;
}

export function formatCliOutput(result: string): string {
  try {
    let output = "Command Output:\n\n";

    // Try to parse as JSON first
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(result);
      // If parsing succeeds, format it nicely
      if (typeof parsedResult === "string") {
        output += parsedResult
          .split("\n")
          .map((line: string) => `  ${line}`)
          .join("\n");
      } else {
        output += JSON.stringify(parsedResult, null, 2)
          .split("\n")
          .map((line: string) => `  ${line}`)
          .join("\n");
      }
    } catch {
      // If not JSON, treat as plain string
      output += result
        .split("\n")
        .map((line: string) => `  ${line}`)
        .join("\n");
    }
    return output;
  } catch (error) {
    console.error("Error formatting output:", error);
    return result;
  }
}
