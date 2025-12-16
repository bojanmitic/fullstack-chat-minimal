-- CreateTable
CREATE TABLE "api_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "conversationId" TEXT,
    "service" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cost_limits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyLimit" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "monthlyLimit" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "currentDaily" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "currentMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastResetDaily" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastResetMonthly" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_cost_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_usage_userId_idx" ON "api_usage"("userId");

-- CreateIndex
CREATE INDEX "api_usage_timestamp_idx" ON "api_usage"("timestamp");

-- CreateIndex
CREATE INDEX "api_usage_service_idx" ON "api_usage"("service");

-- CreateIndex
CREATE INDEX "api_usage_conversationId_idx" ON "api_usage"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_cost_limits_userId_key" ON "user_cost_limits"("userId");

-- AddForeignKey
ALTER TABLE "api_usage" ADD CONSTRAINT "api_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cost_limits" ADD CONSTRAINT "user_cost_limits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
