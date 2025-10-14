import { ChatRequest, ChatResponse } from "@/types";

const API_BASE_URL = "/api";

export const chatApi = {
  sendMessage: async (message: string): Promise<ChatResponse> => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message } as ChatRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send message");
    }

    return response.json();
  },
};
