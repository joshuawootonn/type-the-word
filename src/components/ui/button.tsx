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

type LoadingProps =
    | {
          isLoading: boolean
          loadingLabel: string
      }
    | {
          isLoading?: undefined
      }

type ButtonProps = Omit<
    BaseButtonProps,
    "disabled" | "children" | "className"
> &
    Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
        children: ReactNode
        disabled?: boolean
        className?: string
    } & LoadingProps

const Button = forwardRef<ElementRef<typeof BaseButton>, ButtonProps>(
    ({ className, children, disabled, type, ...props }, ref) => {
        return (
            <BaseButton
                ref={ref}
                disabled={props.isLoading || disabled}
                className={cn(
                    "svg-outline relative border-2 border-primary bg-secondary px-3 py-1 font-semibold disabled:cursor-wait",
                    className,
                )}
                {...props}
                {...(type && { type })}
            >
                {props.isLoading ? (
                    <Loading
                        initialDots={1}
                        className="text-sm font-normal"
                        label={props.loadingLabel}
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
