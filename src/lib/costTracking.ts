import { prisma } from "@/lib/prisma";
import { ApiService, ApiOperation, Prisma } from "@prisma/client";
import {
  calculateChatCompletionCost,
  calculateEmbeddingCost,
  calculatePineconeCost,
} from "@/lib/pricing";

/**
 * Options for logging API usage
 */
export interface LogApiUsageOptions {
  userId?: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log OpenAI chat completion usage
 */
export async function logChatCompletion(
  model: string,
  inputTokens: number,
  outputTokens: number,
  options: LogApiUsageOptions = {}
): Promise<void> {
  try {
    const cost = calculateChatCompletionCost(model, inputTokens, outputTokens);
    const totalTokens = inputTokens + outputTokens;

    await prisma.apiUsage.create({
      data: {
        service: ApiService.OPENAI,
        operation: ApiOperation.CHAT_COMPLETION,
        model,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost: cost,
        userId: options.userId ?? null,
        conversationId: options.conversationId ?? null,
        ...(options.metadata && {
          metadata: options.metadata as Prisma.InputJsonValue,
        }),
      },
    });
  } catch (error) {
    // Log error but don't throw - cost tracking should not break the main flow
    console.error("❌ Failed to log chat completion usage:", error);
  }
}

/**
 * Log OpenAI embedding usage
 */
export async function logEmbedding(
  model: string,
  tokens: number,
  options: LogApiUsageOptions = {}
): Promise<void> {
  try {
    const cost = calculateEmbeddingCost(model, tokens);

    await prisma.apiUsage.create({
      data: {
        service: ApiService.OPENAI,
        operation: ApiOperation.EMBEDDING,
        model,
        inputTokens: tokens, // Embeddings only have input tokens
        totalTokens: tokens,
        estimatedCost: cost,
        userId: options.userId ?? null,
        conversationId: options.conversationId ?? null,
        ...(options.metadata && {
          metadata: options.metadata as Prisma.InputJsonValue,
        }),
      },
    });
  } catch (error) {
    // Log error but don't throw - cost tracking should not break the main flow
    console.error("Failed to log embedding usage:", error);
  }
}

/**
 * Log Pinecone query operation
 */
export async function logPineconeQuery(
  options: LogApiUsageOptions = {}
): Promise<void> {
  try {
    const cost = calculatePineconeCost("query");

    await prisma.apiUsage.create({
      data: {
        service: ApiService.PINECONE,
        operation: ApiOperation.QUERY,
        estimatedCost: cost,
        userId: options.userId ?? null,
        conversationId: options.conversationId ?? null,
        ...(options.metadata && {
          metadata: options.metadata as Prisma.InputJsonValue,
        }),
      },
    });
  } catch (error) {
    // Log error but don't throw - cost tracking should not break the main flow
    console.error("Failed to log Pinecone query usage:", error);
  }
}

/**
 * Log Pinecone upsert operation
 */
export async function logPineconeUpsert(
  options: LogApiUsageOptions = {}
): Promise<void> {
  try {
    const cost = calculatePineconeCost("upsert");

    await prisma.apiUsage.create({
      data: {
        service: ApiService.PINECONE,
        operation: ApiOperation.UPSERT,
        estimatedCost: cost,
        userId: options.userId ?? null,
        conversationId: options.conversationId ?? null,
        ...(options.metadata && {
          metadata: options.metadata as Prisma.InputJsonValue,
        }),
      },
    });
  } catch (error) {
    // Log error but don't throw - cost tracking should not break the main flow
    console.error("Failed to log Pinecone upsert usage:", error);
  }
}

/**
 * Get total cost for a user within a date range
 */
export async function getUserCost(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    const where: {
      userId: string;
      timestamp?: { gte?: Date; lte?: Date };
    } = {
      userId,
    };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = startDate;
      }
      if (endDate) {
        where.timestamp.lte = endDate;
      }
    }

    const result = await prisma.apiUsage.aggregate({
      where,
      _sum: {
        estimatedCost: true,
      },
    });

    return result._sum.estimatedCost ?? 0;
  } catch (error) {
    console.error("Failed to get user cost:", error);
    return 0;
  }
}

/**
 * Get daily cost for a user
 */
export async function getUserDailyCost(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return getUserCost(userId, startOfDay, endOfDay);
}

/**
 * Get monthly cost for a user
 */
export async function getUserMonthlyCost(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  return getUserCost(userId, startOfMonth, endOfMonth);
}

/**
 * Get cost statistics for a user
 */
export async function getUserCostStats(userId: string): Promise<{
  daily: number;
  monthly: number;
  total: number;
  breakdown: {
    byService: Record<string, number>;
    byOperation: Record<string, number>;
  };
}> {
  try {
    const [daily, monthly, total, serviceBreakdown, operationBreakdown] =
      await Promise.all([
        getUserDailyCost(userId),
        getUserMonthlyCost(userId),
        getUserCost(userId),
        prisma.apiUsage.groupBy({
          by: ["service"],
          where: { userId },
          _sum: { estimatedCost: true },
        }),
        prisma.apiUsage.groupBy({
          by: ["operation"],
          where: { userId },
          _sum: { estimatedCost: true },
        }),
      ]);

    const byService: Record<string, number> = {};
    serviceBreakdown.forEach((item) => {
      byService[item.service] = item._sum.estimatedCost ?? 0;
    });

    const byOperation: Record<string, number> = {};
    operationBreakdown.forEach((item) => {
      byOperation[item.operation] = item._sum.estimatedCost ?? 0;
    });

    return {
      daily,
      monthly,
      total,
      breakdown: {
        byService,
        byOperation,
      },
    };
  } catch (error) {
    console.error("Failed to get user cost stats:", error);
    return {
      daily: 0,
      monthly: 0,
      total: 0,
      breakdown: {
        byService: {},
        byOperation: {},
      },
    };
  }
}
