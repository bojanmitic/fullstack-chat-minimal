import { PromptTemplate, TemplateCategory } from "@/types/templates";

/**
 * Predefined prompt templates library
 */
export const PREDEFINED_TEMPLATES: PromptTemplate[] = [
  // Role-based templates
  {
    id: "helpful-assistant",
    name: "Helpful Assistant",
    description: "A friendly and helpful AI assistant",
    category: "role",
    content:
      "You are a helpful, friendly, and knowledgeable AI assistant. You provide accurate information and helpful responses to user questions.",
    variables: [],
    version: "1.0.0",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    description: "An expert code reviewer focused on best practices",
    category: "role",
    content: `You are an expert code reviewer with {{experience_years}} years of experience in {{programming_language}}.

Your role is to:
- Review code for bugs, performance issues, and best practices
- Suggest improvements and optimizations
- Explain your reasoning clearly
- Be constructive and educational

Please review the following code and provide detailed feedback:`,
    variables: [
      {
        name: "experience_years",
        type: "number",
        description: "Years of programming experience",
        required: true,
        defaultValue: 10,
      },
      {
        name: "programming_language",
        type: "string",
        description: "Primary programming language",
        required: true,
        defaultValue: "JavaScript",
        options: [
          "JavaScript",
          "TypeScript",
          "Python",
          "Java",
          "C++",
          "Go",
          "Rust",
        ],
      },
    ],
    version: "1.0.0",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "creative-writer",
    name: "Creative Writer",
    description: "A creative writing assistant for various genres",
    category: "role",
    content: `You are a creative writing assistant specializing in {{genre}} writing.

Your writing style is:
- Tone: {{tone}}
- Target audience: {{audience}}
- Writing level: {{writing_level}}

Please help me with the following writing task:`,
    variables: [
      {
        name: "genre",
        type: "string",
        description: "Writing genre",
        required: true,
        defaultValue: "fiction",
        options: [
          "fiction",
          "non-fiction",
          "poetry",
          "screenplay",
          "technical writing",
        ],
      },
      {
        name: "tone",
        type: "string",
        description: "Writing tone",
        required: true,
        defaultValue: "professional",
        options: ["professional", "casual", "formal", "humorous", "dramatic"],
      },
      {
        name: "audience",
        type: "string",
        description: "Target audience",
        required: true,
        defaultValue: "general",
        options: [
          "general",
          "children",
          "teenagers",
          "adults",
          "professionals",
        ],
      },
      {
        name: "writing_level",
        type: "string",
        description: "Writing complexity level",
        required: true,
        defaultValue: "intermediate",
        options: ["beginner", "intermediate", "advanced"],
      },
    ],
    version: "1.0.0",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },

  // Task-based templates
  {
    id: "data-extraction",
    name: "Data Extraction",
    description: "Extract structured data from unstructured text",
    category: "task",
    content: `You are a data extraction specialist. Extract the following information from the provided text:

Required fields:
{{required_fields}}

Optional fields:
{{optional_fields}}

Output format: {{output_format}}

Please extract the data and format it as requested:`,
    variables: [
      {
        name: "required_fields",
        type: "string",
        description: "Comma-separated list of required fields to extract",
        required: true,
        defaultValue: "name, email, phone",
      },
      {
        name: "optional_fields",
        type: "string",
        description: "Comma-separated list of optional fields to extract",
        required: false,
        defaultValue: "address, company",
      },
      {
        name: "output_format",
        type: "string",
        description: "Desired output format",
        required: true,
        defaultValue: "JSON",
        options: ["JSON", "CSV", "XML", "YAML"],
      },
    ],
    version: "1.0.0",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "summarization",
    name: "Text Summarization",
    description: "Summarize long texts into concise summaries",
    category: "task",
    content: `You are a text summarization expert. Create a {{summary_type}} summary of the following text.

Summary requirements:
- Length: {{summary_length}}
- Focus: {{focus_area}}
- Include key points: {{include_key_points}}
- Include examples: {{include_examples}}

Please provide a well-structured summary:`,
    variables: [
      {
        name: "summary_type",
        type: "string",
        description: "Type of summary",
        required: true,
        defaultValue: "executive",
        options: ["executive", "detailed", "bullet-points", "paragraph"],
      },
      {
        name: "summary_length",
        type: "string",
        description: "Desired summary length",
        required: true,
        defaultValue: "medium",
        options: ["short", "medium", "long"],
      },
      {
        name: "focus_area",
        type: "string",
        description: "Main focus area",
        required: false,
        defaultValue: "all",
      },
      {
        name: "include_key_points",
        type: "boolean",
        description: "Include key points",
        required: true,
        defaultValue: true,
      },
      {
        name: "include_examples",
        type: "boolean",
        description: "Include examples",
        required: true,
        defaultValue: false,
      },
    ],
    version: "1.0.0",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },

  // Format-based templates
  {
    id: "markdown-formatter",
    name: "Markdown Formatter",
    description: "Format responses in clean Markdown",
    category: "format",
    content: `You are a Markdown formatting specialist. Format your response using clean, well-structured Markdown.

Formatting guidelines:
- Use proper headings (##, ###)
- Include code blocks with syntax highlighting
- Use lists and tables when appropriate
- Include emojis: {{include_emojis}}
- Add table of contents: {{add_toc}}

Please format your response accordingly:`,
    variables: [
      {
        name: "include_emojis",
        type: "boolean",
        description: "Include emojis in the response",
        required: true,
        defaultValue: true,
      },
      {
        name: "add_toc",
        type: "boolean",
        description: "Add table of contents",
        required: true,
        defaultValue: false,
      },
    ],
    version: "1.0.0",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "conversation-context",
    name: "Conversation Context",
    description: "Maintain context across conversation turns",
    category: "context",
    content: `You are continuing a conversation with the following context:

Previous conversation:
{{conversation_history}}

Current topic: {{current_topic}}
User's expertise level: {{user_expertise}}
Conversation goal: {{conversation_goal}}

Please respond appropriately to the user's message while maintaining context:`,
    variables: [
      {
        name: "conversation_history",
        type: "string",
        description: "Previous conversation messages",
        required: false,
        defaultValue: "",
      },
      {
        name: "current_topic",
        type: "string",
        description: "Current discussion topic",
        required: false,
        defaultValue: "general",
      },
      {
        name: "user_expertise",
        type: "string",
        description: "User's expertise level",
        required: true,
        defaultValue: "intermediate",
        options: ["beginner", "intermediate", "advanced", "expert"],
      },
      {
        name: "conversation_goal",
        type: "string",
        description: "Goal of the conversation",
        required: false,
        defaultValue: "information sharing",
      },
    ],
    version: "1.0.0",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: TemplateCategory
): PromptTemplate[] {
  return PREDEFINED_TEMPLATES.filter(
    (template) => template.category === category
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return PREDEFINED_TEMPLATES.find((template) => template.id === id);
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): TemplateCategory[] {
  return Array.from(
    new Set(PREDEFINED_TEMPLATES.map((template) => template.category))
  );
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): PromptTemplate[] {
  const lowercaseQuery = query.toLowerCase();
  return PREDEFINED_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery)
  );
}
