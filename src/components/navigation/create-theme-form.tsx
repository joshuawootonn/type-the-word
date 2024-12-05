import { z } from 'zod'
import { Field, Formik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCreateTheme } from '~/lib/api'
import { ThemeRecord } from '~/server/repositories/theme.repository'
import { ColorInput } from './color-input'
import { FocusEvent, useState } from 'react'
import { themeDTOSchema } from '~/app/api/theme/dto'
import { useSyncedTheme } from './use-synced-theme'

export function getCreateThemeInitialProps(): z.infer<typeof themeSchema> {
    const primary = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')

    const secondary = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--color-secondary')

    const success = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--color-success')
    const error = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--color-error')

    return {
        primary,
        secondary,
        success,
        error,
        label: '',
    }
}

function stringToLCH(myString: string): {
    lightness: number
    chroma: number
    hue: number
} {
    const a = myString.split(' ')

    return {
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        lightness: parseFloat(a.at(0)?.replace('%', '')!),
        chroma: parseFloat(a.at(1)!),
        hue: parseFloat(a.at(2)!),
    }
}

const lchObjectSchema = z.object({
    lightness: z.number(),
    chroma: z.number(),
    hue: z.number(),
})

const lchSchema = z.string().refine(stringLCHValue => {
    const objectLCHValue = stringToLCH(stringLCHValue)
    const result = lchObjectSchema.safeParse(objectLCHValue)

    return result.success
})

export const themeSchema = z.object({
    label: z.string().min(1),
    primary: lchSchema,
    secondary: lchSchema,
    success: lchSchema,
    error: lchSchema,
})

export const themeToDTOSchema = themeSchema.transform(
    (t): z.infer<typeof themeDTOSchema> => {
        const primary = stringToLCH(t.primary)
        const secondary = stringToLCH(t.secondary)
        const success = stringToLCH(t.success)
        const error = stringToLCH(t.error)
        return {
            label: t.label,
            value: t.label
                .split(' ')
                .join('-')
                .replaceAll(/([^_\-a-z])+/g, '')
                .toLowerCase(),
            primaryLightness: primary.lightness,
            primaryChroma: primary.chroma,
            primaryHue: primary.hue,
            secondaryLightness: secondary.lightness,
            secondaryChroma: secondary.chroma,
            secondaryHue: secondary.hue,
            successLightness: success.lightness,
            successChroma: success.chroma,
            successHue: success.hue,
            errorLightness: error.lightness,
            errorChroma: error.chroma,
            errorHue: error.hue,
        }
    },
)

export function CreateThemeForm({
    goBackToSettings,
}: {
    goBackToSettings: () => void
}) {
    const [initialValues] = useState(() => getCreateThemeInitialProps())
    const queryClient = useQueryClient()

    const { setTheme } = useSyncedTheme()
    const createTheme = useMutation({
        mutationFn: fetchCreateTheme,
        onMutate: async nextTheme => {
            await queryClient.cancelQueries({ queryKey: ['themes'] })
            await queryClient.cancelQueries({ queryKey: ['currentTheme'] })

            const prevThemes = queryClient.getQueryData(['themes'])
            const prevCurrentTheme = queryClient.getQueryData(['currentTheme'])

            queryClient.setQueryData(['currentTheme'], () => ({
                currentThemeValue: nextTheme.value,
                userId: '',
            }))

            queryClient.setQueryData(
                ['themes'],
                (prev: ThemeRecord[] | undefined) =>
                    prev
                        ? [...prev, { id: '', userId: '', ...nextTheme }]
                        : [{ id: '', userId: '', ...nextTheme }],
            )

            setTheme(nextTheme.value)

            return { prevThemes, prevCurrentTheme }
        },
        onError: (_err, _theme, context) => {
            queryClient.setQueryData(['themes'], context?.prevThemes ?? [])
            queryClient.setQueryData(
                ['currentTheme'],
                context?.prevCurrentTheme,
            )
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ['themes'] })
            void queryClient.invalidateQueries({ queryKey: ['currentTheme'] })
        },
    })

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={toFormikValidationSchema(themeSchema)}
            onSubmit={values => {
                createTheme.mutate(themeToDTOSchema.parse(values))
                goBackToSettings()
            }}
        >
            {props => (
                <form
                    onSubmit={props.handleSubmit}
                    className="flex flex-col  gap-x-2 gap-y-4 [&>*:nth-child(even)]:justify-self-end"
                >
                    <div className="flex justify-between">
                        <label htmlFor="theme-name" className="pr-4">
                            Theme name:
                        </label>
                        <div>
                            <div className="svg-outline relative">
                                <Field
                                    name="label"
                                    placeholder="Untitled theme"
                                    autoFocus={true}
                                    onFocus={(
                                        e: FocusEvent<HTMLInputElement>,
                                    ) => e.currentTarget.select()}
                                    className={
                                        'w-40 rounded-none border-2 border-primary bg-secondary p-1 font-medium text-primary outline-none placeholder:text-primary/50'
                                    }
                                    id="theme-name"
                                    autoComplete="off"
                                    data-1p-ignore={true}
                                />
                            </div>
                            {props.errors.label && (
                                <div className="mt-2 text-right text-error">
                                    {JSON.stringify(props.errors)}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <label htmlFor="primary" className="pr-4">
                            Primary Hue
                        </label>
                        <ColorInput id="primary" name="primary" />
                    </div>
                    <div className="flex justify-between">
                        <label htmlFor="secondary" className="pr-4">
                            Secondary Hue
                        </label>
                        <ColorInput id="secondary" name="secondary" />
                    </div>
                    <div className="flex justify-between">
                        <label htmlFor="success" className="pr-4">
                            Success Hue
                        </label>
                        <ColorInput id="success" name="success" />
                    </div>
                    <div className="flex justify-between">
                        <label htmlFor="error" className="pr-4">
                            Error Hue
                        </label>
                        <ColorInput id="error" name="error" />
                    </div>
                    <button
                        type="submit"
                        className="svg-outline relative col-span-2 border-2 border-primary px-3 py-1 font-semibold text-primary"
                    >
                        Save{' '}
                    </button>
                    <input className="hidden" type="submit" />
                </form>
            )}
        </Formik>
    )
}
