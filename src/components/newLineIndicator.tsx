import clsx from "clsx"

export function NewLineIndicator({
    isActive,
    className,
}: {
    isActive?: boolean
    className?: string
}) {
    return (
        <>
            <span
                className={clsx(
                    className,
                    "indicator absolute left-0 top-0 inline-flex h-full items-center justify-center px-2 opacity-0 transition-opacity",
                    isActive && "active-space opacity-100",
                )}
            >
                <svg
                    className="translate-y-[.5px]"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12.5611 4.33774C12.5611 4.33774 12.5611 4.84212 12.5611 5.82744C12.5611 7.72453 11.5283 8.55823 9.83026 8.55823C6.99146 8.55823 2.56105 8.55823 2.56105 8.55823M2.56105 8.55823C2.56105 8.39635 4.96506 5.82744 4.96506 5.82744M2.56105 8.55823C2.56105 8.72012 4.12224 10.3498 4.96506 11.2455"
                        stroke="black"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
            <br />
        </>
    )
}
