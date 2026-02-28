-- specific-user-usage.sql
-- Set the email below, then run this file top-to-bottom.

DROP TABLE IF EXISTS _usage_target_email;
CREATE TEMP TABLE _usage_target_email (
    email text PRIMARY KEY
);

INSERT INTO _usage_target_email (email)
VALUES ('');

DROP TABLE IF EXISTS _usage_target_user;
CREATE TEMP TABLE _usage_target_user AS
SELECT
    u.id,
    u.email,
    u.name,
    u."createdAt"
FROM "user" u
JOIN _usage_target_email p ON p.email = u.email
LIMIT 1;

-- 1) Confirm selected user
SELECT * FROM _usage_target_user;

-- 2) Warn if no user matches the configured email
SELECT 'No user found for configured email. Update _usage_target_email and rerun.' AS message
WHERE NOT EXISTS (SELECT 1 FROM _usage_target_user);

-- 3) User-level totals and first/last activity
SELECT
    tu.id AS user_id,
    tu.email,
    tu.name,
    tu."createdAt" AS user_created_at,
    (SELECT COUNT(*) FROM "typedVerse" tv WHERE tv."userId" = tu.id) AS total_typed_verses,
    (SELECT COUNT(*) FROM "typingSession" ts WHERE ts."userId" = tu.id) AS total_typing_sessions,
    (SELECT COUNT(DISTINCT tv."typingSessionId") FROM "typedVerse" tv WHERE tv."userId" = tu.id) AS sessions_with_verses,
    (SELECT MIN(tv."createdAt") FROM "typedVerse" tv WHERE tv."userId" = tu.id) AS first_typed_at,
    (SELECT MAX(tv."createdAt") FROM "typedVerse" tv WHERE tv."userId" = tu.id) AS last_typed_at,
    (SELECT MIN(ts."createdAt") FROM "typingSession" ts WHERE ts."userId" = tu.id) AS first_session_at,
    (SELECT MAX(ts."createdAt") FROM "typingSession" ts WHERE ts."userId" = tu.id) AS last_session_at
FROM _usage_target_user tu;

-- 4) Daily verse counts for the last 30 days
SELECT
    date_trunc('day', tv."createdAt")::date AS day,
    COUNT(*) AS typed_verse_count
FROM "typedVerse" tv
JOIN _usage_target_user tu ON tu.id = tv."userId"
WHERE tv."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
  AND tv."createdAt" < CURRENT_DATE + INTERVAL '1 day'
GROUP BY day
ORDER BY day DESC;

-- 5) Monthly verse counts for the last 12 months
SELECT
    date_trunc('month', tv."createdAt")::date AS month,
    COUNT(*) AS typed_verse_count
FROM "typedVerse" tv
JOIN _usage_target_user tu ON tu.id = tv."userId"
WHERE tv."createdAt" >= CURRENT_DATE - INTERVAL '12 months'
  AND tv."createdAt" < CURRENT_DATE + INTERVAL '1 day'
GROUP BY month
ORDER BY month DESC;

-- 6) Daily typing session counts for the last 30 days
SELECT
    date_trunc('day', ts."createdAt")::date AS day,
    COUNT(*) AS typing_session_count
FROM "typingSession" ts
JOIN _usage_target_user tu ON tu.id = ts."userId"
WHERE ts."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
  AND ts."createdAt" < CURRENT_DATE + INTERVAL '1 day'
GROUP BY day
ORDER BY day DESC;

-- 7) Book-level usage totals
SELECT
    tv.book,
    COUNT(*) AS typed_verse_count,
    MAX(tv."createdAt") AS last_typed_at
FROM "typedVerse" tv
JOIN _usage_target_user tu ON tu.id = tv."userId"
GROUP BY tv.book
ORDER BY typed_verse_count DESC, tv.book;

-- 8) Translation-level usage totals
SELECT
    tv.translation,
    COUNT(*) AS typed_verse_count,
    MAX(tv."createdAt") AS last_typed_at
FROM "typedVerse" tv
JOIN _usage_target_user tu ON tu.id = tv."userId"
GROUP BY tv.translation
ORDER BY typed_verse_count DESC, tv.translation;

-- 9) Unique verse coverage for this user
SELECT
    COUNT(*) AS total_typed_verses,
    COUNT(DISTINCT (tv.translation, tv.book, tv.chapter, tv.verse)) AS unique_typed_verses
FROM "typedVerse" tv
JOIN _usage_target_user tu ON tu.id = tv."userId";

-- 10) How many times this user has typed through the full Bible
SELECT
    COUNT(*) AS typed_verses,
    31102 AS total_bible_verses,
    ROUND(COUNT(*)::numeric / 31102, 2) AS times_bible_typed
FROM "typedVerse" tv
JOIN _usage_target_user tu ON tu.id = tv."userId";

-- 11) Most recent typed verses (latest 50 rows)
SELECT
    tv."createdAt",
    tv.translation,
    tv.book,
    tv.chapter,
    tv.verse,
    tv."typingSessionId",
    tv."classroomAssignmentId"
FROM "typedVerse" tv
JOIN _usage_target_user tu ON tu.id = tv."userId"
ORDER BY tv."createdAt" DESC
LIMIT 50;

-- 12) Most recent typing sessions with verse counts (latest 50 rows)
SELECT
    ts.id AS typing_session_id,
    ts."createdAt" AS session_created_at,
    COUNT(tv.id) AS typed_verse_count
FROM "typingSession" ts
JOIN _usage_target_user tu ON tu.id = ts."userId"
LEFT JOIN "typedVerse" tv
    ON tv."typingSessionId" = ts.id
   AND tv."userId" = ts."userId"
GROUP BY ts.id, ts."createdAt"
ORDER BY ts."createdAt" DESC
LIMIT 50;

-- 13) Current and longest active-day streak based on typed verses
WITH active_days AS (
    SELECT DISTINCT tv."createdAt"::date AS day
    FROM "typedVerse" tv
    JOIN _usage_target_user tu ON tu.id = tv."userId"
),
ordered_days AS (
    SELECT
        day,
        day - (ROW_NUMBER() OVER (ORDER BY day))::int AS streak_group
    FROM active_days
),
streaks AS (
    SELECT
        MIN(day) AS start_day,
        MAX(day) AS end_day,
        COUNT(*) AS day_count
    FROM ordered_days
    GROUP BY streak_group
),
current_streak AS (
    SELECT day_count
    FROM streaks
    WHERE end_day = CURRENT_DATE
       OR end_day = CURRENT_DATE - 1
    ORDER BY end_day DESC
    LIMIT 1
),
longest_streak AS (
    SELECT MAX(day_count) AS day_count
    FROM streaks
)
SELECT
    COALESCE((SELECT day_count FROM current_streak), 0) AS current_streak_days,
    COALESCE((SELECT day_count FROM longest_streak), 0) AS longest_streak_days;
