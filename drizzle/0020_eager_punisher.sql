ALTER TABLE "classroomStudentToken" ADD COLUMN IF NOT EXISTS "googleUserId" varchar(255);--> statement-breakpoint
UPDATE "classroomStudentToken" SET "googleUserId" = "userId" WHERE "googleUserId" IS NULL;--> statement-breakpoint
ALTER TABLE "classroomStudentToken" ALTER COLUMN "googleUserId" SET NOT NULL;