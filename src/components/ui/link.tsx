import clsx from "clsx"
import NextLink from "next/link"
import { forwardRef, ComponentPropsWithoutRef, ElementRef } from "react"

const Link = forwardRef<
    ElementRef<typeof NextLink>,
    ComponentPropsWithoutRef<typeof NextLink> & {
        variant?: "button" | "text"
    }
>(({ className, variant = "button", ...props }, ref) => {
    if (variant === "text") {
        return (
            <NextLink
                ref={ref}
                className={clsx(
                    "text-primary no-underline hover:underline",
                    className,
                )}
                {...props}
            />
        )
    }

    // button variant (default)
    return (
        <NextLink
            ref={ref}
            className={clsx(
                "svg-outline relative inline-block border-2 border-primary bg-secondary px-3 py-1 font-medium text-primary no-underline",
                className,
            )}
            {...props}
        />
    )
})
Link.displayName = "Link"

export { Link }
