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



