import Link from 'next/link'
import { EmailLink } from '~/components/emailLink'

export function Footer() {
    return (
        <footer className="flex w-full items-center justify-between space-x-3 py-2 text-sm">
            <a
                className="svg-outline relative no-underline"
                href="https://www.esv.org/"
                target="_blank"
                rel="noopener noreferrer"
            >
                (ESV)
            </a>
            <span>/</span>
            <Link
                className="svg-outline relative no-underline"
                href={'/copyright'}
            >
                copyright
            </Link>
            <span>/</span>
            <Link className="svg-outline relative no-underline" href={'/why'}>
                why?
            </Link>

            <div className="flex-grow"> </div>
            <Link
                className="svg-outline relative no-underline"
                href={'https://github.com/joshuawootonn/type-the-word'}
                target="_blank"
                rel="noopener noreferrer"
            >
                github
            </Link>
            <span>/</span>
            <EmailLink className={'shrink-0'}>email me feedback</EmailLink>
        </footer>
    )
}
