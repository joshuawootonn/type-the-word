import { z } from 'zod'
import { Field, Formik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCreateTheme } from '~/lib/api'
import { ThemeRecord } from '~/server/repositories/theme.repository'
import { ColorInput } from './color-input'
import { FocusEvent, useState } from 'react'
import { useThemes } from '~/app/providers'
import { themeDTOSchema } from '~/app/api/theme/dto'

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
            value: t.label.split(' ').join('-').toLowerCase(),
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
    selectTheme,
}: {
    selectTheme: (theme: string) => void
}) {
    const [initialValues] = useState(() => getCreateThemeInitialProps())
    const queryClient = useQueryClient()

    const { themes, updateThemes } = useThemes()
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

            updateThemes([...themes, nextTheme.value])
            selectTheme(nextTheme.value)

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
                console.log('submitted')
                createTheme.mutate(themeToDTOSchema.parse(values))
            }}
        >
            {props => (
                <form
                    onSubmit={props.handleSubmit}
                    className="col-2 grid grid-cols-2 items-center gap-x-2 gap-y-4 [&>*:nth-child(even)]:justify-self-end"
                >
                    <label htmlFor="theme-name" className="pr-4">
                        Theme name:
                    </label>
                    <div className="svg-outline relative">
                        <Field
                            name="label"
                            placeholder="Untitled theme"
                            autoFocus={true}
                            onFocus={(e: FocusEvent<HTMLInputElement>) =>
                                e.currentTarget.select()
                            }
                            className={
                                'w-40 rounded-none border-2 border-primary bg-secondary p-1 font-medium text-primary outline-none placeholder:text-primary/50'
                            }
                            id="theme-name"
                            autoComplete="off"
                            data-1p-ignore={true}
                        />
                    </div>
                    <ColorInput label="Primary Hue" name="primary" />
                    <ColorInput label="Secondary Hue" name="secondary" />
                    <ColorInput label="Success Hue" name="success" />
                    <ColorInput label="Error Hue" name="error" />
                    {/* {JSON.stringify(props.values)} */}
                    {JSON.stringify(props.errors)}
                    <button
                        type="submit"
                        className="svg-outline relative col-span-2 border-2 border-primary px-3 py-1 font-semibold text-primary"
                    >
                        Save{' '}
                    </button>
                    {/* <input className="hidden" type="submit" /> */}
                </form>
            )}
        </Formik>
    )
}
