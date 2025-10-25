
-- Inspect users (optional - verify IDs are correct)
SELECT "id","name","email" FROM "type-the-word"."user" WHERE "id" IN (:source_user_id,:target_user_id);

-- Move typing sessions
UPDATE "type-the-word"."typingSession"
SET "userId" = :target_user_id
WHERE "userId" = :source_user_id;

-- Move typed verses
UPDATE "type-the-word"."typedVerse"
SET "userId" = :target_user_id
WHERE "userId" = :source_user_id;

-- Merge user themes: add missing themes to target
INSERT INTO "type-the-word"."userTheme" ("userId","themeId")
SELECT :target_user_id, ut."themeId"
FROM "type-the-word"."userTheme" ut
LEFT JOIN "type-the-word"."userTheme" tgt
  ON tgt."userId" = :target_user_id AND tgt."themeId" = ut."themeId"
WHERE ut."userId" = :source_user_id
  AND tgt."themeId" IS NULL;

-- Then remove source themes
DELETE FROM "type-the-word"."userTheme"
WHERE "userId" = :source_user_id;

-- Move user current theme if target has none; otherwise keep target's and drop source's
UPDATE "type-the-word"."userCurrentTheme" u
SET "userId" = :target_user_id
WHERE u."userId" = :source_user_id
  AND NOT EXISTS (
    SELECT 1 FROM "type-the-word"."userCurrentTheme" t WHERE t."userId" = :target_user_id
  );

DELETE FROM "type-the-word"."userCurrentTheme"
WHERE "userId" = :source_user_id;

-- Merge user changelog (keep latest lastVisitedAt)
INSERT INTO "type-the-word"."userChangelog" ("userId","lastVisitedAt")
SELECT :target_user_id, uc_src."lastVisitedAt"
FROM "type-the-word"."userChangelog" uc_src
WHERE uc_src."userId" = :source_user_id
ON CONFLICT ("userId") DO UPDATE
SET "lastVisitedAt" = GREATEST(
  EXCLUDED."lastVisitedAt",
  "type-the-word"."userChangelog"."lastVisitedAt"
);

-- Remove source changelog row (if any)
DELETE FROM "type-the-word"."userChangelog"
WHERE "userId" = :source_user_id;

-- Invalidate sessions (recommended)
DELETE FROM "type-the-word"."session"
WHERE "userId" IN (:source_user_id,:target_user_id);

-- Optional: delete the source user after verifying merge
-- DELETE FROM "type-the-word"."user" WHERE "id" = :source_user_id;

-- Verify migration (optional)
SELECT "id","name","email" FROM "type-the-word"."user" WHERE "id" = :target_user_id;
SELECT COUNT(*) as account_count FROM "type-the-word"."account" WHERE "userId" = :target_user_id;
SELECT COUNT(*) as typing_session_count FROM "type-the-word"."typingSession" WHERE "userId" = :target_user_id;
SELECT COUNT(*) as typed_verse_count FROM "type-the-word"."typedVerse" WHERE "userId" = :target_user_id;