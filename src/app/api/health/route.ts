import { NextResponse } from "next/server";

// Simple health check - no dependencies
export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30),
    },
  };

  // Step 1: Check if Prisma can be imported
  try {
    const { PrismaClient } = await import("@prisma/client");
    checks.prismaImport = "OK";
    
    // Step 2: Check if Prisma client can be instantiated
    try {
      const testClient = new PrismaClient();
      checks.prismaInstantiate = "OK";
      
      // Step 3: Check if we can connect to the database
      try {
        await testClient.$connect();
        checks.prismaConnect = "OK";
        
        // Step 4: Check if we can query the database
        try {
          const userCount = await testClient.user.count();
          checks.prismaQuery = "OK";
          checks.userCount = userCount;
        } catch (queryError) {
          checks.prismaQuery = "FAILED";
          checks.prismaQueryError = queryError instanceof Error ? queryError.message : String(queryError);
        }
        
        await testClient.$disconnect();
      } catch (connectError) {
        checks.prismaConnect = "FAILED";
        checks.prismaConnectError = connectError instanceof Error ? connectError.message : String(connectError);
      }
    } catch (instantiateError) {
      checks.prismaInstantiate = "FAILED";
      checks.prismaInstantiateError = instantiateError instanceof Error ? instantiateError.message : String(instantiateError);
    }
  } catch (importError) {
    checks.prismaImport = "FAILED";
    checks.prismaImportError = importError instanceof Error ? importError.message : String(importError);
  }

  // Step 5: Check if NextAuth can be imported
  try {
    await import("next-auth");
    checks.nextAuthImport = "OK";
  } catch (nextAuthError) {
    checks.nextAuthImport = "FAILED";
    checks.nextAuthImportError = nextAuthError instanceof Error ? nextAuthError.message : String(nextAuthError);
  }

  // Step 6: Check if our auth config can be imported
  try {
    const { validateAuthConfig } = await import("@/lib/auth");
    checks.authConfigImport = "OK";
    
    const validation = validateAuthConfig();
    checks.authConfigValidation = validation;
  } catch (authConfigError) {
    checks.authConfigImport = "FAILED";
    checks.authConfigImportError = authConfigError instanceof Error ? authConfigError.message : String(authConfigError);
  }

  const allOk = 
    checks.prismaImport === "OK" &&
    checks.prismaInstantiate === "OK" &&
    checks.prismaConnect === "OK" &&
    checks.prismaQuery === "OK" &&
    checks.nextAuthImport === "OK" &&
    checks.authConfigImport === "OK";

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "unhealthy",
      checks,
    },
    { status: allOk ? 200 : 500 }
  );
}
