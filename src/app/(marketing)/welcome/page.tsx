import { Metadata } from 'next'

import { EmailLink } from '~/components/emailLink'
import { db } from '~/server/db'
import { TypedVerseRepository } from '~/server/repositories/typedVerse.repository'
import { UserRepository } from '~/server/repositories/user.repository'

export const metadata: Metadata = {
    title: 'Type the Word - Thanks for trusting me',
    description: "I'm glad you are joining me and ",
}

export default async function Home() {
    const userRepo = new UserRepository(db)
    const typedVerseRepo = new TypedVerseRepository(db)

    const [userCount, typedVerseCount] = await Promise.all([
        userRepo.count(),
        typedVerseRepo.count(),
    ])

    return (
        <>
            <div className={'prose-h2:text-3xl prose-p:text-xl'}>
                <h1>Welcome</h1>
                <p>
                    I&apos;m glad you are joining me and the {userCount} other
                    people who have together typed {typedVerseCount} verses. I
                    hope this project can be a blessing to your walk with God
                    like it has been to mine.
                </p>

                <p>
                    If you ever have feedback, don&apos;t hesitate to{' '}
                    <EmailLink className="svg-outline-sm underline">
                        send me an email.
                    </EmailLink>{' '}
                </p>
            </div>
        </>
    )
}
