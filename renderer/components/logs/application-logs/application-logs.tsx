import { useEffect, useState } from "react";
import { ApplicationLogsDataTable } from "components/logs/application-logs/application-logs-data-table";
import { createApplicationLogsColumns } from "components/logs/application-logs/application-logs-columns";
import { Button } from "components/ui/button";
import Link from "next/link";
import { Search } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export default function ApplicationLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  async function getLogs() {
    try {
      const logContent = await window.sorobanApi.readLogs();
      
      const logEntries = logContent
        .split("\n")
        .filter((entry) => entry.trim() !== "");

      const parsedLogs = logEntries.map((entry) => {
        const [timestamp, level, message] = entry.split(/\[(\w+)\]/);
        return {
          timestamp: timestamp.trim(),
          level: level.trim(),
          message: message.trim(),
        };
      });

      // Show only the latest 100 log entries in reverse order (latest first)
      const latestLogs = parsedLogs.slice(-100).reverse();
      setLogs(latestLogs);
    } catch (error) {
      console.error(`Error fetching logs: ${error}`);
    }
  }

  useEffect(() => {
    getLogs();
  }, []);

  const columns = createApplicationLogsColumns();

  if (logs.length === 0) {
    return (
      <div className="h-[calc(92vh-106px)] w-full rounded-md border flex flex-col items-center justify-center space-y-4 mt-4">
        <Search className="h-12 w-12" />
        <p className="text-lg">No Application Logs Found</p>
        <p className="text-sm text-gray-600 text-center max-w-sm leading-relaxed">
          There are no application logs available.
          <br />
          Logs are generating while you use the application, please check back later.
        </p>
       
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-106px)]">
      <ApplicationLogsDataTable columns={columns} data={logs} />
    </div>
  );
}
