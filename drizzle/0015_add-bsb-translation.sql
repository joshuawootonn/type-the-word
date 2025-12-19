-- Add 'bsb' value to passageResponse_translation enum
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'bsb';
--> statement-breakpoint
-- Add 'bsb' value to typedVerse_translation enum
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'bsb';

