"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { chatApi } from "@/lib/api";
import { Message, UseChatReturn } from "@/types";

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (data: { response: string }, variables: string) => {
      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content: variables,
        role: "user",
        timestamp: new Date(),
      };

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim()) return;

      await sendMessageMutation.mutateAsync(content);
    },
    [sendMessageMutation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    // Clear any cached queries if needed
    queryClient.clear();
  }, [queryClient]);

  return {
    messages,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error?.message || null,
    sendMessage,
    clearMessages,
  };
};
