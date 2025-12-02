// Template variable types
export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

// Template definition
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  content: string;
  variables: TemplateVariable[];
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

// Template categories
export type TemplateCategory =
  | "role"
  | "task"
  | "format"
  | "context"
  | "custom";

// Template variable definition
export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array";
  description: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: string[]; // For enum-like variables
}

// Template execution result
export interface TemplateResult {
  content: string;
  variables: TemplateVariables;
  templateId: string;
}

// Template engine interface
export interface TemplateEngine {
  render(
    template: PromptTemplate,
    variables: TemplateVariables
  ): TemplateResult;
  validate(template: PromptTemplate, variables: TemplateVariables): boolean;
  getMissingVariables(
    template: PromptTemplate,
    variables: TemplateVariables
  ): string[];
}

// Chat request with template support
export interface ChatRequestWithTemplate {
  message: string;
  templateId?: string;
  templateVariables?: TemplateVariables;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

// Template selection UI props
export interface TemplateSelectorProps {
  onTemplateSelect: (templateId: string) => void;
  selectedTemplateId?: string;
  className?: string;
}

// Template editor props
export interface TemplateEditorProps {
  template?: PromptTemplate;
  onSave: (template: PromptTemplate) => void;
  onCancel: () => void;
  className?: string;
}
