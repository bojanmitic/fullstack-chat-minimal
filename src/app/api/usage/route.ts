import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserLimitStatus } from "@/lib/limitChecker";

export async function GET() {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user limit status
    const status = await getUserLimitStatus(userId);

    return NextResponse.json({
      daily: {
        spent: status.currentDaily,
        limit: status.dailyLimit,
        remaining: status.dailyRemaining,
        percentage: status.dailyPercentage,
      },
      monthly: {
        spent: status.currentMonthly,
        limit: status.monthlyLimit,
        remaining: status.monthlyRemaining,
        percentage: status.monthlyPercentage,
      },
    });
  } catch (error) {
    console.error("Failed to get usage stats:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to get usage statistics",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
