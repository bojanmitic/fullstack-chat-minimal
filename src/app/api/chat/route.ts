import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { templateEngine } from "@/lib/templateEngine";
import { getTemplateById } from "@/lib/templates";
import { ChatRequest, ChatResponse } from "@/types";
import { storeMessageEmbedding, querySimilarMessages } from "@/lib/pinecone";
import {
  logChatCompletion,
  logEmbedding,
  logPineconeQuery,
  logPineconeUpsert,
} from "@/lib/costTracking";
import { checkUserLimits, updateUserCostLimits } from "@/lib/limitChecker";
import {
  calculateChatCompletionCost,
  calculateEmbeddingCost,
  calculatePineconeCost,
} from "@/lib/pricing";

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
const getOpenAIClient = (): OpenAI => {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey =
    process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment variables");
  }

  openaiClient = new OpenAI({
    apiKey: apiKey,
  });

  return openaiClient;
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get user session for cost tracking
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body: ChatRequest = await request.json();
    const {
      message,
      templateId,
      templateVariables = {},
      conversationHistory = [],
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    // Estimate cost for this request (rough estimate before actual API calls)
    // We'll estimate: 1 embedding (~100 tokens), 1 chat completion (~500 input + 200 output tokens),
    // 2 storage embeddings (~200 tokens), 1 Pinecone query, 2 Pinecone upserts
    const estimatedEmbeddingTokens = 300; // Total for all embeddings
    const estimatedInputTokens = 500;
    const estimatedOutputTokens = 200;
    const estimatedCost =
      calculateEmbeddingCost(
        "text-embedding-3-small",
        estimatedEmbeddingTokens
      ) +
      calculateChatCompletionCost(
        "gpt-3.5-turbo",
        estimatedInputTokens,
        estimatedOutputTokens
      ) +
      calculatePineconeCost("query") +
      calculatePineconeCost("upsert") * 2;

    // Check user limits before proceeding (only for authenticated users)
    if (userId) {
      const limitCheck = await checkUserLimits(userId, estimatedCost);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: limitCheck.reason || "Daily or monthly limit exceeded",
            limitExceeded: true,
            dailyUsage: limitCheck.dailyUsage,
            dailyLimit: limitCheck.dailyLimit,
            monthlyUsage: limitCheck.monthlyUsage,
            monthlyLimit: limitCheck.monthlyLimit,
          },
          { status: 429 } // 429 Too Many Requests
        );
      }
    }

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Add system message from template if provided
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        try {
          const templateResult = templateEngine.render(
            template,
            templateVariables
          );
          messages.push({ role: "system", content: templateResult.content });
        } catch (error) {
          return NextResponse.json(
            {
              error: `Template error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Template not found: ${templateId}` },
          { status: 404 }
        );
      }
    } else {
      // Default system message
      messages.push({
        role: "system",
        content: "You are a helpful assistant.",
      });
    }

    // Generate embedding for user message to query similar past messages
    let similarMessages: Array<{
      content: string;
      role: "user" | "assistant";
      score: number;
    }> = [];

    try {
      // Generate embedding for the user's message
      const openai = getOpenAIClient();
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: message,
      });

      const userMessageEmbedding = embeddingResponse.data[0]?.embedding;
      const embeddingUsage = embeddingResponse.usage;

      // Log embedding usage
      if (embeddingUsage?.total_tokens && userId) {
        await logEmbedding(
          "text-embedding-3-small",
          embeddingUsage.total_tokens,
          { userId }
        );
      }

      if (userMessageEmbedding) {
        // Query Pinecone for similar past messages (RAG)
        const similarMessagesResults = await querySimilarMessages(
          userMessageEmbedding,
          {
            topK: 5, // Get top 5 similar messages
            minScore: 0.7, // Only include messages with similarity score >= 0.7
          }
        );

        // Log Pinecone query
        if (userId) {
          await logPineconeQuery({ userId });
        }

        // Format similar messages for context
        similarMessages = similarMessagesResults.map((match) => ({
          content: match.content,
          role: match.role,
          score: match.score,
        }));
      }
    } catch {
      // If Pinecone fails, continue without RAG context - chat will still work
    }

    // Build context from similar messages if available
    if (similarMessages.length > 0) {
      // Add RAG context as a system message for better formatting
      const ragContextMessage =
        "Relevant context from past conversations that might be helpful:\n" +
        similarMessages
          .map((msg, idx) => `${idx + 1}. [${msg.role}]: ${msg.content}`)
          .join("\n");

      messages.push({
        role: "system",
        content: ragContextMessage,
      });
    }

    // Add conversation history
    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current user message
    messages.push({ role: "user", content: message });

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      throw new Error("No reply from model");
    }

    // Log chat completion usage
    if (completion.usage && userId) {
      await logChatCompletion(
        "gpt-3.5-turbo",
        completion.usage.prompt_tokens || 0,
        completion.usage.completion_tokens || 0,
        { userId }
      );
    }

    // Store messages in Pinecone for future RAG (non-blocking)
    try {
      const timestamp = new Date().toISOString();
      const userMessageId = `user-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 11)}`;
      const assistantMessageId = `assistant-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 11)}`;

      // Generate embeddings for both messages
      const openai = getOpenAIClient();
      const [userEmbeddingResponse, assistantEmbeddingResponse] =
        await Promise.all([
          openai.embeddings.create({
            model: "text-embedding-3-small",
            input: message,
          }),
          openai.embeddings.create({
            model: "text-embedding-3-small",
            input: reply,
          }),
        ]);

      const userEmbedding = userEmbeddingResponse.data[0]?.embedding;
      const assistantEmbedding = assistantEmbeddingResponse.data[0]?.embedding;

      // Log storage embeddings
      if (userId) {
        const userEmbeddingUsage = userEmbeddingResponse.usage;
        const assistantEmbeddingUsage = assistantEmbeddingResponse.usage;
        const totalEmbeddingTokens =
          (userEmbeddingUsage?.total_tokens || 0) +
          (assistantEmbeddingUsage?.total_tokens || 0);

        if (totalEmbeddingTokens > 0) {
          // Log as two separate embedding calls
          if (userEmbeddingUsage?.total_tokens) {
            await logEmbedding(
              "text-embedding-3-small",
              userEmbeddingUsage.total_tokens,
              { userId }
            );
          }
          if (assistantEmbeddingUsage?.total_tokens) {
            await logEmbedding(
              "text-embedding-3-small",
              assistantEmbeddingUsage.total_tokens,
              { userId }
            );
          }
        }
      }

      // Store both messages in Pinecone
      if (userEmbedding) {
        await storeMessageEmbedding(userMessageId, userEmbedding, {
          content: message,
          role: "user",
          timestamp,
          messageId: userMessageId,
        });

        // Log Pinecone upsert
        if (userId) {
          await logPineconeUpsert({ userId });
        }
      }

      if (assistantEmbedding) {
        await storeMessageEmbedding(assistantMessageId, assistantEmbedding, {
          content: reply,
          role: "assistant",
          timestamp,
          messageId: assistantMessageId,
        });

        // Log Pinecone upsert
        if (userId) {
          await logPineconeUpsert({ userId });
        }
      }
    } catch {
      // If Pinecone storage fails, continue - chat response is still returned
    }

    // Update user cost limits after all operations (non-blocking)
    if (userId && completion.usage) {
      // Update limits asynchronously (don't wait)
      // This recalculates from database, so no need to pass cost
      updateUserCostLimits(userId).catch((error) => {
        console.error("Failed to update user cost limits:", error);
      });
    }

    const processingTime = Date.now() - startTime;
    const response: ChatResponse = {
      response: reply,
      templateId,
      metadata: {
        model: "gpt-3.5-turbo",
        tokensUsed: completion.usage?.total_tokens,
        processingTime,
      },
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Error communicating with OpenAI API." },
      { status: 500 }
    );
  }
}
