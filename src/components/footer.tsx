import Link from 'next/link'

export function Footer() {
    return (
        <footer className="prose mx-auto flex w-full items-start justify-start space-x-3 py-2">
            <a
                className="svg-outline relative text-xs no-underline"
                href="https://www.esv.org/"
                target="_blank"
                rel="noopener noreferrer"
            >
                (ESV)
            </a>
            <Link
                className="svg-outline relative text-xs no-underline"
                href={'/copywrite'}
            >
                copywrite
            </Link>
        </footer>
    )
}
