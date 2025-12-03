select count(*) from "typedVerse"
where "typedVerse"."typingData" is not null



-- Verse counts for the last ten days

SELECT
    date_trunc('day', "createdAt")::date AS day,
    count(*) AS verse_count,
    count(DISTINCT "userId") AS user_count
FROM "typedVerse" tv
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '10 days'
  AND "createdAt" < CURRENT_DATE + INTERVAL '1 day'
GROUP BY day
ORDER BY day DESC;


