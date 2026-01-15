import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Log database configuration status
if (process.env.NODE_ENV === "production") {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  console.log("📊 Database configuration:", {
    hasDatabaseUrl,
    databaseUrlPreview: hasDatabaseUrl
      ? `${process.env.DATABASE_URL?.substring(0, 30)}...`
      : "NOT SET",
  });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Test database connection on initialization (in production)
if (process.env.NODE_ENV === "production") {
  prisma.$connect().catch((error) => {
    console.error("❌ Failed to connect to database:", error.message);
    console.error("💡 Check your DATABASE_URL and RDS security group settings");
  });
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
