/**
 * Pricing constants and cost calculation utilities
 *
 * Pricing is in USD per token (for OpenAI) or per operation (for Pinecone)
 * Prices are based on OpenAI's pricing as of 2024
 * Update these values if pricing changes
 */

// OpenAI Chat Completion Models Pricing (per 1K tokens)
export const OPENAI_CHAT_PRICING = {
  "gpt-3.5-turbo": {
    input: 0.0015, // $0.0015 per 1K input tokens
    output: 0.002, // $0.002 per 1K output tokens
  },
  "gpt-4": {
    input: 0.03, // $0.03 per 1K input tokens
    output: 0.06, // $0.06 per 1K output tokens
  },
  "gpt-4-turbo": {
    input: 0.01, // $0.01 per 1K input tokens
    output: 0.03, // $0.03 per 1K output tokens
  },
  "gpt-4o": {
    input: 0.005, // $0.005 per 1K input tokens
    output: 0.015, // $0.015 per 1K output tokens
  },
} as const;

// OpenAI Embedding Models Pricing (per 1M tokens)
export const OPENAI_EMBEDDING_PRICING = {
  "text-embedding-3-small": 0.02, // $0.02 per 1M tokens
  "text-embedding-3-large": 0.13, // $0.13 per 1M tokens
  "text-embedding-ada-002": 0.1, // $0.1 per 1M tokens (legacy)
} as const;

// Pinecone Pricing (estimated per operation)
// Note: Pinecone pricing varies by plan and usage
// These are rough estimates - adjust based on your plan
export const PINECONE_PRICING = {
  query: 0.0001, // $0.0001 per query (estimate)
  upsert: 0.0001, // $0.0001 per upsert operation (estimate)
} as const;

/**
 * Calculate cost for OpenAI chat completion
 */
export function calculateChatCompletionCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing =
    OPENAI_CHAT_PRICING[model as keyof typeof OPENAI_CHAT_PRICING];

  if (!pricing) {
    // Default to gpt-3.5-turbo pricing if model not found
    console.warn(`Unknown chat model: ${model}, using gpt-3.5-turbo pricing`);
    const defaultPricing = OPENAI_CHAT_PRICING["gpt-3.5-turbo"];
    return (
      (inputTokens / 1000) * defaultPricing.input +
      (outputTokens / 1000) * defaultPricing.output
    );
  }

  return (
    (inputTokens / 1000) * pricing.input +
    (outputTokens / 1000) * pricing.output
  );
}

/**
 * Calculate cost for OpenAI embedding
 */
export function calculateEmbeddingCost(model: string, tokens: number): number {
  const pricePerMillion =
    OPENAI_EMBEDDING_PRICING[model as keyof typeof OPENAI_EMBEDDING_PRICING];

  if (pricePerMillion === undefined) {
    // Default to text-embedding-3-small pricing if model not found
    console.warn(
      `Unknown embedding model: ${model}, using text-embedding-3-small pricing`
    );
    const defaultPrice = OPENAI_EMBEDDING_PRICING["text-embedding-3-small"];
    return (tokens / 1_000_000) * defaultPrice;
  }

  return (tokens / 1_000_000) * pricePerMillion;
}

/**
 * Calculate cost for Pinecone operation
 */
export function calculatePineconeCost(operation: "query" | "upsert"): number {
  return PINECONE_PRICING[operation];
}

/**
 * Get pricing info for a specific model
 */
export function getModelPricing(model: string): {
  type: "chat" | "embedding" | "unknown";
  pricing?: {
    input?: number;
    output?: number;
    perMillion?: number;
  };
} {
  // Check if it's a chat model
  if (model in OPENAI_CHAT_PRICING) {
    const chatPricing =
      OPENAI_CHAT_PRICING[model as keyof typeof OPENAI_CHAT_PRICING];
    return {
      type: "chat",
      pricing: {
        input: chatPricing.input,
        output: chatPricing.output,
      },
    };
  }

  // Check if it's an embedding model
  if (model in OPENAI_EMBEDDING_PRICING) {
    const embeddingPrice =
      OPENAI_EMBEDDING_PRICING[model as keyof typeof OPENAI_EMBEDDING_PRICING];
    return {
      type: "embedding",
      pricing: {
        perMillion: embeddingPrice,
      },
    };
  }

  return { type: "unknown" };
}

/**
 * Format cost as a readable string
 */
export function formatCost(cost: number): string {
  if (cost < 0.0001) {
    return `$${cost.toFixed(6)}`;
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  if (cost < 1) {
    return `$${cost.toFixed(2)}`;
  }
  return `$${cost.toFixed(2)}`;
}
