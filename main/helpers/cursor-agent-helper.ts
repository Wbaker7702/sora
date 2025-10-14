import { safeStorage } from "electron";
import * as fs from "fs";
import * as path from "path";

const CURSOR_API_BASE = "https://api.cursor.com/v1";
const CURSOR_AGENT_ID = "bc-155d5aa3-d043-46af-bb82-fc706038f7fc";

interface CursorAgentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface CursorAgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
}

interface CursorAgentConversation {
  id: string;
  messages: CursorAgentMessage[];
  created_at: number;
  updated_at: number;
}

let cursorApiKey: string | null = null;

const API_KEY_FILE = "cursor_api_key.enc";

function getEncryptedFilePath() {
  return path.join(
    process.env.APPDATA ||
      (process.platform == "darwin"
        ? process.env.HOME + "/Library/Preferences"
        : process.env.HOME + "/.local/share"),
    API_KEY_FILE
  );
}

export function initializeCursorAgent(apiKey: string) {
  cursorApiKey = apiKey;
}

export async function saveCursorApiKey(apiKey: string) {
  try {
    const encryptedKey = safeStorage.encryptString(apiKey);
    fs.writeFileSync(getEncryptedFilePath(), encryptedKey);
    initializeCursorAgent(apiKey);
    return true;
  } catch (error) {
    console.error("Error saving Cursor API key:", error);
    return false;
  }
}

export async function getCursorApiKey() {
  try {
    const encryptedKey = fs.readFileSync(getEncryptedFilePath());
    return safeStorage.decryptString(encryptedKey);
  } catch (error) {
    console.error("Error retrieving Cursor API key:", error);
    return null;
  }
}

export async function deleteCursorApiKey() {
  try {
    fs.unlinkSync(getEncryptedFilePath());
    cursorApiKey = null;
    return true;
  } catch (error) {
    console.error("Error deleting Cursor API key:", error);
    return false;
  }
}

async function ensureApiKey() {
  if (!cursorApiKey) {
    const apiKey = await getCursorApiKey();
    if (!apiKey) {
      throw new Error("API key not set. Please set your Cursor API key.");
    }
    initializeCursorAgent(apiKey);
  }
}

async function makeCursorApiRequest(endpoint: string, options: RequestInit = {}) {
  await ensureApiKey();
  
  const url = `${CURSOR_API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${cursorApiKey}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Cursor API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Cursor API request error:", error);
    throw error;
  }
}

export async function getCursorAgentInfo(): Promise<CursorAgentResponse> {
  try {
    const response = await makeCursorApiRequest(`/agents/${CURSOR_AGENT_ID}`);
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function createCursorAgentConversation(): Promise<CursorAgentResponse> {
  try {
    const response = await makeCursorApiRequest(`/agents/${CURSOR_AGENT_ID}/conversations`, {
      method: "POST",
      body: JSON.stringify({
        agent_id: CURSOR_AGENT_ID,
        created_at: Date.now(),
      }),
    });
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendMessageToCursorAgent(
  conversationId: string,
  message: string
): Promise<CursorAgentResponse> {
  try {
    const response = await makeCursorApiRequest(`/agents/${CURSOR_AGENT_ID}/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        role: "user",
        content: message,
        timestamp: Date.now(),
      }),
    });
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getCursorAgentMessages(
  conversationId: string
): Promise<CursorAgentResponse> {
  try {
    const response = await makeCursorApiRequest(`/agents/${CURSOR_AGENT_ID}/conversations/${conversationId}/messages`);
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function saveCursorConversation(
  store: any,
  conversationId: string
) {
  try {
    store.set("cursor_conversation", { conversationId });
    console.log("Cursor conversation saved successfully:", { conversationId });
  } catch (error) {
    console.error("Error saving Cursor conversation:", error);
    throw error;
  }
}

export async function getCursorConversation(store: any) {
  try {
    const conversation = store.get("cursor_conversation");
    if (conversation) {
      console.log("Cursor conversation retrieved successfully");
      return conversation;
    } else {
      console.log("No saved Cursor conversation found");
      return null;
    }
  } catch (error) {
    console.error("Error getting Cursor conversation:", error);
    throw error;
  }
}

export async function clearCursorConversation(store: any) {
  try {
    store.delete("cursor_conversation");
    console.log("Cursor conversation cleared successfully");
  } catch (error) {
    console.error("Error clearing Cursor conversation:", error);
    throw error;
  }
}

// Mock implementation for development/testing
export async function mockCursorAgentResponse(message: string): Promise<CursorAgentResponse> {
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    data: {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: `This is a mock response to: "${message}". In a real implementation, this would be processed by the Cursor agent with ID ${CURSOR_AGENT_ID}.`,
      timestamp: Date.now(),
    },
  };
}