import NextAuth from "next-auth";
import { authOptions, validateAuthConfig } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// Lazy initialization - handler is created on first request, not at module load
let handler: ReturnType<typeof NextAuth> | null = null;
let initError: string | null = null;

function getHandler(): ReturnType<typeof NextAuth> {
  // Return cached handler if already initialized
  if (handler) {
    return handler;
  }

  // Return error handler if we already failed
  if (initError) {
    return createErrorHandler(initError);
  }

  // Validate configuration before initializing
  const validation = validateAuthConfig();
  if (!validation.valid) {
    console.error("❌ NextAuth configuration invalid:", validation.error);
    initError = validation.error || "Invalid configuration";
    return createErrorHandler(initError);
  }

  // Try to initialize NextAuth
  try {
    handler = NextAuth(authOptions);
    console.log("✅ NextAuth handler initialized successfully");
    return handler;
  } catch (error) {
    console.error("❌ Failed to initialize NextAuth:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : undefined,
    });
    initError =
      error instanceof Error
        ? error.message
        : "Failed to initialize authentication. Check server logs.";
    return createErrorHandler(initError);
  }
}

function createErrorHandler(errorMessage: string): ReturnType<typeof NextAuth> {
  return (async (_req: Request) => {
    return NextResponse.json(
      {
        error: "Authentication service unavailable",
        message: errorMessage,
      },
      { status: 500 }
    );
  }) as ReturnType<typeof NextAuth>;
}

// Helper to ensure JSON response
async function ensureJsonResponse(response: Response): Promise<Response> {
  const contentType = response.headers.get("content-type");

  // If it's already JSON, return as-is
  if (contentType?.includes("application/json")) {
    return response;
  }

  // If it's HTML (error page), convert to JSON
  if (contentType?.includes("text/html")) {
    try {
      const text = await response.text();
      console.error(
        "⚠️ Received HTML response instead of JSON:",
        text.substring(0, 200)
      );
    } catch (err) {
      console.error("⚠️ Could not read HTML response body:", err);
    }

    return NextResponse.json(
      {
        error: "Authentication service error",
        message:
          "The authentication service returned an unexpected response format. Please check server logs.",
      },
      { status: response.status || 500 }
    );
  }

  // For other content types, log and return JSON error
  if (contentType && !contentType.includes("application/json")) {
    console.error("⚠️ Unexpected content type:", contentType);
    return NextResponse.json(
      {
        error: "Authentication service error",
        message: "Unexpected response format from authentication service.",
      },
      { status: response.status || 500 }
    );
  }

  return response;
}

// Wrap handlers to catch runtime database errors
export async function GET(req: Request) {
  try {
    const activeHandler = getHandler();
    const response = await activeHandler(req);
    return await ensureJsonResponse(response);
  } catch (error) {
    console.error("❌ NextAuth GET error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      url: req.url,
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : undefined,
    });

    // Check for Prisma database errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P1001" || error.code === "P1000") {
        return NextResponse.json(
          {
            error: "Database connection error",
            message: "Unable to connect to database. Please try again later.",
          },
          { status: 503 }
        );
      }
    }

    // Check if it's a database connection error (string matching for other error types)
    if (
      error instanceof Error &&
      (error.message.includes("P1001") ||
        error.message.includes("connection") ||
        error.message.includes("database") ||
        error.message.includes("ECONNREFUSED"))
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
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const activeHandler = getHandler();
    const response = await activeHandler(req);
    return await ensureJsonResponse(response);
  } catch (error) {
    console.error("❌ NextAuth POST error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      url: req.url,
      stack:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : undefined,
    });

    // Check for Prisma database errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P1001" || error.code === "P1000") {
        return NextResponse.json(
          {
            error: "Database connection error",
            message: "Unable to connect to database. Please try again later.",
          },
          { status: 503 }
        );
      }
    }

    // Check if it's a database connection error (string matching for other error types)
    if (
      error instanceof Error &&
      (error.message.includes("P1001") ||
        error.message.includes("connection") ||
        error.message.includes("database") ||
        error.message.includes("ECONNREFUSED"))
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
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
