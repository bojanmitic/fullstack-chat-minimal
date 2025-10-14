"use client";

import { MessageProps } from "@/types";

// Props interface moved above component for better readability
interface MessageComponentProps {
  message: MessageProps["message"];
}

export const Message = ({ message }: MessageComponentProps) => {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-700 text-gray-100"
        }`}
      >
        <div className="text-sm font-medium mb-1">
          {isUser ? "You" : "Assistant"}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className="text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
