import { z } from 'zod'
import { Field, Formik } from 'formik'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ColorInput } from './color-input'
import { FocusEvent, useState } from 'react'
import { ThemeRecord } from '~/server/repositories/builtinTheme.repository'
import { useTheme } from '~/app/theme-provider'
import { fetchCreateTheme } from '~/lib/api'
import { themeCSS } from '~/app/theme-styles'
import { isThemeDark } from '~/lib/theme-helpers'

export function cleanUpdateDocumentStyles() {
    document.documentElement.style.removeProperty(`--color-primary`)
    document.documentElement.style.removeProperty(`--color-secondary`)
    document.documentElement.style.removeProperty(`--color-success`)
    document.documentElement.style.removeProperty(`--color-error`)
}

function injectNewClassIntoStyle(theme: ThemeRecord) {
    const el = document.getElementById('themes')
    console.log(el)
    if (el == null) return

    el.innerHTML += themeCSS({ theme })
}

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

function labelToValue(label: string) {
    return label
        .split(' ')
        .join('-')
        .replaceAll(/([^_\-a-z])+/g, '')
        .toLowerCase()
}

export const themeSchema = z.object({
    label: z
        .string({ required_error: 'Name is required' })
        .min(1, 'Name is required')
        .refine(
            val => labelToValue(val).length > 0,
            'Name must include at least 1 letter',
        ),

    primary: lchSchema,
    secondary: lchSchema,
    success: lchSchema,
    error: lchSchema,
})

export const themeToDTOSchema = themeSchema.transform(
    (t): Omit<ThemeRecord, 'id'> => {
        const primary = stringToLCH(t.primary)
        const secondary = stringToLCH(t.secondary)
        const success = stringToLCH(t.success)
        const error = stringToLCH(t.error)
        return {
            label: t.label,
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

    const { setTheme } = useTheme()
    const [generalError, setGeneralError] = useState<string | null>(null)
    const { mutate, isLoading } = useMutation({
        mutationFn: fetchCreateTheme,
        onSuccess: async data => {
            injectNewClassIntoStyle(data.theme)
            await queryClient.invalidateQueries(['userThemes'])
            if (isThemeDark(data.theme)) {
                setTheme({
                    colorScheme: 'dark',
                    darkThemeId: data.themeId,
                    lightThemeId: null,
                })
            } else {
                setTheme({
                    colorScheme: 'light',
                    lightThemeId: data.themeId,
                    darkThemeId: null,
                })
            }

            goBackToSettings()
            cleanUpdateDocumentStyles()
        },
    })

    return (
        <Formik
            initialValues={initialValues}
            validate={async values => {
                const result = await themeSchema.safeParseAsync(values)
                if (!result.success) {
                    const errors: Record<string, string> = {}

                    for (const x of result.error.errors) {
                        errors[x.path.filter(Boolean).join('.')] = x.message
                    }

                    return errors
                }
            }}
            onSubmit={values => {
                try {
                    setGeneralError(null)
                    const dto = themeToDTOSchema.parse(values)
                    mutate(dto)
                } catch (e) {
                    setGeneralError('Whoops something went wrong!')
                }
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
                        <div className="flex flex-col items-end">
                            <div className="svg-outline-within relative">
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
                            {props.errors.label && props.submitCount > 0 && (
                                <div className="mt-2 text-right text-error">
                                    {props.errors.label}
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

                    <div className="flex flex-col items-start justify-start">
                        <div className="-mb-0.5 border-2 border-primary px-2 text-lg">
                            Preview
                        </div>
                        <p className="prose w-full border-2 border-primary p-3 text-primary">
                            <span className="correct">The L</span>
                            <span className="incorrect">o</span>
                            <span className="correct">rd is my</span>
                            <span className="extra">Sheppard</span>
                            <span> I shall not want.</span>
                        </p>
                    </div>
                    {generalError && props.submitCount > 0 && (
                        <div className="text-right text-error">
                            {generalError}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="svg-outline relative col-span-2 border-2 border-primary px-3 py-1 font-semibold text-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Save'}
                    </button>
                    <input className="hidden" type="submit" />
                </form>
            )}
        </Formik>
    )
}
