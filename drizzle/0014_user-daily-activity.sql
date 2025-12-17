CREATE TABLE "userDailyActivity" (
	"userId" varchar(255) NOT NULL,
	"date" timestamp NOT NULL,
	"verseCount" integer DEFAULT 0 NOT NULL,
	"passages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"averageWpm" integer,
	"averageAccuracy" integer,
	"averageCorrectedAccuracy" integer,
	"versesWithStats" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "userDailyActivity_userId_date_pk" PRIMARY KEY("userId","date")
);
--> statement-breakpoint
CREATE INDEX "userDailyActivity_userId_idx" ON "userDailyActivity" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "userDailyActivity_userId_date_idx" ON "userDailyActivity" USING btree ("userId","date");

