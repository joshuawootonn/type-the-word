import { BuiltinThemeRecord } from '~/server/repositories/builtinTheme.repository'

export function ThemeStyles({
    builtinThemes,
}: {
    builtinThemes: BuiltinThemeRecord[]
}) {
    return (
        <style suppressHydrationWarning>{`
            ${builtinThemes
                .map(
                    t => `
.${t.theme.label.toLowerCase()} {
  --color-primary: ${t.theme.primaryLightness}% ${t.theme.primaryChroma} ${
      t.theme.primaryHue
  };
  --color-secondary: ${t.theme.secondaryLightness}% ${
      t.theme.secondaryChroma
  } ${t.theme.secondaryHue};
  --color-success: ${t.theme.successLightness}% ${t.theme.successChroma} ${
      t.theme.successHue
  };
  --color-error: ${t.theme.errorLightness}% ${t.theme.errorChroma} ${
      t.theme.errorHue
  };
}
`,
                )
                .join('')}
        `}</style>
    )
}
