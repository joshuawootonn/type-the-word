-- Google Classroom Integration Tables
-- Supports both CourseWork API integration and Classroom Add-on

-- Enum for integration type
DO $$ BEGIN
    CREATE TYPE "classroom_integration_type" AS ENUM('coursework', 'addon');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Classroom assignments created by teachers
CREATE TABLE IF NOT EXISTS "classroomAssignment" (
    "id" varchar(255) PRIMARY KEY NOT NULL,
    "integrationType" "classroom_integration_type" NOT NULL,
    "courseId" varchar(255) NOT NULL,
    "courseWorkId" varchar(255),
    "attachmentId" varchar(255),
    "itemId" varchar(255),
    "teacherGoogleId" varchar(255) NOT NULL,
    "teacherUserId" varchar(255),
    "translation" "typedVerse_translation" NOT NULL,
    "book" "typedVerse_book" NOT NULL,
    "chapter" integer NOT NULL,
    "firstVerse" integer,
    "lastVerse" integer,
    "title" varchar(500),
    "maxPoints" integer DEFAULT 100,
    "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP(3) NOT NULL
);

-- Student submissions/progress for classroom assignments
CREATE TABLE IF NOT EXISTS "classroomSubmission" (
    "id" varchar(255) PRIMARY KEY NOT NULL,
    "assignmentId" varchar(255) NOT NULL,
    "studentGoogleId" varchar(255) NOT NULL,
    "studentUserId" varchar(255),
    "googleSubmissionId" varchar(255),
    "versesCompleted" integer DEFAULT 0 NOT NULL,
    "totalVerses" integer NOT NULL,
    "averageWpm" integer,
    "averageAccuracy" integer,
    "completedAt" timestamp,
    "grade" integer,
    "gradeSubmittedAt" timestamp,
    "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP(3) NOT NULL
);

-- Teacher OAuth tokens for CourseWork API access
CREATE TABLE IF NOT EXISTS "classroomTeacherToken" (
    "id" varchar(255) PRIMARY KEY NOT NULL,
    "userId" varchar(255) NOT NULL,
    "googleId" varchar(255) NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text,
    "expiresAt" timestamp,
    "scope" text,
    "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP(3) NOT NULL,
    "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP(3) NOT NULL
);

-- Indexes for classroomAssignment
CREATE INDEX IF NOT EXISTS "classroomAssignment_courseId_idx" ON "classroomAssignment" ("courseId");
CREATE INDEX IF NOT EXISTS "classroomAssignment_courseWorkId_idx" ON "classroomAssignment" ("courseWorkId");
CREATE INDEX IF NOT EXISTS "classroomAssignment_attachmentId_idx" ON "classroomAssignment" ("attachmentId");
CREATE INDEX IF NOT EXISTS "classroomAssignment_teacherGoogleId_idx" ON "classroomAssignment" ("teacherGoogleId");

-- Indexes for classroomSubmission
CREATE INDEX IF NOT EXISTS "classroomSubmission_assignmentId_idx" ON "classroomSubmission" ("assignmentId");
CREATE INDEX IF NOT EXISTS "classroomSubmission_studentGoogleId_idx" ON "classroomSubmission" ("studentGoogleId");
CREATE INDEX IF NOT EXISTS "classroomSubmission_assignment_student_idx" ON "classroomSubmission" ("assignmentId", "studentGoogleId");

-- Indexes for classroomTeacherToken
CREATE INDEX IF NOT EXISTS "classroomTeacherToken_userId_idx" ON "classroomTeacherToken" ("userId");
CREATE INDEX IF NOT EXISTS "classroomTeacherToken_googleId_idx" ON "classroomTeacherToken" ("googleId");
ALTER TABLE "classroomTeacherToken" ADD CONSTRAINT "classroomTeacherToken_userId_unique" UNIQUE ("userId");
