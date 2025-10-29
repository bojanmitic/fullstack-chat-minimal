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
  templateId?: string;
  templateVariables?: Record<string, string | number | boolean>;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface ChatResponse {
  response: string;
  templateId?: string;
  metadata?: {
    model: string;
    tokensUsed?: number;
    processingTime?: number;
  };
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
  selectedTemplateId?: string;
  templateVariables: Record<string, string | number | boolean>;
  updateTemplate: (
    templateId: string | undefined,
    variables?: Record<string, string | number | boolean>
  ) => void;
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
