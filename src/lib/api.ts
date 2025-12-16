import { ChatRequest, ChatResponse } from "@/types";

const API_BASE_URL = "/api";

export interface UsageStats {
  daily: {
    spent: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
  monthly: {
    spent: number;
    limit: number;
    remaining: number;
    percentage: number;
  };
}

export const chatApi = {
  sendMessage: async (
    message: string,
    templateId?: string,
    templateVariables?: Record<string, string | number | boolean>,
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<ChatResponse> => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        templateId,
        templateVariables,
        conversationHistory,
      } as ChatRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send message");
    }

    return response.json();
  },
};

export const usageApi = {
  getUsage: async (): Promise<UsageStats> => {
    const response = await fetch(`${API_BASE_URL}/usage`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get usage statistics");
    }

    return response.json();
  },
};
