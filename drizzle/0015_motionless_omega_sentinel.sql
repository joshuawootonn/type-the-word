CREATE TABLE "classroomAssignment" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"teacherUserId" varchar(255) NOT NULL,
	"courseId" varchar(255) NOT NULL,
	"courseWorkId" varchar(255) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"translation" "typedVerse_translation" NOT NULL,
	"book" "typedVerse_book" NOT NULL,
	"startChapter" integer NOT NULL,
	"startVerse" integer NOT NULL,
	"endChapter" integer NOT NULL,
	"endVerse" integer NOT NULL,
	"maxPoints" integer DEFAULT 100 NOT NULL,
	"dueDate" timestamp,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classroomSubmission" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"assignmentId" varchar(255) NOT NULL,
	"studentUserId" varchar(255) NOT NULL,
	"submissionId" varchar(255),
	"completedVerses" integer DEFAULT 0 NOT NULL,
	"totalVerses" integer NOT NULL,
	"averageWpm" integer,
	"averageAccuracy" integer,
	"isCompleted" integer DEFAULT 0 NOT NULL,
	"isTurnedIn" integer DEFAULT 0 NOT NULL,
	"grade" integer,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"turnedInAt" timestamp,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "classroomSubmission_studentUserId_assignmentId_unique" UNIQUE("studentUserId","assignmentId")
);
--> statement-breakpoint
CREATE TABLE "classroomTeacherToken" (
	"userId" varchar(255) PRIMARY KEY NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"scope" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "classroomAssignment_teacherUserId_idx" ON "classroomAssignment" USING btree ("teacherUserId");--> statement-breakpoint
CREATE INDEX "classroomAssignment_courseId_idx" ON "classroomAssignment" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX "classroomAssignment_courseWorkId_idx" ON "classroomAssignment" USING btree ("courseWorkId");--> statement-breakpoint
CREATE INDEX "classroomSubmission_assignmentId_idx" ON "classroomSubmission" USING btree ("assignmentId");--> statement-breakpoint
CREATE INDEX "classroomSubmission_studentUserId_idx" ON "classroomSubmission" USING btree ("studentUserId");--> statement-breakpoint
CREATE INDEX "classroomSubmission_submissionId_idx" ON "classroomSubmission" USING btree ("submissionId");--> statement-breakpoint
CREATE INDEX "classroomTeacherToken_userId_idx" ON "classroomTeacherToken" USING btree ("userId");