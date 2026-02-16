"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react"

import { cn } from "~/lib/cn"

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal

const DialogBackdrop = forwardRef<
    ElementRef<typeof DialogPrimitive.Backdrop>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Backdrop
        ref={ref}
        className={cn("fixed inset-0 z-40 bg-black/60", className)}
        {...props}
    />
))
DialogBackdrop.displayName = "DialogBackdrop"

const DialogContent = forwardRef<
    ElementRef<typeof DialogPrimitive.Popup>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>
>(({ className, ...props }, ref) => (
    <DialogPortal>
        <DialogBackdrop />
        <DialogPrimitive.Popup
            ref={ref}
            className={cn(
                "border-primary bg-secondary fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 border-2 p-5",
                className,
            )}
            {...props}
        />
    </DialogPortal>
))
DialogContent.displayName = "DialogContent"

const DialogTitle = forwardRef<
    ElementRef<typeof DialogPrimitive.Title>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn("text-primary text-xl font-semibold", className)}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = forwardRef<
    ElementRef<typeof DialogPrimitive.Description>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn("text-primary mt-3", className)}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

const DialogClose = forwardRef<
    ElementRef<typeof DialogPrimitive.Close>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>((props, ref) => <DialogPrimitive.Close ref={ref} {...props} />)
DialogClose.displayName = "DialogClose"

export {
    Dialog,
    DialogBackdrop,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
}
