-- Add column as nullable first
ALTER TABLE "classroomAssignment" ADD COLUMN "totalVerses" integer;

-- Set default value of 0 for any existing assignments
UPDATE "classroomAssignment" SET "totalVerses" = 0 WHERE "totalVerses" IS NULL;

-- Now make it NOT NULL
ALTER TABLE "classroomAssignment" ALTER COLUMN "totalVerses" SET NOT NULL;