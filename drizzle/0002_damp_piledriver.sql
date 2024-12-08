CREATE TABLE IF NOT EXISTS "type-the-word"."theme" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"value" varchar(255) NOT NULL,
	"primaryLightness" real DEFAULT 0,
	"primaryChroma" real DEFAULT 0,
	"primaryHue" real DEFAULT 0,
	"secondaryLightness" real DEFAULT 0,
	"secondaryChroma" real DEFAULT 0,
	"secondaryHue" real DEFAULT 0,
	"successLightness" real DEFAULT 0,
	"successChroma" real DEFAULT 0,
	"successHue" real DEFAULT 0,
	"errorLightness" real DEFAULT 0,
	"errorChroma" real DEFAULT 0,
	"errorHue" real DEFAULT 0
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theme_userId_idx" ON "type-the-word"."theme" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "theme_value_userId_idx" ON "type-the-word"."theme" USING btree ("userId","value");