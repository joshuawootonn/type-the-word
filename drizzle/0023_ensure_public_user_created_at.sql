ALTER TABLE "public"."user"
ADD COLUMN IF NOT EXISTS "createdAt" timestamp;

UPDATE "public"."user"
SET "createdAt" = COALESCE("createdAt", "emailVerified", CURRENT_TIMESTAMP(3))
WHERE "createdAt" IS NULL;

ALTER TABLE "public"."user"
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP(3);

ALTER TABLE "public"."user"
ALTER COLUMN "createdAt" SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'type-the-word'
          AND table_name = 'user'
    ) THEN
        ALTER TABLE "type-the-word"."user"
        ADD COLUMN IF NOT EXISTS "createdAt" timestamp;

        UPDATE "type-the-word"."user"
        SET "createdAt" = COALESCE("createdAt", "emailVerified", CURRENT_TIMESTAMP(3))
        WHERE "createdAt" IS NULL;

        ALTER TABLE "type-the-word"."user"
        ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP(3);

        ALTER TABLE "type-the-word"."user"
        ALTER COLUMN "createdAt" SET NOT NULL;
    END IF;
END $$;