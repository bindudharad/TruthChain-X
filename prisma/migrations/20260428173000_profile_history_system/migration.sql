ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "externalId" TEXT,
ADD COLUMN IF NOT EXISTS "name" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

UPDATE "User"
SET "externalId" = COALESCE("externalId", "email")
WHERE "externalId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_externalId_key" ON "User"("externalId");

CREATE TABLE IF NOT EXISTS "AnalysisDetails" (
  "id" TEXT NOT NULL,
  "analysisId" TEXT NOT NULL,
  "safeSignals" JSONB NOT NULL,
  "riskSignals" JSONB NOT NULL,
  "explanation" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalysisDetails_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnalysisDetails_analysisId_key" ON "AnalysisDetails"("analysisId");

CREATE TABLE IF NOT EXISTS "AnalysisHistory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "analysisId" TEXT NOT NULL,
  "inputValue" TEXT NOT NULL,
  "inputType" "AnalysisType" NOT NULL,
  "score" INTEGER NOT NULL,
  "verdict" "Verdict" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalysisHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnalysisHistory_userId_inputValue_key" ON "AnalysisHistory"("userId", "inputValue");
CREATE INDEX IF NOT EXISTS "AnalysisHistory_userId_updatedAt_idx" ON "AnalysisHistory"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "AnalysisHistory_analysisId_idx" ON "AnalysisHistory"("analysisId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'AnalysisDetails_analysisId_fkey'
  ) THEN
    ALTER TABLE "AnalysisDetails"
    ADD CONSTRAINT "AnalysisDetails_analysisId_fkey"
    FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'AnalysisHistory_userId_fkey'
  ) THEN
    ALTER TABLE "AnalysisHistory"
    ADD CONSTRAINT "AnalysisHistory_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'AnalysisHistory_analysisId_fkey'
  ) THEN
    ALTER TABLE "AnalysisHistory"
    ADD CONSTRAINT "AnalysisHistory_analysisId_fkey"
    FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
