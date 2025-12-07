select count(*), u."id", "email", "name" from "typedVerse" tv
                                                  join "user" u on tv."userId" = u."id"
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '8 month'
  AND "createdAt" < CURRENT_DATE
group by u.id

select count(*), u."id", "email" from "typedVerse" tv
                                          join "user" u on tv."userId" = u."id"
-- WHERE "createdAt" >= CURRENT_DATE - INTERVAL '1 month'
group by u.id



select tv."createdAt", "email" from "typedVerse" tv
                                        join "user" u on tv."userId" = u."id"
where u.email = '@gmail.com'
group by tv."createdAt", u.email

select count(*), u."id", "email" from "typingSession" ts
                                          join "user" u on ts."userId" = u."id"
where u.email = '@gmail.com'
group by u.id

select count(*) from "typedVerse" tv
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '10 month'
  AND "createdAt" < CURRENT_DATE



select count(*), date_trunc('month', "createdAt") AS month from "typedVerse" tv group by month;


select *, name as "FirstName", email as "Email Address" from "user" u where u.email = '@gmail.com';

select * from "user" u ;

-- find my accounts

select * from "user" u where u.email like '%josh%';
select * from "user" u where u.email = '@gmail.com';
select * from "user" u where u.email = '@gmail.com';

-- delete a user by email

BEGIN TRANSACTION;

DELETE FROM account a
WHERE a."userId" = (SELECT id FROM "user" WHERE email = '@gmail.com');
DELETE FROM "user"
WHERE id = (SELECT id FROM "user" WHERE email = '@gmail.com');

COMMIT;


-- verses by month

select count(*), date_trunc('month', "createdAt") AS month from "typedVerse" tv
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '20 month'
group by month
order by month


-- verses by user

select count(*), u."id", "email", "name" from "typedVerse" tv
                                                  join "user" u on tv."userId" = u."id"
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '20 month'
  AND "createdAt" < CURRENT_DATE
  and u."id" = 'a81fd49d-5e22-4a44-815f-7ccc1b0e8f1d'
group by u.id
order by count desc



-- new users by month

SELECT
    count(*), date_trunc('month',(SELECT MIN("createdAt")
                                  FROM "typingSession" tv
                                  WHERE tv."userId" = u.id)) AS month
FROM "user" u
group by month
order by month;


-- find users with their createdAt

SELECT
    u.email, u.name,count(*), (SELECT MIN(tv."createdAt")
                               FROM "typingSession" tv
                               WHERE tv."userId" = u.id) AS createdAt
FROM "user" u
         join "typedVerse" tv2 on tv2."userId" = u."id"
group by u.id
order by createdAt desc


-- total verses per month by user

select count(*),  date_trunc('month', "createdAt") as month, u."id", "email", "name" from "typedVerse" tv
                                                                                              join "user" u on tv."userId" = u."id"
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '20 month'
  AND "createdAt" < CURRENT_DATE
group by u.id, month
order by month, count desc


-- total verses

select count(*) from "typedVerse";

-- total users

select count(*) from "user";

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


-- Times the Bible has been typed (31102 total verses)

SELECT 
    count(*) AS typed_verses,
    31102 AS total_bible_verses,
    ROUND(count(*)::numeric / 31102, 2) AS times_bible_typed
FROM "typedVerse";


-- Times each book has been typed (typed verses / total verses in book)

WITH book_totals(book, total_verses) AS (
    VALUES
        ('genesis', 1533), ('exodus', 1213), ('leviticus', 859), ('numbers', 1288),
        ('deuteronomy', 959), ('joshua', 658), ('judges', 618), ('ruth', 85),
        ('1_samuel', 810), ('2_samuel', 695), ('1_kings', 816), ('2_kings', 719),
        ('1_chronicles', 942), ('2_chronicles', 822), ('ezra', 280), ('nehemiah', 406),
        ('esther', 167), ('job', 1070), ('psalm', 2461), ('proverbs', 915),
        ('ecclesiastes', 222), ('song_of_solomon', 117), ('isaiah', 1292), ('jeremiah', 1364),
        ('lamentations', 154), ('ezekiel', 1273), ('daniel', 357), ('hosea', 197),
        ('joel', 73), ('amos', 146), ('obadiah', 21), ('jonah', 48),
        ('micah', 105), ('nahum', 47), ('habakkuk', 56), ('zephaniah', 53),
        ('haggai', 38), ('zechariah', 211), ('malachi', 55), ('matthew', 1071),
        ('mark', 678), ('luke', 1151), ('john', 879), ('acts', 1007),
        ('romans', 433), ('1_corinthians', 437), ('2_corinthians', 257), ('galatians', 149),
        ('ephesians', 155), ('philippians', 104), ('colossians', 95), ('1_thessalonians', 89),
        ('2_thessalonians', 47), ('1_timothy', 113), ('2_timothy', 83), ('titus', 46),
        ('philemon', 25), ('hebrews', 303), ('james', 108), ('1_peter', 105),
        ('2_peter', 61), ('1_john', 105), ('2_john', 13), ('3_john', 15),
        ('jude', 25), ('revelation', 404)
)
SELECT 
    tv.book,
    bt.total_verses,
    count(*) AS typed_verses,
    ROUND(count(*)::numeric / bt.total_verses, 2) AS times_typed
FROM "typedVerse" tv
JOIN book_totals bt ON tv.book::text = bt.book
GROUP BY tv.book, bt.total_verses
ORDER BY times_typed DESC;



