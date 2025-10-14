"use client";
import { useState, KeyboardEvent } from "react";
import { ChatInputProps } from "@/types";

// Props interface moved above component for better readability
interface ChatInputComponentProps {
  onSendMessage: ChatInputProps["onSendMessage"];
  isLoading: ChatInputProps["isLoading"];
  disabled?: ChatInputProps["disabled"];
}

export const ChatInput = ({ onSendMessage, isLoading, disabled = false }: ChatInputComponentProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading || disabled) return;
    
    const message = inputValue.trim();
    setInputValue(""); // Clear input immediately for better UX
    await onSendMessage(message);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-700 bg-gray-800 p-4">
      <div className="flex space-x-2">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          className="flex-1 resize-none rounded-lg border border-gray-600 bg-gray-700 text-white placeholder-gray-400 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={1}
          disabled={disabled}
          style={{
            minHeight: "40px",
            maxHeight: "120px",
            height: "auto",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!inputValue.trim() || isLoading || disabled}
          className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 text-white font-medium shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 hover:shadow-xl disabled:hover:scale-100 disabled:hover:shadow-lg"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300"></div>
          
          {/* Button content */}
          <div className="relative flex items-center justify-center space-x-2">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <svg 
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                  />
                </svg>
                <span>Send</span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
