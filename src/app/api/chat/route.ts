import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { templateEngine } from "@/lib/templateEngine";
import { getTemplateById } from "@/lib/templates";
import { ChatRequest, ChatResponse } from "@/types";
import { storeMessageEmbedding, querySimilarMessages } from "@/lib/pinecone";

// Lazy initialization - only create client when needed (not during build)
const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
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

      if (userMessageEmbedding) {
        // Query Pinecone for similar past messages (RAG)
        const similarMessagesResults = await querySimilarMessages(
          userMessageEmbedding,
          {
            topK: 5, // Get top 5 similar messages
            minScore: 0.7, // Only include messages with similarity score >= 0.7
          }
        );

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

      // Store both messages in Pinecone
      if (userEmbedding) {
        await storeMessageEmbedding(userMessageId, userEmbedding, {
          content: message,
          role: "user",
          timestamp,
          messageId: userMessageId,
        });
      }

      if (assistantEmbedding) {
        await storeMessageEmbedding(assistantMessageId, assistantEmbedding, {
          content: reply,
          role: "assistant",
          timestamp,
          messageId: assistantMessageId,
        });
      }
    } catch {
      // If Pinecone storage fails, continue - chat response is still returned
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
