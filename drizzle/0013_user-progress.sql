CREATE TABLE "userBookProgress" (
	"userId" varchar(255) NOT NULL,
	"book" "typedVerse_book" NOT NULL,
	"translation" "typedVerse_translation" NOT NULL,
	"prestige" integer DEFAULT 0 NOT NULL,
	"typedVerseCount" integer DEFAULT 0 NOT NULL,
	"totalVerses" integer NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "userBookProgress_userId_book_translation_pk" PRIMARY KEY("userId","book","translation")
);
--> statement-breakpoint
CREATE TABLE "userChapterProgress" (
	"userId" varchar(255) NOT NULL,
	"book" "typedVerse_book" NOT NULL,
	"chapter" integer NOT NULL,
	"translation" "typedVerse_translation" NOT NULL,
	"typedVerses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"typedVerseCount" integer DEFAULT 0 NOT NULL,
	"totalVerses" integer NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "userChapterProgress_userId_book_chapter_translation_pk" PRIMARY KEY("userId","book","chapter","translation")
);
--> statement-breakpoint
CREATE INDEX "userBookProgress_userId_idx" ON "userBookProgress" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "userChapterProgress_userId_idx" ON "userChapterProgress" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "userChapterProgress_userId_book_idx" ON "userChapterProgress" USING btree ("userId","book");