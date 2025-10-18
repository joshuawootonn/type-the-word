ALTER TABLE "type-the-word"."user" ADD COLUMN "username" varchar(255);--> statement-breakpoint
ALTER TABLE "type-the-word"."user" ADD COLUMN "hashedPassword" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_username_idx" ON "type-the-word"."user" USING btree ("username");--> statement-breakpoint
ALTER TABLE "type-the-word"."user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");