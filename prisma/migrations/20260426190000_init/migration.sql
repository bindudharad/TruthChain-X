-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('url', 'text', 'image', 'video', 'qr');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('SAFE', 'SUSPICIOUS', 'HIGH_RISK');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('safe', 'risk');

-- CreateEnum
CREATE TYPE "SourcePlatform" AS ENUM ('web', 'youtube', 'social', 'image', 'search');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "inputType" "AnalysisType" NOT NULL,
    "recordHash" TEXT,
    "trustScore" INTEGER NOT NULL,
    "safe" INTEGER NOT NULL,
    "risk" INTEGER NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "explanation" TEXT NOT NULL,
    "reasons" TEXT[],
    "confidence" INTEGER NOT NULL,
    "limitedData" BOOLEAN NOT NULL DEFAULT false,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "responseJson" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "type" "SignalType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impactScore" INTEGER NOT NULL,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "source" TEXT,
    "author" TEXT,
    "platform" "SourcePlatform" NOT NULL DEFAULT 'web',

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Similarity" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "matchPercentage" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "image" TEXT,
    "source" TEXT,

    CONSTRAINT "Similarity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_inputHash_key" ON "Analysis"("inputHash");

-- CreateIndex
CREATE INDEX "Analysis_userId_createdAt_idx" ON "Analysis"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Analysis_inputType_createdAt_idx" ON "Analysis"("inputType", "createdAt");

-- CreateIndex
CREATE INDEX "Signal_analysisId_idx" ON "Signal"("analysisId");

-- CreateIndex
CREATE INDEX "Report_analysisId_idx" ON "Report"("analysisId");

-- CreateIndex
CREATE INDEX "Similarity_analysisId_idx" ON "Similarity"("analysisId");

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Similarity" ADD CONSTRAINT "Similarity_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

