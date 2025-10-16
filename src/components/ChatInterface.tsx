"use client";

import { ChatInterfaceProps } from "@/types";
import { useChat } from "@/hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

// Props interface moved above component for better readability
interface ChatInterfaceComponentProps {
  className?: ChatInterfaceProps["className"];
}

export const ChatInterface = ({ className = "" }: ChatInterfaceComponentProps) => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat();

  return (
    <div className={`h-screen bg-gray-900 flex flex-col overflow-hidden ${className}`}>
      {/* Full-width Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex justify-between items-center flex-shrink-0">
        <h1 className="text-xl font-semibold text-white">Chat App</h1>
        <button
          onClick={clearMessages}
          className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          disabled={messages.length === 0}
        >
          Clear Chat
        </button>
      </div>

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
