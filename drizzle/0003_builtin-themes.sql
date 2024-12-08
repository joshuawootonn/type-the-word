INSERT INTO "type-the-word"."theme" (
"id",
	"label",
	"primaryLightness",
	"primaryChroma",
	"primaryHue",
	"secondaryLightness",
	"secondaryChroma",
	"secondaryHue",
	"successLightness",
	"successChroma",
	"successHue",
	"errorLightness",
	"errorChroma",
	"errorHue"
) VALUES (gen_random_uuid(), 'Light', '0', '0', '0', '100','0','0', '56.53', '0.1293', '157.54', '51.43', '0.1923', '6.1'),
(gen_random_uuid(), 'Dark', '100', '0', '0', '0','0','0', '56.53', '0.1293', '157.54', '51.43', '0.1923', '6.1')
RETURNING id;

INSERT INTO "type-the-word"."builtinTheme" (SELECT "id" FROM "type-the-word"."theme")
