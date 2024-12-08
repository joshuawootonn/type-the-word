DROP TABLE "type-the-word"."userTheme";--> statement-breakpoint
DROP INDEX IF EXISTS "theme_userId_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "theme_value_userId_idx";--> statement-breakpoint
ALTER TABLE "type-the-word"."theme" DROP COLUMN IF EXISTS "userId";