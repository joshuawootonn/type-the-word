-- Inspect user before clearing history (optional)
SELECT "id","name","email"
FROM "type-the-word"."user"
WHERE "email" = :user_email;

-- Preview what will be deleted (optional)
SELECT
  (SELECT COUNT(*) FROM "type-the-word"."typedVerse"
   WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email)) AS typed_verses,
  (SELECT COUNT(*) FROM "type-the-word"."typingSession"
   WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email)) AS typing_sessions,
  (SELECT COUNT(*) FROM "type-the-word"."userDailyActivity"
   WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email)) AS user_daily_activity,
  (SELECT COUNT(*) FROM "type-the-word"."userBookProgress"
   WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email)) AS user_book_progress,
  (SELECT COUNT(*) FROM "type-the-word"."userChapterProgress"
   WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email)) AS user_chapter_progress;

-- Delete typed verses
DELETE FROM "type-the-word"."typedVerse"
WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email);

-- Delete typing sessions
DELETE FROM "type-the-word"."typingSession"
WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email);

-- Delete daily activity cache
DELETE FROM "type-the-word"."userDailyActivity"
WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email);

-- Delete chapter progress cache
DELETE FROM "type-the-word"."userChapterProgress"
WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email);

-- Delete book progress cache
DELETE FROM "type-the-word"."userBookProgress"
WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email);

-- Verify deletion (counts should be 0)
SELECT
  (SELECT COUNT(*) FROM "type-the-word"."typedVerse"
   WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email)) AS typed_verses,
  (SELECT COUNT(*) FROM "type-the-word"."typingSession"
   WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email)) AS typing_sessions,
  (SELECT COUNT(*) FROM "type-the-word"."userDailyActivity"
   WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email)) AS user_daily_activity,
  (SELECT COUNT(*) FROM "type-the-word"."userBookProgress"
   WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email)) AS user_book_progress,
  (SELECT COUNT(*) FROM "type-the-word"."userChapterProgress"
   WHERE "userId" IN (SELECT "id" FROM "type-the-word"."user" WHERE "email" = :user_email)) AS user_chapter_progress;
