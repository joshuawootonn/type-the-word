ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "createdAt" timestamp;

UPDATE "user"
SET "createdAt" = COALESCE("createdAt", "emailVerified", CURRENT_TIMESTAMP(3))
WHERE "createdAt" IS NULL;

ALTER TABLE "user" ALTER COLUMN "createdAt" SET NOT NULL;