"use client"

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip"
import clsx from "clsx"
import { forwardRef, ComponentPropsWithoutRef, ElementRef } from "react"

const TooltipProvider = BaseTooltip.Provider
const Tooltip = BaseTooltip.Root
const TooltipTrigger = BaseTooltip.Trigger

type TooltipContentProps = ComponentPropsWithoutRef<
    typeof BaseTooltip.Popup
> & {
    side?: ComponentPropsWithoutRef<typeof BaseTooltip.Positioner>["side"]
    align?: ComponentPropsWithoutRef<typeof BaseTooltip.Positioner>["align"]
    sideOffset?: ComponentPropsWithoutRef<
        typeof BaseTooltip.Positioner
    >["sideOffset"]
}

const TooltipContent = forwardRef<
    ElementRef<typeof BaseTooltip.Popup>,
    TooltipContentProps
>(
    (
        {
            className,
            side = "top",
            align = "center",
            sideOffset = 6,
            children,
            ...props
        },
        ref,
    ) => (
        <BaseTooltip.Portal>
            <BaseTooltip.Positioner
                side={side}
                align={align}
                sideOffset={sideOffset}
            >
                <BaseTooltip.Popup
                    ref={ref}
                    className={clsx(
                        "border-primary bg-secondary text-primary z-50 border-2 px-2 py-1 text-xs",
                        className,
                    )}
                    {...props}
                >
                    {children}
                    <BaseTooltip.Arrow className="border-primary bg-secondary h-2 w-2 translate-y-px rotate-45 border-r-2 border-b-2" />
                </BaseTooltip.Popup>
            </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
    ),
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
