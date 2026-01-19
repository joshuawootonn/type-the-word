import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Field, Formik } from "formik"
import { FocusEvent, useState } from "react"
import { z } from "zod"

import { useTheme } from "~/app/theme-provider"
import { fetchCreateTheme } from "~/lib/api"
import { useAnalytics } from "~/lib/hooks/useAnalytics"
import {
    cleanUpdateDocumentStyles,
    getCSSVarValue,
    injectNewClassIntoStyle,
} from "~/lib/theme/dom"
import {
    isThemeDark,
    oklchSchema,
    oklchToString,
    stringToOKLCH,
} from "~/lib/theme/lch"
import {
    BuiltinThemeRecord,
    ThemeRecord,
} from "~/server/repositories/builtinTheme.repository"

import { ColorInput } from "./color-input"

export const formSchema = z.object({
    label: z
        .string({ required_error: "Name is required" })
        .min(1, "Name is required"),
    primary: oklchSchema,
    secondary: oklchSchema,
    success: oklchSchema,
    error: oklchSchema,
})

export const themeToDTOSchema = formSchema.transform(
    (t): Omit<ThemeRecord, "id"> => {
        const primary = stringToOKLCH(t.primary)
        const secondary = stringToOKLCH(t.secondary)
        const success = stringToOKLCH(t.success)
        const error = stringToOKLCH(t.error)
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

export function getCreateThemeInitialProps(
    firstBuiltinTheme: BuiltinThemeRecord,
): z.infer<typeof formSchema> {
    const primary =
        getCSSVarValue("--color-primary") ||
        oklchToString({
            lightness: firstBuiltinTheme.theme.primaryLightness,
            chroma: firstBuiltinTheme.theme.primaryChroma,
            hue: firstBuiltinTheme.theme.primaryHue,
        })
    const secondary =
        getCSSVarValue("--color-secondary") ||
        oklchToString({
            lightness: firstBuiltinTheme.theme.secondaryLightness,
            chroma: firstBuiltinTheme.theme.secondaryChroma,
            hue: firstBuiltinTheme.theme.secondaryHue,
        })
    const success =
        getCSSVarValue("--color-success") ||
        oklchToString({
            lightness: firstBuiltinTheme.theme.successLightness,
            chroma: firstBuiltinTheme.theme.successChroma,
            hue: firstBuiltinTheme.theme.successHue,
        })
    const error =
        getCSSVarValue("--color-error") ||
        oklchToString({
            lightness: firstBuiltinTheme.theme.errorLightness,
            chroma: firstBuiltinTheme.theme.errorChroma,
            hue: firstBuiltinTheme.theme.errorHue,
        })

    return {
        primary,
        secondary,
        success,
        error,
        label: "",
    }
}

export function CreateThemeForm({
    builtinThemes,
    goBackToSettings,
}: {
    builtinThemes: BuiltinThemeRecord[]
    goBackToSettings: () => void
}) {
    const [initialValues] = useState(() =>
        getCreateThemeInitialProps(builtinThemes.at(0)!),
    )
    const queryClient = useQueryClient()
    const { trackThemeCreated } = useAnalytics()

    const { currentTheme, setTheme } = useTheme()
    const [generalError, setGeneralError] = useState<string | null>(null)
    const { mutate, isPending } = useMutation({
        mutationFn: fetchCreateTheme,
        onSuccess: async data => {
            trackThemeCreated({
                theme_name: data.theme.label,
            })
            injectNewClassIntoStyle(data.theme)
            await queryClient.invalidateQueries({ queryKey: ["userThemes"] })

            let nextLightThemeId: string | null = null
            let nextDarkThemeId: string | null = null

            nextLightThemeId =
                currentTheme.colorScheme === "light"
                    ? data.themeId
                    : currentTheme.colorScheme === "system"
                      ? !isThemeDark(data.theme)
                          ? data.themeId
                          : currentTheme.lightThemeId
                      : null

            nextDarkThemeId =
                currentTheme.colorScheme === "dark"
                    ? data.themeId
                    : currentTheme.colorScheme === "system"
                      ? isThemeDark(data.theme)
                          ? data.themeId
                          : currentTheme.darkThemeId
                      : null

            setTheme({
                colorScheme: currentTheme.colorScheme,
                darkThemeId: nextDarkThemeId,
                lightThemeId: nextLightThemeId,
            })

            goBackToSettings()
            cleanUpdateDocumentStyles()
        },
    })

    return (
        <Formik
            initialValues={initialValues}
            validate={async values => {
                const result = await formSchema.safeParseAsync(values)
                if (!result.success) {
                    const errors: Record<string, string> = {}

                    for (const x of result.error.errors) {
                        errors[x.path.filter(Boolean).join(".")] = x.message
                    }

                    return errors
                }
            }}
            onSubmit={values => {
                try {
                    setGeneralError(null)
                    const dto = themeToDTOSchema.parse(values)
                    mutate(dto)
                } catch (_) {
                    setGeneralError("Whoops something went wrong!")
                }
            }}
        >
            {props => (
                <form
                    onSubmit={props.handleSubmit}
                    className="flex flex-col gap-x-2 gap-y-4 [&>*:nth-child(even)]:justify-self-end"
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
                                        "w-40 rounded-none border-2 border-primary bg-secondary p-1 font-medium text-primary outline-none placeholder:text-primary/50"
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
                            <span className="correct">rd is my</span>{" "}
                            <span className="extra">Shepherd</span>
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
                        disabled={isPending}
                    >
                        {isPending ? "Loading..." : "Save"}
                    </button>
                    <input className="hidden" type="submit" />
                </form>
            )}
        </Formik>
    )
}
