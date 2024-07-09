CREATE TABLE IF NOT EXISTS "type-the-word"."userChangelog" (
	"userId" varchar(255) PRIMARY KEY NOT NULL,
	"lastVisitedAt" timestamp NOT NULL
);
