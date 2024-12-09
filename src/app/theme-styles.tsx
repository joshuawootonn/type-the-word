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
            @keyframes bibleAnimation {
                from {
                    mask-position: 0px 0;
                }
                to {
                    mask-position: -741px 0;
                }
            }
            .icon {
                display: block;
                transform: translateY(1px);
                width: 39px;
                height: 33px;
            }
            .animated-icon {
                display: none;
                transform: translateY(1px);
                width: 39px;
                height: 33px;
                background-color: oklch(var(--color-primary));
                -webkit-mask-image: url('/bible.svg');
                mask-image: url('/bible.svg');
                mask-repeat: no-repeat;
                mask-position: -741px 0;
            }
            .link:hover .icon,
            .link:focus-visible .icon {
                display: none;
            }
            .link:hover .animated-icon,
            .link:focus-visible .animated-icon {
                display: block;
                animation: bibleAnimation 0.6s steps(20, jump-none) forwards;
            }
        `}</style>
    )
}
