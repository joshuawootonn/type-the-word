import { BuiltinThemeRecord } from '~/server/repositories/builtinTheme.repository'
import { UserThemeRecord } from '~/server/repositories/userTheme.repository'
import { idToClassName } from './id-to-className'

export function ThemeStyles({
    builtinThemes,
    userThemes,
}: {
    builtinThemes: BuiltinThemeRecord[]
    userThemes: UserThemeRecord[]
}) {
    return (
        <style suppressHydrationWarning>{`
            ${[...builtinThemes, ...userThemes]
                .map(
                    t => `
.${idToClassName(t.themeId)} {
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
