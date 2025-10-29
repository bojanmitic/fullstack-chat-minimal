"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { chatApi } from "@/lib/api";
import { Message, UseChatReturn } from "@/types";

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >();
  const [templateVariables, setTemplateVariables] = useState<
    Record<string, string | number | boolean>
  >({});
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      message,
      templateId,
      variables,
    }: {
      message: string;
      templateId?: string;
      variables?: Record<string, string | number | boolean>;
    }) => {
      // Convert messages to conversation history format
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      return chatApi.sendMessage(
        message,
        templateId,
        variables,
        conversationHistory
      );
    },
    onSuccess: (data: { response: string }, variables) => {
      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content: variables.message,
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

      await sendMessageMutation.mutateAsync({
        message: content,
        templateId: selectedTemplateId,
        variables: templateVariables,
      });
    },
    [sendMessageMutation, selectedTemplateId, templateVariables]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    // Clear any cached queries if needed
    queryClient.clear();
  }, [queryClient]);

  const updateTemplate = useCallback(
    (
      templateId: string | undefined,
      variables: Record<string, string | number | boolean> = {}
    ) => {
      setSelectedTemplateId(templateId);
      setTemplateVariables(variables);
    },
    []
  );

  return {
    messages,
    isLoading: sendMessageMutation.isPending,
    error: sendMessageMutation.error?.message || null,
    sendMessage,
    clearMessages,
    selectedTemplateId,
    templateVariables,
    updateTemplate,
  };
};
