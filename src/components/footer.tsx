import Link from 'next/link'
import { EmailLink } from '~/components/emailLink'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { signOut } from 'next-auth/react'

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
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button
                        className="svg-outline relative no-underline"
                        aria-label="Customise options"
                    >
                        Legal
                    </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Content
                    className="flex flex-col border-2 border-black bg-white text-black"
                    sideOffset={4}
                    align="center"
                    side="top"
                >
                    <DropdownMenu.Item asChild={true}>
                        <Link
                            className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-black focus:text-white"
                            href={'/copyright'}
                        >
                            copyright
                        </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild={true}>
                        <Link
                            className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-black focus:text-white"
                            href={'/privacy-policy'}
                        >
                            privacy
                        </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild={true}>
                        <Link
                            className="cursor-pointer px-2 py-1 no-underline outline-none focus:bg-black focus:text-white"
                            href={'/terms-of-service'}
                        >
                            terms
                        </Link>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>

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
            <EmailLink className={'shrink-0 font-normal'}>
                email me feedback
            </EmailLink>
        </footer>
    )
}
