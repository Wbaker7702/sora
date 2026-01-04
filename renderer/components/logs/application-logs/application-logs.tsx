import { useEffect, useState } from "react";
import { ApplicationLogsDataTable } from "components/logs/application-logs/application-logs-data-table";
import { createApplicationLogsColumns } from "components/logs/application-logs/application-logs-columns";
import { Button } from "components/ui/button";
import { ReloadIcon, DownloadIcon } from "@radix-ui/react-icons";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export default function ApplicationLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  async function getLogs() {
    try {
      const logContent: string = await window.sorobanApi.readLogs();

      const logEntries = logContent
        .split("\n")
        .filter(entry => entry.trim() !== "");

      const parsedLogs = logEntries.map(entry => {
        const [timestamp, level, message] = entry.split(/\[(\w+)\]/);
        return {
          timestamp: timestamp.trim(),
          level: level.trim(),
          message: message.trim(),
        };
      });

      // Show only the latest 100 log entries
      const latestLogs = parsedLogs.slice(-100);
      setLogs(latestLogs);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching logs: ${error}`);
    }
  }

  useEffect(() => {
    getLogs();
  }, []);

  const handleDownload = () => {
    const content = logs
      .map(l => `[${l.timestamp}] [${l.level}] ${l.message}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sora-logs-${new Date().toISOString()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const columns = createApplicationLogsColumns();

  return (
    <ApplicationLogsDataTable
      columns={columns}
      data={logs}
      actions={
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={getLogs}>
            <ReloadIcon className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
      }
    />
  );
}
