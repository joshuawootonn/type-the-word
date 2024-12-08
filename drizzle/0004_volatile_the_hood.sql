CREATE TABLE IF NOT EXISTS "type-the-word"."userCurrentTheme" (
	"userId" varchar(255) NOT NULL,
	"colorScheme" varchar(255) NOT NULL,
	"lightThemeId" varchar(255) NOT NULL,
	"darkThemeId" varchar(255) NOT NULL,
	CONSTRAINT "schemeToThemeCheck" CHECK (
        ("type-the-word"."userCurrentTheme"."colorScheme" = 'system' AND "type-the-word"."userCurrentTheme"."lightThemeId" IS NOT NULL AND "type-the-word"."userCurrentTheme"."darkThemeId" IS NOT NULL) OR
        ("type-the-word"."userCurrentTheme"."colorScheme" = 'light' AND "type-the-word"."userCurrentTheme"."lightThemeId" IS NOT NULL AND "type-the-word"."userCurrentTheme"."darkThemeId" IS NULL) OR
        ("type-the-word"."userCurrentTheme"."colorScheme" = 'dark' AND "type-the-word"."userCurrentTheme"."lightThemeId" IS NULL AND "type-the-word"."userCurrentTheme"."darkThemeId" IS NOT NULL)
        )
);
