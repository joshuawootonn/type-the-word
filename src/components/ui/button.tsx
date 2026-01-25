"use client"

import { Button as BaseButton } from "@base-ui/react/button"
import {
    forwardRef,
    ComponentPropsWithoutRef,
    ElementRef,
    ReactNode,
    ButtonHTMLAttributes,
} from "react"

import { Loading } from "~/components/loading"
import { cn } from "~/lib/cn"

type BaseButtonProps = ComponentPropsWithoutRef<typeof BaseButton>

// Conditional type: if isLoading is provided, loadingLabel is REQUIRED
type ButtonProps = Omit<
    BaseButtonProps,
    "disabled" | "children" | "className"
> &
    Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type"> &
    (
        | {
              children: ReactNode
              isLoading: boolean
              loadingLabel: string
              disabled?: boolean
              className?: string
          }
        | {
              children: ReactNode
              isLoading?: never
              loadingLabel?: never
              disabled?: boolean
              className?: string
          }
    )

const Button = forwardRef<ElementRef<typeof BaseButton>, ButtonProps>(
    (
        {
            className,
            children,
            disabled,
            type,
            isLoading,
            loadingLabel,
            ...props
        },
        ref,
    ) => {
        return (
            <BaseButton
                ref={ref}
                disabled={isLoading || disabled}
                className={cn(
                    "svg-outline relative border-2 border-primary bg-secondary px-3 py-1 font-semibold disabled:cursor-wait",
                    className,
                )}
                {...props}
                {...(type && { type })}
            >
                {isLoading ? (
                    <Loading
                        className="text-md font-medium"
                        initialDots={1}
                        label={loadingLabel}
                    />
                ) : (
                    children
                )}
            </BaseButton>
        )
    },
)
Button.displayName = "Button"

export { Button }
