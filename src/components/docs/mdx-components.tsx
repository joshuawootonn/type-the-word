import type { MDXComponents } from "mdx/types"
import type { ComponentPropsWithoutRef, ReactElement } from "react"

import { LinkSimple } from "@phosphor-icons/react/dist/ssr"

type HeadingTwoProps = ComponentPropsWithoutRef<"h2">
type HeadingThreeProps = ComponentPropsWithoutRef<"h3">

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
                    <span className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 opacity-0 group-hover/link:opacity-100 group-focus-visible/link:opacity-100">
                        <LinkSimple aria-hidden size={16} weight="regular" />
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
                    <span className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 opacity-0 group-hover/link:opacity-100 group-focus-visible/link:opacity-100">
                        <LinkSimple aria-hidden size={16} weight="regular" />
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
