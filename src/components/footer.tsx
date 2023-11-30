import Link from 'next/link'

export function Footer() {
    return (
        <footer className="prose mx-auto flex w-full items-center justify-start space-x-3 py-2">
            <a
                className="svg-outline relative text-xs no-underline"
                href="https://www.esv.org/"
                target="_blank"
                rel="noopener noreferrer"
            >
                (ESV)
            </a>
            <span>/</span>
            <Link
                className="svg-outline relative text-xs no-underline"
                href={'/copywrite'}
            >
                copywrite
            </Link>
            <span>/</span>
            <Link
                className="svg-outline relative text-xs no-underline"
                href={'/why'}
            >
                why?
            </Link>
        </footer>
    )
}
