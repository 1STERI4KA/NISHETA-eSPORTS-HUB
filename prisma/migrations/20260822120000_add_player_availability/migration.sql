ALTER TABLE "Player"
ADD COLUMN "availability" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN "availabilityUpdatedAt" TIMESTAMP(3);
