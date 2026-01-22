import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint for monitoring
 * Returns basic system status and database connectivity
 */
export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
