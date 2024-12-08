CREATE TABLE IF NOT EXISTS "type-the-word"."userTheme" (
	"userId" varchar(255) PRIMARY KEY NOT NULL,
	"currentThemeValue" varchar(255),
	"currentDarkTheme" varchar(255),
	"currentLightTheme" varchar(255)
);
