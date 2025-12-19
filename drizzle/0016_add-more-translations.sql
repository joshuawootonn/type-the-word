-- Add additional translation values to passageResponse_translation enum
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'nlt';
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'niv';
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'csb';
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'nkjv';
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'nasb';
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'ntv';
ALTER TYPE "public"."passageResponse_translation" ADD VALUE IF NOT EXISTS 'msg';
--> statement-breakpoint
-- Add additional translation values to typedVerse_translation enum
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'nlt';
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'niv';
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'csb';
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'nkjv';
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'nasb';
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'ntv';
ALTER TYPE "public"."typedVerse_translation" ADD VALUE IF NOT EXISTS 'msg';

