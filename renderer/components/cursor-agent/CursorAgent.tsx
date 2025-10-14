"use client";

import { useState, useEffect } from "react";
import { useToast } from "components/ui/use-toast";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Badge } from "components/ui/badge";
import { Separator } from "components/ui/separator";
import { ScrollArea } from "components/ui/scroll-area";
import { Loader2, Send, Settings, Bot, User, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import { Label } from "components/ui/label";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface CursorAgentProps {
  className?: string;
}

export default function CursorAgent({ className }: CursorAgentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [agentInfo, setAgentInfo] = useState<any>(null);

  const { toast } = useToast();

  useEffect(() => {
    initializeAgent();
  }, []);

  const initializeAgent = async () => {
    try {
      // Check if API key exists
      const existingApiKey = await window.sorobanApi.cursor.getApiKey();
      if (existingApiKey) {
        setApiKey(existingApiKey);
      }

      // Get agent info
      const info = await window.sorobanApi.cursor.getAgentInfo();
      if (info.success) {
        setAgentInfo(info.data);
      }

      // Try to get existing conversation
      const conversation = await window.sorobanApi.cursor.getConversation();
      if (conversation && conversation.conversationId) {
        setConversationId(conversation.conversationId);
        // Load messages for existing conversation
        await loadMessages(conversation.conversationId);
      }
    } catch (error) {
      console.error("Error initializing agent:", error);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const response = await window.sorobanApi.cursor.getMessages(convId);
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleApiKeySave = async () => {
    if (!tempApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await window.sorobanApi.cursor.saveApiKey(tempApiKey);
      if (success) {
        setApiKey(tempApiKey);
        setTempApiKey("");
        setIsSettingsOpen(false);
        toast({
          title: "Success",
          description: "API key saved successfully",
        });
      } else {
        throw new Error("Failed to save API key");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  const handleApiKeyDelete = async () => {
    try {
      const success = await window.sorobanApi.cursor.deleteApiKey();
      if (success) {
        setApiKey(null);
        setTempApiKey("");
        toast({
          title: "Success",
          description: "API key deleted successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: inputMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // If no conversation exists, create one
      if (!conversationId) {
        const convResponse = await window.sorobanApi.cursor.createConversation();
        if (convResponse.success && convResponse.data) {
          const newConvId = convResponse.data.id || convResponse.data.conversationId;
          setConversationId(newConvId);
          await window.sorobanApi.cursor.saveConversation(newConvId);
        }
      }

      // Send message to agent
      if (conversationId) {
        const response = await window.sorobanApi.cursor.sendMessage(conversationId, inputMessage);
        
        if (response.success && response.data) {
          const assistantMessage: Message = {
            id: `msg_${Date.now() + 1}`,
            role: "assistant",
            content: response.data.content || response.data.message || "No response received",
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          // Fallback to mock response for development
          const mockResponse = await window.sorobanApi.cursor.mockResponse(inputMessage);
          if (mockResponse.success && mockResponse.data) {
            const assistantMessage: Message = {
              id: `msg_${Date.now() + 1}`,
              role: "assistant",
              content: mockResponse.data.content,
              timestamp: Date.now(),
            };
            setMessages(prev => [...prev, assistantMessage]);
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message to agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearConversation = async () => {
    try {
      await window.sorobanApi.cursor.clearConversation();
      setMessages([]);
      setConversationId(null);
      toast({
        title: "Success",
        description: "Conversation cleared",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear conversation",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              Cursor Agent Setup
            </CardTitle>
            <CardDescription>
              Configure your Cursor API key to start using the agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Cursor API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your Cursor API key"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
              />
            </div>
            <Button onClick={handleApiKeySave} className="w-full">
              Save API Key
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Cursor Agent</h2>
          {agentInfo && (
            <Badge variant="secondary">
              {agentInfo.name || "Agent bc-155d5aa3-d043-46af-bb82-fc706038f7fc"}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agent Settings</DialogTitle>
                <DialogDescription>
                  Manage your Cursor API key and agent configuration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-api-key">API Key</Label>
                  <Input
                    id="settings-api-key"
                    type="password"
                    placeholder="Enter new API key"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleApiKeySave} size="sm">
                    Update Key
                  </Button>
                  <Button onClick={handleApiKeyDelete} variant="destructive" size="sm">
                    Delete Key
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleClearConversation}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation with the Cursor agent</p>
              <p className="text-sm">Ask questions about Soroban development, Stellar, or get help with your code.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === "assistant" && (
                      <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    {message.role === "user" && (
                      <User className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTimestamp(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Agent is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask the Cursor agent anything about Soroban development..."
            className="flex-1 min-h-[60px] max-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}