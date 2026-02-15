import type { MDXComponents } from "mdx/types"
import type { ComponentPropsWithoutRef, ReactElement } from "react"

type HeadingTwoProps = ComponentPropsWithoutRef<"h2">
type HeadingThreeProps = ComponentPropsWithoutRef<"h3">

function HeadingAnchorIcon(): ReactElement {
    return (
        <svg
            aria-hidden
            viewBox="0 0 256 256"
            className="h-4 w-4"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M117.6 174.4L81.6 210.4C63.9 228.1 35.1 228.1 17.4 210.4C-0.3 192.7 -0.3 163.9 17.4 146.2L53.4 110.2"
                stroke="currentColor"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M138.4 81.6L174.4 45.6C192.1 27.9 220.9 27.9 238.6 45.6C256.3 63.3 256.3 92.1 238.6 109.8L202.6 145.8"
                stroke="currentColor"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M92 164L164 92"
                stroke="currentColor"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function DocsHeadingTwo({ id, ...props }: HeadingTwoProps): ReactElement {
    const { className, children, ...rest } = props

    if (!id) {
        return (
            <h2 className={className} {...rest}>
                {children}
            </h2>
        )
    }

    return (
        <div id={id} className="group/heading scroll-mt-24">
            <h2 className={className} {...rest}>
                <a
                    href={`#${id}`}
                    className="group/link relative -ml-6 inline-block pl-6 no-underline"
                >
                    <span className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 opacity-0 transition-opacity group-hover/link:opacity-100 group-focus-visible/link:opacity-100">
                        <HeadingAnchorIcon />
                    </span>
                    {children}
                </a>
            </h2>
        </div>
    )
}

function DocsHeadingThree({ id, ...props }: HeadingThreeProps): ReactElement {
    const { className, children, ...rest } = props

    if (!id) {
        return (
            <h3 className={className} {...rest}>
                {children}
            </h3>
        )
    }

    return (
        <div id={id} className="group/heading scroll-mt-24">
            <h3 className={className} {...rest}>
                <a
                    href={`#${id}`}
                    className="group/link relative -ml-6 inline-block pl-6 no-underline"
                >
                    <span className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 opacity-0 transition-opacity group-hover/link:opacity-100 group-focus-visible/link:opacity-100">
                        <HeadingAnchorIcon />
                    </span>
                    {children}
                </a>
            </h3>
        </div>
    )
}

export const docsMdxComponents: MDXComponents = {
    a: props => {
        const href = props.href ?? ""
        const isExternal =
            href.startsWith("http://") || href.startsWith("https://")

        return (
            <a
                {...props}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
            />
        )
    },
    h2: DocsHeadingTwo,
    h3: DocsHeadingThree,
}
