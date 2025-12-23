import { Pinecone } from "@pinecone-database/pinecone";

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;

/**
 * Check if Pinecone is configured
 */
export const isPineconeConfigured = (): boolean => {
  const hasApiKey = !!process.env.PINECONE_API_KEY;
  const hasIndexName = !!process.env.PINECONE_INDEX_NAME;
  return hasApiKey && hasIndexName;
};

/**
 * Get or create Pinecone client instance
 */
export const getPineconeClient = (): Pinecone => {
  if (pineconeClient) {
    return pineconeClient;
  }

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not set in environment variables");
  }

  pineconeClient = new Pinecone({
    apiKey: apiKey,
  });

  return pineconeClient;
};

/**
 * Get the Pinecone index
 */
export const getPineconeIndex = async () => {
  const indexName = process.env.PINECONE_INDEX_NAME;
  if (!indexName) {
    throw new Error("PINECONE_INDEX_NAME is not set in environment variables");
  }

  const client = getPineconeClient();
  const index = client.index(indexName);
  return index;
};

/**
 * Store a message embedding in Pinecone
 */
export const storeMessageEmbedding = async (
  id: string,
  embedding: number[],
  metadata: {
    content: string;
    role: "user" | "assistant";
    timestamp: string;
    messageId?: string;
  }
) => {
  // Return early if Pinecone is not configured
  if (!isPineconeConfigured()) {
    return;
  }

  try {
    const index = await getPineconeIndex();

    await index.upsert([
      {
        id: id,
        values: embedding,
        metadata: {
          content: metadata.content,
          role: metadata.role,
          timestamp: metadata.timestamp,
          messageId: metadata.messageId || id,
        },
      },
    ]);
  } catch (error) {
    // Re-throw with a user-friendly message
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to store message in search index";
    throw new Error(`Pinecone storage error: ${errorMessage}`);
  }
};

/**
 * Query Pinecone for similar messages
 */
export const querySimilarMessages = async (
  embedding: number[],
  options: {
    topK?: number;
    filter?: Record<string, unknown>;
    minScore?: number;
  } = {}
) => {
  // Return empty array if Pinecone is not configured
  if (!isPineconeConfigured()) {
    return [];
  }

  try {
    const index = await getPineconeIndex();
    const topK = options.topK || 5; // Default to 5 similar messages

    const queryResponse = await index.query({
      vector: embedding,
      topK: topK,
      includeMetadata: true,
      filter: options.filter,
    });

    // Filter by minimum score if provided
    let matches = queryResponse.matches || [];
    if (options.minScore !== undefined) {
      matches = matches.filter(
        (match) => (match.score || 0) >= options.minScore!
      );
    }

    return matches.map((match) => ({
      id: match.id,
      score: match.score || 0,
      content: (match.metadata?.content as string) || "",
      role: (match.metadata?.role as "user" | "assistant") || "user",
      timestamp: (match.metadata?.timestamp as string) || "",
      messageId: (match.metadata?.messageId as string) || match.id,
    }));
  } catch (error) {
    // Re-throw with a user-friendly message
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to search similar messages";
    throw new Error(`Pinecone query error: ${errorMessage}`);
  }
};
