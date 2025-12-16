import { prisma } from "@/lib/prisma";
import { getUserDailyCost, getUserMonthlyCost } from "@/lib/costTracking";

/**
 * Result of a limit check
 */
export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  dailyUsage?: number;
  dailyLimit?: number;
  monthlyUsage?: number;
  monthlyLimit?: number;
}

/**
 * Get or create user cost limits with default values
 */
export async function getOrCreateUserLimits(userId: string): Promise<{
  id: string;
  userId: string;
  dailyLimit: number;
  monthlyLimit: number;
  currentDaily: number;
  currentMonthly: number;
  lastResetDaily: Date;
  lastResetMonthly: Date;
}> {
  // Safety check - ensure Prisma client is initialized
  if (!prisma || !("userCostLimit" in prisma)) {
    throw new Error(
      "Prisma client not properly initialized. Run 'npx prisma generate' inside the container."
    );
  }

  let userLimit = await prisma.userCostLimit.findUnique({
    where: { userId },
  });

  if (!userLimit) {
    // Create default limits for new user
    userLimit = await prisma.userCostLimit.create({
      data: {
        userId,
        dailyLimit: 0.045, // $0.045/day default (30 requests/day)
        monthlyLimit: 1.35, // $1.35/month default (30 × daily limit)
        currentDaily: 0.0,
        currentMonthly: 0.0,
      },
    });
  }

  return userLimit;
}

/**
 * Reset daily counter if needed (if it's a new day)
 */
async function resetDailyCounterIfNeeded(
  userLimit: Awaited<ReturnType<typeof getOrCreateUserLimits>>
): Promise<void> {
  const now = new Date();
  const lastReset = new Date(userLimit.lastResetDaily);

  // Check if it's a new day (compare dates, not times)
  const isNewDay =
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getDate() !== lastReset.getDate();

  if (isNewDay) {
    try {
      // Get actual daily cost from database
      const actualDailyCost = await getUserDailyCost(userLimit.userId);

      await prisma.userCostLimit.update({
        where: { userId: userLimit.userId },
        data: {
          currentDaily: actualDailyCost,
          lastResetDaily: now,
        },
      });
    } catch (error) {
      console.error("Failed to reset daily counter:", error);
      // Continue execution even if reset fails
    }
  }
}

/**
 * Reset monthly counter if needed (if it's a new month)
 */
async function resetMonthlyCounterIfNeeded(
  userLimit: Awaited<ReturnType<typeof getOrCreateUserLimits>>
): Promise<void> {
  const now = new Date();
  const lastReset = new Date(userLimit.lastResetMonthly);

  // Check if it's a new month
  const isNewMonth =
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth();

  if (isNewMonth) {
    try {
      // Get actual monthly cost from database
      const actualMonthlyCost = await getUserMonthlyCost(userLimit.userId);

      await prisma.userCostLimit.update({
        where: { userId: userLimit.userId },
        data: {
          currentMonthly: actualMonthlyCost,
          lastResetMonthly: now,
        },
      });
    } catch (error) {
      console.error("Failed to reset monthly counter:", error);
      // Continue execution even if reset fails
    }
  }
}

/**
 * Check if user can make a request based on their cost limits
 * This checks both daily and monthly limits
 */
export async function checkUserLimits(
  userId: string,
  estimatedCost?: number
): Promise<LimitCheckResult> {
  try {
    let userLimit = await getOrCreateUserLimits(userId);

    // Reset counters if needed
    await resetDailyCounterIfNeeded(userLimit);
    await resetMonthlyCounterIfNeeded(userLimit);

    // Refresh user limit after potential resets
    userLimit = await getOrCreateUserLimits(userId);

    // Get actual costs from database (more accurate than cached values)
    const actualDailyCost = await getUserDailyCost(userId);
    const actualMonthlyCost = await getUserMonthlyCost(userId);

    // Check if adding estimated cost would exceed limits
    const projectedDaily = estimatedCost
      ? actualDailyCost + estimatedCost
      : actualDailyCost;
    const projectedMonthly = estimatedCost
      ? actualMonthlyCost + estimatedCost
      : actualMonthlyCost;

    // Check daily limit
    if (projectedDaily > userLimit.dailyLimit) {
      return {
        allowed: false,
        reason: `Daily limit exceeded. Current: $${actualDailyCost.toFixed(
          2
        )}, Limit: $${userLimit.dailyLimit.toFixed(2)}`,
        dailyUsage: actualDailyCost,
        dailyLimit: userLimit.dailyLimit,
        monthlyUsage: actualMonthlyCost,
        monthlyLimit: userLimit.monthlyLimit,
      };
    }

    // Check monthly limit
    if (projectedMonthly > userLimit.monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly limit exceeded. Current: $${actualMonthlyCost.toFixed(
          2
        )}, Limit: $${userLimit.monthlyLimit.toFixed(2)}`,
        dailyUsage: actualDailyCost,
        dailyLimit: userLimit.dailyLimit,
        monthlyUsage: actualMonthlyCost,
        monthlyLimit: userLimit.monthlyLimit,
      };
    }

    return {
      allowed: true,
      dailyUsage: actualDailyCost,
      dailyLimit: userLimit.dailyLimit,
      monthlyUsage: actualMonthlyCost,
      monthlyLimit: userLimit.monthlyLimit,
    };
  } catch (error) {
    console.error("Failed to check user limits:", error);
    // On error, allow the request (fail open) but log the error
    return {
      allowed: true,
      reason: "Error checking limits, request allowed",
    };
  }
}

/**
 * Update user cost limits after a cost is incurred
 * This is called after logging API usage to keep counters in sync
 */
export async function updateUserCostLimits(
  userId: string
  // cost parameter removed - we calculate from DB for accuracy
): Promise<void> {
  try {
    const userLimit = await getOrCreateUserLimits(userId);

    // Reset counters if needed before updating
    await resetDailyCounterIfNeeded(userLimit);
    await resetMonthlyCounterIfNeeded(userLimit);

    // Get actual costs from database
    const actualDailyCost = await getUserDailyCost(userId);
    const actualMonthlyCost = await getUserMonthlyCost(userId);

    // Update the limits with actual costs (they should match, but use DB values for accuracy)
    await prisma.userCostLimit.update({
      where: { userId },
      data: {
        currentDaily: actualDailyCost,
        currentMonthly: actualMonthlyCost,
      },
    });
  } catch (error) {
    // Log error but don't throw - limit updates should not break the main flow
    console.error("Failed to update user cost limits:", error);
  }
}

/**
 * Set custom limits for a user
 */
export async function setUserLimits(
  userId: string,
  dailyLimit?: number,
  monthlyLimit?: number
): Promise<void> {
  try {
    // Verify user exists and has limits
    await getOrCreateUserLimits(userId);

    await prisma.userCostLimit.update({
      where: { userId },
      data: {
        ...(dailyLimit !== undefined && { dailyLimit }),
        ...(monthlyLimit !== undefined && { monthlyLimit }),
      },
    });
  } catch (error) {
    console.error("Failed to set user limits:", error);
    throw error;
  }
}

/**
 * Get current limit status for a user
 */
export async function getUserLimitStatus(userId: string): Promise<{
  dailyLimit: number;
  monthlyLimit: number;
  currentDaily: number;
  currentMonthly: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  dailyPercentage: number;
  monthlyPercentage: number;
}> {
  try {
    const userLimit = await getOrCreateUserLimits(userId);

    // Reset counters if needed (non-blocking)
    resetDailyCounterIfNeeded(userLimit).catch((error) => {
      console.error("Error resetting daily counter:", error);
    });
    resetMonthlyCounterIfNeeded(userLimit).catch((error) => {
      console.error("Error resetting monthly counter:", error);
    });

    // Get actual costs from database
    const actualDailyCost = await getUserDailyCost(userId);
    const actualMonthlyCost = await getUserMonthlyCost(userId);

    // Prevent division by zero
    const dailyLimit = userLimit.dailyLimit || 0.045;
    const monthlyLimit = userLimit.monthlyLimit || 1.35;

    return {
      dailyLimit,
      monthlyLimit,
      currentDaily: actualDailyCost,
      currentMonthly: actualMonthlyCost,
      dailyRemaining: Math.max(0, dailyLimit - actualDailyCost),
      monthlyRemaining: Math.max(0, monthlyLimit - actualMonthlyCost),
      dailyPercentage:
        dailyLimit > 0 ? (actualDailyCost / dailyLimit) * 100 : 0,
      monthlyPercentage:
        monthlyLimit > 0 ? (actualMonthlyCost / monthlyLimit) * 100 : 0,
    };
  } catch (error) {
    console.error("Error in getUserLimitStatus:", error);
    // Return default values on error
    return {
      dailyLimit: 0.045,
      monthlyLimit: 1.35,
      currentDaily: 0,
      currentMonthly: 0,
      dailyRemaining: 0.045,
      monthlyRemaining: 1.35,
      dailyPercentage: 0,
      monthlyPercentage: 0,
    };
  }
}
