import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// Export NextAuth handler with error handling
let handler: ReturnType<typeof NextAuth>;

try {
  handler = NextAuth(authOptions);
} catch (error) {
  console.error("❌ Failed to initialize NextAuth:", error);
  // Create a fallback handler that returns proper JSON errors
  handler = (async (req: Request) => {
    return NextResponse.json(
      {
        error: "Authentication service unavailable",
        message:
          error instanceof Error
            ? error.message
            : "Failed to initialize authentication. Check server logs.",
      },
      { status: 500 }
    );
  }) as any;
}

// Wrap handlers to catch runtime database errors
export async function GET(req: Request) {
  try {
    return await handler(req);
  } catch (error) {
    console.error("NextAuth GET error:", error);
    // Check if it's a database connection error
    if (
      error instanceof Error &&
      (error.message.includes("P1001") ||
        error.message.includes("connection") ||
        error.message.includes("database"))
    ) {
      return NextResponse.json(
        {
          error: "Database connection error",
          message:
            "Unable to connect to database. Please check DATABASE_URL and RDS security settings.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        error: "Authentication error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    return await handler(req);
  } catch (error) {
    console.error("NextAuth POST error:", error);
    // Check if it's a database connection error
    if (
      error instanceof Error &&
      (error.message.includes("P1001") ||
        error.message.includes("connection") ||
        error.message.includes("database"))
    ) {
      return NextResponse.json(
        {
          error: "Database connection error",
          message:
            "Unable to connect to database. Please check DATABASE_URL and RDS security settings.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        error: "Authentication error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
