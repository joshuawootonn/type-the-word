"use client"

import type { ReactElement } from "react"

import Link from "next/link"

import { cn } from "~/lib/cn"

export function DocsLogo({ className }: { className?: string }): ReactElement {
    return (
        <>
            <style jsx global>{`
                @keyframes docsBibleAnimation {
                    from {
                        mask-position: 0px 0;
                    }
                    to {
                        mask-position: -741px 0;
                    }
                }
                
                .docs-logo-animated-icon {
                    background-color: oklch(var(--oklch-primary));
                    -webkit-mask-image: url("/bible.svg");
                    mask-image: url("/bible.svg");
                    mask-repeat: no-repeat;
                    mask-position: -741px 0;
                }
                
                .docs-logo-link:hover .docs-logo-icon,
                .docs-logo-link:focus-visible .docs-logo-icon {
                    display: none;
                }
                
                .docs-logo-link:hover .docs-logo-animated-icon,
                .docs-logo-link:focus-visible .docs-logo-animated-icon {
                    display: block;
                    animation: docsBibleAnimation 0.6s steps(20, jump-none) forwards;
                }
            `}</style>
            <Link
                href="/"
                className={cn(
                    "docs-logo-link svg-outline relative flex items-center gap-1 no-underline",
                    className,
                )}
                aria-label="Type the Word home"
            >
                <span className="text-xl font-semibold">
                    <span className="text-primary/50">Type th</span>
                    <span className="text-primary relative">
                        <span className="absolute -left-[3px] scale-y-125 font-normal">
                            |
                        </span>
                        e Word
                    </span>
                </span>
                <svg
                    width="39"
                    height="33"
                    viewBox="0 0 39 33"
                    fill="none"
                    className="docs-logo-icon stroke-primary block h-[33px] w-[39px]"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M19.7754 5.04895V31.7156M23.6464 6.59934H33.3238M23.6464 10.6303L31.6577 10.6303M23.6464 14.6614H33.3238M23.6464 18.6924L29.8873 18.6924M23.6464 22.4133H33.3238M6.22705 6.59934L13.7748 6.59934M6.22705 10.6303H15.9045M6.22705 14.6614L14.8396 14.6614M6.22705 18.6924H15.9045M6.22705 22.4133L12.5399 22.4133"
                        strokeWidth="2"
                    />
                    <path
                        d="M2.11353 27.5747V1.94971H15.9209C18.2328 1.94971 19.7741 2.88721 19.7741 5.07471C19.7741 2.88721 21.0585 1.94971 23.6273 1.94971H37.1135V27.5747H23.6273C20.7374 27.5747 19.7741 30.3872 19.7741 31.9497C19.7741 30.3872 18.4897 27.5747 15.2787 27.5747H2.11353Z"
                        strokeWidth="2"
                    />
                </svg>
                <div className="docs-logo-animated-icon hidden h-[33px] w-[39px]"></div>
            </Link>
        </>
    )
}
