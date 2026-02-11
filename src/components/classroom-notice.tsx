import { Link } from "~/components/ui/link"

interface ClassroomNoticeProps {
    variant?: "error" | "notice" | "success"
    title?: string
    message: string
    linkHref?: string
    linkLabel?: string
}

/**
 * Reusable notice/error component for classroom pages
 * Supports error, notice, and success variants
 */
export function ClassroomNotice({
    variant = "notice",
    title,
    message,
    linkHref,
    linkLabel,
}: ClassroomNoticeProps) {
    const textColor =
        variant === "error"
            ? "text-error!"
            : variant === "success"
              ? "text-success!"
              : "text-primary!"

    return (
        <div>
            {title && <h1 className={`mb-2 font-semibold`}>{title}</h1>}
            <div
                className={
                    variant === "error"
                        ? "border-error bg-secondary border-2 px-6"
                        : ""
                }
            >
                <p className={textColor}>{message}</p>
            </div>
            {linkHref && linkLabel && (
                <div className="mt-4">
                    <Link href={linkHref}>{linkLabel}</Link>
                </div>
            )}
        </div>
    )
}
