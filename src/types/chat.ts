// Core message types
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

// Chat state management
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// API request/response types
export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
}

export interface ChatError {
  error: string;
}

// Chat hook return type
export interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

// Component props types
export interface ChatInterfaceProps {
  className?: string;
}

export interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export interface MessageProps {
  message: Message;
}

export interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}
