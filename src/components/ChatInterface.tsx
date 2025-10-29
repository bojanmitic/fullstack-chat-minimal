"use client";

import { useState } from "react";
import { ChatInterfaceProps } from "@/types";
import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { TemplateSelector } from "./TemplateSelector";

// Props interface moved above component for better readability
interface ChatInterfaceComponentProps {
  className?: ChatInterfaceProps["className"];
}

export const ChatInterface = ({ className = "" }: ChatInterfaceComponentProps) => {
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearMessages, 
    selectedTemplateId, 
    updateTemplate 
  } = useChat();
  
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className={`h-screen bg-gray-900 flex flex-col overflow-hidden ${className}`}>
      {/* Full-width Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">Chat App</h1>
          {selectedTemplateId && (
            <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded">
              Template Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            {showTemplates ? "Hide" : "Show"} Templates
          </button>
          <button
            onClick={clearMessages}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            disabled={messages.length === 0}
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Template Selector */}
      {showTemplates && (
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex-shrink-0">
          <TemplateSelector
            key={selectedTemplateId || "no-template"}
            onTemplateSelect={(templateId, variables) => updateTemplate(templateId, variables)}
            selectedTemplateId={selectedTemplateId}
            className="max-w-4xl mx-auto"
          />
        </div>
      )}

      {/* Centered Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 pb-0 overflow-hidden">
        <div className="w-full max-w-4xl h-full bg-gray-900 rounded-xl overflow-hidden flex flex-col">
          {/* Error message */}
          {error && (
            <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mx-4 mt-2 flex-shrink-0">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-300">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages area */}
          <MessageList messages={messages} isLoading={isLoading} />
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="flex justify-center p-4 pt-0 flex-shrink-0">
        <div className="w-full max-w-4xl">
          <ChatInput 
            onSendMessage={sendMessage} 
            isLoading={isLoading}
            disabled={!!error}
          />
        </div>
      </div>
    </div>
  );
};
