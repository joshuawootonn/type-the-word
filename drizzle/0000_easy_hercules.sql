DO $$ BEGIN
 CREATE TYPE "type-the-word"."passageResponse_book" AS ENUM('genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth', '1_samuel', '2_samuel', '1_kings', '2_kings', '1_chronicles', '2_chronicles', 'ezra', 'nehemiah', 'esther', 'job', 'psalm', 'proverbs', 'ecclesiastes', 'song_of_solomon', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi', 'matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1_corinthians', '2_corinthians', 'galatians', 'ephesians', 'philippians', 'colossians', '1_thessalonians', '2_thessalonians', '1_timothy', '2_timothy', 'titus', 'philemon', 'hebrews', 'james', '1_peter', '2_peter', '1_john', '2_john', '3_john', 'jude', 'revelation');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "type-the-word"."passageResponse_translation" AS ENUM('esv');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "type-the-word"."typedVerse_book" AS ENUM('genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth', '1_samuel', '2_samuel', '1_kings', '2_kings', '1_chronicles', '2_chronicles', 'ezra', 'nehemiah', 'esther', 'job', 'psalm', 'proverbs', 'ecclesiastes', 'song_of_solomon', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi', 'matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1_corinthians', '2_corinthians', 'galatians', 'ephesians', 'philippians', 'colossians', '1_thessalonians', '2_thessalonians', '1_timothy', '2_timothy', 'titus', 'philemon', 'hebrews', 'james', '1_peter', '2_peter', '1_john', '2_john', '3_john', 'jude', 'revelation');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "type-the-word"."typedVerse_translation" AS ENUM('esv');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "type-the-word"."account" (
	"userId" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "type-the-word"."passageResponse" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"book" "type-the-word"."passageResponse_book" NOT NULL,
	"chapter" integer NOT NULL,
	"translation" "type-the-word"."passageResponse_translation" NOT NULL,
	"response" json NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "type-the-word"."session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "type-the-word"."typedVerse" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"typingSessionId" varchar(255) NOT NULL,
	"translation" "type-the-word"."typedVerse_translation" NOT NULL,
	"book" "type-the-word"."typedVerse_book" NOT NULL,
	"chapter" integer NOT NULL,
	"verse" integer NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "type-the-word"."typingSession" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "type-the-word"."user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp DEFAULT CURRENT_TIMESTAMP(3),
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "type-the-word"."verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "type-the-word"."account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "type-the-word"."session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "typedVerse_userId_idx" ON "type-the-word"."typedVerse" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "typingSessionId_userId_idx" ON "type-the-word"."typedVerse" USING btree ("typingSessionId","userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "typingSession_userId_idx" ON "type-the-word"."typingSession" USING btree ("userId");