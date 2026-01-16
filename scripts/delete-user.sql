-- Inspect user before deletion (optional)
SELECT "id","name","email" FROM "type-the-word"."user" WHERE "id" = :user_id;

-- Preview what will be deleted (optional)
SELECT 
  (SELECT COUNT(*) FROM "type-the-word"."account" WHERE "userId" = :user_id) AS accounts,
  (SELECT COUNT(*) FROM "type-the-word"."session" WHERE "userId" = :user_id) AS sessions,
  (SELECT COUNT(*) FROM "type-the-word"."typedVerse" WHERE "userId" = :user_id) AS typed_verses,
  (SELECT COUNT(*) FROM "type-the-word"."typingSession" WHERE "userId" = :user_id) AS typing_sessions,
  (SELECT COUNT(*) FROM "type-the-word"."userDailyActivity" WHERE "userId" = :user_id) AS user_daily_activity,
  (SELECT COUNT(*) FROM "type-the-word"."userBookProgress" WHERE "userId" = :user_id) AS user_book_progress,
  (SELECT COUNT(*) FROM "type-the-word"."userChapterProgress" WHERE "userId" = :user_id) AS user_chapter_progress,
  (SELECT COUNT(*) FROM "type-the-word"."userTheme" WHERE "userId" = :user_id) AS user_themes,
  (SELECT COUNT(*) FROM "type-the-word"."userCurrentTheme" WHERE "userId" = :user_id) AS user_current_theme,
  (SELECT COUNT(*) FROM "type-the-word"."userChangelog" WHERE "userId" = :user_id) AS user_changelog;

-- Delete provider accounts
DELETE FROM "type-the-word"."account"
WHERE "userId" = :user_id;

-- Delete sessions
DELETE FROM "type-the-word"."session"
WHERE "userId" = :user_id;

-- Delete typed verses
DELETE FROM "type-the-word"."typedVerse"
WHERE "userId" = :user_id;

-- Delete typing sessions
DELETE FROM "type-the-word"."typingSession"
WHERE "userId" = :user_id;

-- Delete daily activity
DELETE FROM "type-the-word"."userDailyActivity"
WHERE "userId" = :user_id;

-- Delete chapter progress
DELETE FROM "type-the-word"."userChapterProgress"
WHERE "userId" = :user_id;

-- Delete book progress
DELETE FROM "type-the-word"."userBookProgress"
WHERE "userId" = :user_id;

-- Delete user themes
DELETE FROM "type-the-word"."userTheme"
WHERE "userId" = :user_id;

-- Delete user current theme
DELETE FROM "type-the-word"."userCurrentTheme"
WHERE "userId" = :user_id;

-- Delete user changelog
DELETE FROM "type-the-word"."userChangelog"
WHERE "userId" = :user_id;

-- Finally, delete the user
DELETE FROM "type-the-word"."user"
WHERE "id" = :user_id;

-- Verify deletion (should return 0 rows)
SELECT "id","name","email" FROM "type-the-word"."user" WHERE "id" = :user_id;