CREATE TABLE IF NOT EXISTS "type-the-word"."builtinTheme" (
	"themeId" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "type-the-word"."theme" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"label" varchar(255) NOT NULL,
	"primaryLightness" real DEFAULT 0 NOT NULL,
	"primaryChroma" real DEFAULT 0 NOT NULL,
	"primaryHue" real DEFAULT 0 NOT NULL,
	"secondaryLightness" real DEFAULT 0 NOT NULL,
	"secondaryChroma" real DEFAULT 0 NOT NULL,
	"secondaryHue" real DEFAULT 0 NOT NULL,
	"successLightness" real DEFAULT 0 NOT NULL,
	"successChroma" real DEFAULT 0 NOT NULL,
	"successHue" real DEFAULT 0 NOT NULL,
	"errorLightness" real DEFAULT 0 NOT NULL,
	"errorChroma" real DEFAULT 0 NOT NULL,
	"errorHue" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "type-the-word"."userTheme" (
	"userId" varchar(255) NOT NULL,
	"themeId" varchar(255) NOT NULL
);

