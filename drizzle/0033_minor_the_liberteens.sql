DROP INDEX IF EXISTS "passageResponse_cache_lookup_idx";--> statement-breakpoint
ALTER TABLE "passageResponse" ALTER COLUMN "firstVerse" SET DEFAULT 0;--> statement-breakpoint
UPDATE "passageResponse" SET "firstVerse" = 0 WHERE "firstVerse" IS NULL;--> statement-breakpoint
ALTER TABLE "passageResponse" ALTER COLUMN "firstVerse" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "passageResponse" ALTER COLUMN "lastVerse" SET DEFAULT 0;--> statement-breakpoint
UPDATE "passageResponse" SET "lastVerse" = 0 WHERE "lastVerse" IS NULL;--> statement-breakpoint
ALTER TABLE "passageResponse" ALTER COLUMN "lastVerse" SET NOT NULL;--> statement-breakpoint
DELETE FROM "passageResponse" p
USING (
 SELECT ctid
 FROM (
  SELECT
   ctid,
   row_number() OVER (
    PARTITION BY "translation", "book", "chapter", "firstVerse", "lastVerse"
    ORDER BY "updatedAt" DESC, "createdAt" DESC, "id" DESC
   ) AS rn
  FROM "passageResponse"
 ) ranked
 WHERE ranked.rn > 1
) dupes
WHERE p.ctid = dupes.ctid;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (
  SELECT 1
  FROM pg_constraint
  WHERE conname = 'passageResponse_cache_key_unique'
 ) THEN
  ALTER TABLE "passageResponse"
  ADD CONSTRAINT "passageResponse_cache_key_unique"
  UNIQUE("translation","book","chapter","firstVerse","lastVerse");
 END IF;
END $$;