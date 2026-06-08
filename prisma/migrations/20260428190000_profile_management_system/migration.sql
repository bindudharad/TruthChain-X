ALTER TABLE "Analysis"
ADD COLUMN IF NOT EXISTS "isBookmarked" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AnalysisHistory"
ADD COLUMN IF NOT EXISTS "isBookmarked" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "UserInsight" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "inputValue" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserInsight_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserInsight_userId_inputValue_key" ON "UserInsight"("userId", "inputValue");
CREATE INDEX IF NOT EXISTS "UserInsight_userId_count_idx" ON "UserInsight"("userId", "count");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'UserInsight_userId_fkey'
  ) THEN
    ALTER TABLE "UserInsight"
    ADD CONSTRAINT "UserInsight_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
