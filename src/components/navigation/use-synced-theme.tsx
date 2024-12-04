import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { UseThemeProps } from 'next-themes/dist/types'
import { fetchSetCurrentTheme } from '~/lib/api'

export function useSyncedTheme(): UseThemeProps {
    const queryClient = useQueryClient()
    const { theme, ...rest } = useTheme()
    console.log('test', rest.themes)

    const setCurrentTheme = useMutation({
        mutationFn: fetchSetCurrentTheme,
        onMutate: async nextCurrentTheme => {
            await queryClient.cancelQueries({ queryKey: ['currentTheme'] })

            const prevCurrentTheme = queryClient.getQueryData(['currentTheme'])

            queryClient.setQueryData(['currentTheme'], nextCurrentTheme)

            return { prevCurrentTheme, nextCurrentTheme }
        },
        onError: (_err, _newTodo, context) => {
            queryClient.setQueryData(
                ['currentTheme'],
                context?.prevCurrentTheme,
            )
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: ['currentTheme'] }),
    })

    function setTheme(nextTheme: string | ((theme: string) => string)) {
        const value =
            typeof nextTheme === 'function'
                ? nextTheme(theme ?? 'system')
                : nextTheme

        rest.setTheme(value)

        setCurrentTheme.mutate({
            currentThemeValue: value,
            currentDarkThemeId: null,
            currentLightThemeId: null,
        })
    }

    return {
        ...rest,
        theme,
        setTheme,
    }
}
