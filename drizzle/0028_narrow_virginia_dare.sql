CREATE TABLE IF NOT EXISTS "organizationSettings" (
	"organizationId" varchar(255) NOT NULL,
	"accuracyThreshold" integer DEFAULT 50 NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "organizationSettings_organizationId_unique" UNIQUE("organizationId"),
	CONSTRAINT "organizationSettings_accuracyThreshold_check" CHECK ("organizationSettings"."accuracyThreshold" >= 0 AND "organizationSettings"."accuracyThreshold" <= 100)
);
--> statement-breakpoint
INSERT INTO "organizationSettings" (
	"organizationId",
	"accuracyThreshold",
	"createdAt",
	"updatedAt"
)
SELECT
	"id",
	50,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
FROM "organization"
ON CONFLICT ("organizationId") DO NOTHING;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizationSettings_organizationId_idx" ON "organizationSettings" USING btree ("organizationId");