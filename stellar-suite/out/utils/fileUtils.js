"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLogFile = readLogFile;
exports.formatCliOutput = formatCliOutput;
const fs = __importStar(require("fs"));
function readLogFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const entries = content.split("\n").filter((line) => line.trim() !== "");
        return entries
            .map((entry) => parseLogEntry(entry))
            .filter((entry) => entry !== null);
    }
    catch (error) {
        console.error(`Error reading log file: ${error}`);
        return [];
    }
}
function parseLogEntry(entry) {
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
function formatCliOutput(result) {
    try {
        let output = "Command Output:\n\n";
        // Try to parse as JSON first
        let parsedResult;
        try {
            parsedResult = JSON.parse(result);
            // If parsing succeeds, format it nicely
            if (typeof parsedResult === "string") {
                output += parsedResult
                    .split("\n")
                    .map((line) => `  ${line}`)
                    .join("\n");
            }
            else {
                output += JSON.stringify(parsedResult, null, 2)
                    .split("\n")
                    .map((line) => `  ${line}`)
                    .join("\n");
            }
        }
        catch {
            // If not JSON, treat as plain string
            output += result
                .split("\n")
                .map((line) => `  ${line}`)
                .join("\n");
        }
        return output;
    }
    catch (error) {
        console.error("Error formatting output:", error);
        return result;
    }
}
//# sourceMappingURL=fileUtils.js.map