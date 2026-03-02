ALTER TABLE "organizationUser" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organizationUser" ALTER COLUMN "status" SET DEFAULT 'PENDING'::text;--> statement-breakpoint
UPDATE "organizationUser"
SET "status" = UPPER("status")
WHERE "status" IN ('pending', 'approved', 'rejected');--> statement-breakpoint
DROP TYPE "public"."organization_membership_status";--> statement-breakpoint
CREATE TYPE "public"."organization_membership_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "organizationUser" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."organization_membership_status";--> statement-breakpoint
ALTER TABLE "organizationUser" ALTER COLUMN "status" SET DATA TYPE "public"."organization_membership_status" USING "status"::"public"."organization_membership_status";--> statement-breakpoint
ALTER TABLE "organizationUser" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
UPDATE "organizationUser"
SET "role" = UPPER("role")
WHERE "role" IN ('org_admin', 'teacher', 'student');--> statement-breakpoint
DROP TYPE "public"."organization_role";--> statement-breakpoint
CREATE TYPE "public"."organization_role" AS ENUM('ORG_ADMIN', 'TEACHER', 'STUDENT');--> statement-breakpoint
ALTER TABLE "organizationUser" ALTER COLUMN "role" SET DATA TYPE "public"."organization_role" USING "role"::"public"."organization_role";