ALTER TABLE "type-the-word"."user" DROP CONSTRAINT "user_username_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "user_username_idx";--> statement-breakpoint
ALTER TABLE "type-the-word"."user" DROP COLUMN IF EXISTS "username";