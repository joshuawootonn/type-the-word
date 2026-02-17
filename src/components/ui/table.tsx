"use client"

import clsx from "clsx"
import { forwardRef, ComponentPropsWithoutRef, ElementRef } from "react"

const Table = forwardRef<
    ElementRef<"table">,
    ComponentPropsWithoutRef<"table">
>(({ className, ...props }, ref) => (
    <table
        ref={ref}
        className={clsx("border-primary w-full border-collapse", className)}
        {...props}
    />
))
Table.displayName = "Table"

const TableHeader = forwardRef<
    ElementRef<"thead">,
    ComponentPropsWithoutRef<"thead">
>(({ className, ...props }, ref) => (
    <thead
        ref={ref}
        className={clsx("bg-secondary border-primary border-b-2", className)}
        {...props}
    />
))
TableHeader.displayName = "TableHeader"

const TableBody = forwardRef<
    ElementRef<"tbody">,
    ComponentPropsWithoutRef<"tbody">
>(({ className, ...props }, ref) => (
    <tbody ref={ref} className={clsx(className)} {...props} />
))
TableBody.displayName = "TableBody"

const TableRow = forwardRef<ElementRef<"tr">, ComponentPropsWithoutRef<"tr">>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={clsx(
                "border-primary border-b-2 last:border-b-0",
                className,
            )}
            {...props}
        />
    ),
)
TableRow.displayName = "TableRow"

const TableHead = forwardRef<ElementRef<"th">, ComponentPropsWithoutRef<"th">>(
    ({ className, ...props }, ref) => (
        <th
            ref={ref}
            className={clsx(
                "px-3 py-2 text-left text-sm font-normal",
                className,
            )}
            {...props}
        />
    ),
)
TableHead.displayName = "TableHead"

const TableCell = forwardRef<ElementRef<"td">, ComponentPropsWithoutRef<"td">>(
    ({ className, ...props }, ref) => (
        <td
            ref={ref}
            className={clsx("px-3 py-2 text-sm", className)}
            {...props}
        />
    ),
)
TableCell.displayName = "TableCell"

const TableCaption = forwardRef<
    ElementRef<"caption">,
    ComponentPropsWithoutRef<"caption">
>(({ className, ...props }, ref) => (
    <caption
        ref={ref}
        className={clsx("px-3 py-2 text-sm opacity-75", className)}
        {...props}
    />
))
TableCaption.displayName = "TableCaption"

export {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
}
