"use client"

import type { ReactElement } from "react"

import { X } from "@phosphor-icons/react"
import * as Dialog from "@radix-ui/react-dialog"
import Image, { type ImageProps } from "next/image"
import { useState } from "react"

interface DocsImageProps extends Omit<
    ImageProps,
    "src" | "alt" | "width" | "height"
> {
    src: string
    alt: string
    width?: number
    height?: number
}

export function DocsImage({
    src,
    alt,
    className,
    width = 1600,
    height = 900,
    onLoad,
    ...props
}: DocsImageProps): ReactElement {
    const [resolvedWidth, setResolvedWidth] = useState<number>(width)
    const [resolvedHeight, setResolvedHeight] = useState<number>(height)

    const handleLoad: NonNullable<ImageProps["onLoad"]> = event => {
        const imageElement = event.currentTarget
        if (imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
            setResolvedWidth(imageElement.naturalWidth)
            setResolvedHeight(imageElement.naturalHeight)
        }
        onLoad?.(event)
    }

    return (
        <Dialog.Root>
            <span className="not-prose my-6 block md:relative md:left-1/2 md:w-[min(720px,calc(100vw-26rem))] md:-translate-x-1/2">
                <Dialog.Trigger asChild>
                    <button
                        type="button"
                        className="svg-outline border-primary/8 bg-primary/8 relative block w-full cursor-zoom-in border-2 p-1"
                        aria-label={`Open image: ${alt || "documentation screenshot"}`}
                    >
                        <Image
                            src={src}
                            alt={alt}
                            width={resolvedWidth}
                            height={resolvedHeight}
                            className={className ?? "h-auto w-full"}
                            onLoad={handleLoad}
                            {...props}
                        />
                    </button>
                </Dialog.Trigger>
            </span>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
                <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
                    <div className="border-primary bg-secondary relative border-2 p-2">
                        <Dialog.Close asChild>
                            <button
                                type="button"
                                className="svg-outline border-primary bg-secondary absolute top-0 right-0 z-10 translate-x-[2px] translate-y-[-2px] border-2 p-1"
                                aria-label="Close image dialog"
                            >
                                <X aria-hidden size={18} weight="bold" />
                            </button>
                        </Dialog.Close>
                        <Image
                            src={src}
                            alt={alt}
                            width={resolvedWidth}
                            height={resolvedHeight}
                            className="mx-auto block h-auto max-h-[90vh] w-auto max-w-[96vw] object-contain"
                            onLoad={handleLoad}
                        />
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
