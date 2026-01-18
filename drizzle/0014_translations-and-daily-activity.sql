-- Add translation enum values (idempotent - IF NOT EXISTS)
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'bsb';--> statement-breakpoint
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'nlt';--> statement-breakpoint
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'niv';--> statement-breakpoint
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'csb';--> statement-breakpoint
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'nkjv';--> statement-breakpoint
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'nasb';--> statement-breakpoint
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'ntv';--> statement-breakpoint
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'msg';--> statement-breakpoint
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'bsb';--> statement-breakpoint
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'nlt';--> statement-breakpoint
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'niv';--> statement-breakpoint
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'csb';--> statement-breakpoint
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'nkjv';--> statement-breakpoint
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'nasb';--> statement-breakpoint
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'ntv';--> statement-breakpoint
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'msg';--> statement-breakpoint
-- Create userDailyActivity table (idempotent - IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS "userDailyActivity" (
	"userId" varchar(255) NOT NULL,
	"date" timestamp NOT NULL,
	"verseCount" integer DEFAULT 0 NOT NULL,
	"passages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"averageWpm" integer,
	"averageAccuracy" integer,
	"averageCorrectedAccuracy" integer,
	"versesWithStats" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "userDailyActivity_userId_date_pk" PRIMARY KEY("userId","date")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "userDailyActivity_userId_idx" ON "userDailyActivity" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "userDailyActivity_userId_date_idx" ON "userDailyActivity" USING btree ("userId","date");
