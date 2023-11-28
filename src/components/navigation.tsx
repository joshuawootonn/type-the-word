import { signIn, signOut, useSession } from 'next-auth/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import Link from 'next/link'
import { useRouter } from 'next/router'

export function Navigation() {
    const { data: sessionData } = useSession()

    const router = useRouter()
    return (
        <nav className="mx-auto mb-2 flex w-full items-center justify-between pt-4 lg:pt-8">
            <Link href={'/'}>
                <h1 className="m-0 font-mono text-xl font-extrabold tracking-tight text-black">
                    Type the Word
                </h1>
            </Link>
            <div className="flex flex-col gap-4">
                {sessionData ? (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                            <button
                                className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black"
                                aria-label="Customise options"
                            >
                                {sessionData.user.name}
                            </button>
                        </DropdownMenu.Trigger>

                        <DropdownMenu.Content
                            className="border-2 border-black text-black"
                            sideOffset={-2}
                            align="end"
                        >
                            <DropdownMenu.Item asChild={true}>
                                <Link
                                    className="block cursor-pointer px-3 py-1 no-underline outline-none focus:bg-black focus:text-white "
                                    href={'/history'}
                                >
                                    History
                                </Link>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                className="cursor-pointer px-3 py-1 outline-none focus:bg-black focus:text-white "
                                onClick={() => void signOut()}
                            >
                                Sign out
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                ) : (
                    <button
                        className="svg-outline relative border-2 border-black px-3 py-1 font-semibold text-black"
                        onClick={() => void signIn()}
                    >
                        Sign in
                    </button>
                )}
            </div>
        </nav>
    )
}
