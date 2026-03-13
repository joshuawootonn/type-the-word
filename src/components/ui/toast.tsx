"use client"

import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react"

type ToastVariant = "notice" | "error" | "success"

type Toast = {
    id: string
    message: string
    variant: ToastVariant
}

type ShowToastInput = {
    message: string
    variant?: ToastVariant
}

type ToastContextValue = {
    showToast: (input: ShowToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function getVariantClassName(variant: ToastVariant): string {
    if (variant === "error") {
        return "border-error text-error"
    }

    if (variant === "success") {
        return "border-success text-success"
    }

    return "border-primary text-primary"
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((input: ShowToastInput) => {
        const id = crypto.randomUUID()
        const toast: Toast = {
            id,
            message: input.message,
            variant: input.variant ?? "notice",
        }
        setToasts(previous => [...previous, toast])
        setTimeout(() => {
            setToasts(previous => previous.filter(item => item.id !== id))
        }, 5000)
    }, [])

    const value = useMemo<ToastContextValue>(
        () => ({
            showToast,
        }),
        [showToast],
    )

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-md flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        role="status"
                        className={`bg-secondary pointer-events-auto border-2 p-3 text-sm ${getVariantClassName(
                            toast.variant,
                        )}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext)
    if (context == null) {
        throw new Error("useToast must be used inside ToastProvider")
    }

    return context
}
