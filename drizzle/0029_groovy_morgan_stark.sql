ALTER TABLE "organizationSettings" ADD COLUMN IF NOT EXISTS "regularAccuracyThreshold" integer DEFAULT 20;--> statement-breakpoint
UPDATE "organizationSettings"
SET "regularAccuracyThreshold" = 20
WHERE "regularAccuracyThreshold" IS NULL;--> statement-breakpoint
ALTER TABLE "organizationSettings" ALTER COLUMN "regularAccuracyThreshold" SET DEFAULT 20;--> statement-breakpoint
ALTER TABLE "organizationSettings" ALTER COLUMN "regularAccuracyThreshold" SET NOT NULL;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'organizationSettings_regularAccuracyThreshold_check'
    ) THEN
        ALTER TABLE "organizationSettings"
        ADD CONSTRAINT "organizationSettings_regularAccuracyThreshold_check"
        CHECK ("organizationSettings"."regularAccuracyThreshold" >= 0 AND "organizationSettings"."regularAccuracyThreshold" <= 100);
    END IF;
END $$;