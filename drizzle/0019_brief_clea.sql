CREATE TABLE IF NOT EXISTS "classroomStudentToken" (
	"userId" varchar(255) PRIMARY KEY NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"scope" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classroomStudentToken_userId_idx" ON "classroomStudentToken" USING btree ("userId");