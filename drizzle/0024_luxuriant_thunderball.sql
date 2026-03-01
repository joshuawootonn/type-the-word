ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP(3);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "deactivatedAt" timestamp;