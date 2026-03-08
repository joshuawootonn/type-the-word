DO $$
BEGIN
    CREATE TYPE "public"."organization_membership_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$
BEGIN
    CREATE TYPE "public"."organization_role" AS ENUM('org_admin', 'teacher', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courseTeacher" (
	"organizationId" varchar(255) NOT NULL,
	"courseId" varchar(255) NOT NULL,
	"teacherUserId" varchar(255) NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "courseTeacher_organizationId_courseId_teacherUserId_pk" PRIMARY KEY("organizationId","courseId","teacherUserId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"domain" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "organization_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizationUser" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"organizationId" varchar(255) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"role" "organization_role" NOT NULL,
	"status" "organization_membership_status" DEFAULT 'pending' NOT NULL,
	"approvedByUserId" varchar(255),
	"approvedAt" timestamp,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "organizationUser_organizationId_userId_unique" UNIQUE("organizationId","userId")
);
--> statement-breakpoint
ALTER TABLE "classroomAssignment" ADD COLUMN IF NOT EXISTS "organizationId" varchar(255);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courseTeacher_organizationId_idx" ON "courseTeacher" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courseTeacher_courseId_idx" ON "courseTeacher" USING btree ("courseId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "courseTeacher_teacherUserId_idx" ON "courseTeacher" USING btree ("teacherUserId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizationUser_organizationId_idx" ON "organizationUser" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizationUser_userId_idx" ON "organizationUser" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizationUser_status_idx" ON "organizationUser" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "classroomAssignment_organizationId_idx" ON "classroomAssignment" USING btree ("organizationId");