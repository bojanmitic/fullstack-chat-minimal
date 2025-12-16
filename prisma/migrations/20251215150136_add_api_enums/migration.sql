/*
  Warnings:

  - Changed the type of `service` on the `api_usage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `operation` on the `api_usage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ApiService" AS ENUM ('OPENAI', 'PINECONE');

-- CreateEnum
CREATE TYPE "ApiOperation" AS ENUM ('CHAT_COMPLETION', 'EMBEDDING', 'QUERY', 'UPSERT');

-- AlterTable
ALTER TABLE "api_usage" DROP COLUMN "service",
ADD COLUMN     "service" "ApiService" NOT NULL,
DROP COLUMN "operation",
ADD COLUMN     "operation" "ApiOperation" NOT NULL;

-- CreateIndex
CREATE INDEX "api_usage_service_idx" ON "api_usage"("service");
