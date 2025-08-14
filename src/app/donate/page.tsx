import { Metadata } from 'next'
import { fetchTotalDonationsCents } from '~/server/stripe'
import { differenceInMonths } from 'date-fns'
import { db } from '~/server/db'
import { TypedVerseRepository } from '~/server/repositories/typedVerse.repository'
import { UserRepository } from '~/server/repositories/user.repository'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Donate',
    description: "Donate to pay for Type the Word's operation cost.",
}

export default async function DonatePage() {
    const totalDonationsCents = await fetchTotalDonationsCents()
    const totalDonations = (totalDonationsCents / 100).toLocaleString(
        undefined,
        {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        },
    )
    const userRepo = new UserRepository(db)
    const typedVerseRepo = new TypedVerseRepository(db)

    const [userCount, typedVerseCount] = await Promise.all([
        userRepo.count(),
        typedVerseRepo.count(),
    ])

    const projectStartDate = new Date('2023-12-01')
    const monthsSinceStart = differenceInMonths(new Date(), projectStartDate)

    const monthlyBurnRate = 40
    const spentToDate = monthsSinceStart * monthlyBurnRate

    return (
        <main className="prose relative mx-auto w-full flex-grow pt-4 text-lg dark:prose-invert prose-headings:text-primary prose-p:text-primary prose-strong:text-primary prose-table:text-primary prose-th:text-primary prose-td:text-primary lg:pt-8">
            <div
                className={
                    'prose-h2:text-3xl prose-p:text-xl prose-code:before:content-none prose-code:after:content-none'
                }
            >
                <h1>Donate</h1>
                <hr className="mx-0 w-full border-t-2  border-primary" />
                <h2>Why donate?</h2>
                <p>
                    I made Type the Word because I love typing through the
                    Bible and I wanted to make it easier for myself and others
                    to do so consistently. So far {userCount} people have typed{' '}
                    {typedVerseCount} verses. If you would like to contribute to
                    it&apos;s continued hosting into the future I would much
                    appreciate the support.
                </p>
                <p className="mt-4">
                    Donations to date: <strong>{totalDonations}</strong>{' '}
                    &nbsp;|&nbsp; Project costs to date:{' '}
                    <strong>
                        {spentToDate.toLocaleString(undefined, {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0,
                        })}
                    </strong>
                </p>
            </div>

            <div className="my-20 flex justify-center">
                <Link
                    href="https://buy.stripe.com/28EcN49tMdztcaA6XAdby00"
                    className="svg-outline relative border-2 border-primary px-3 py-1 font-medium text-primary no-underline"
                >
                    Donate here
                </Link>
            </div>
            <div className={'prose-h2:text-2xl'}>
                <h2>Monthly costs</h2>
                <p>
                    I have a few side projects and some of these services are
                    shared accross them, so that&apos;s where the 50% comes
                    from.
                </p>
                <table>
                    <thead>
                        <tr>
                            <th className="text-left">Item</th>
                            <th className="text-left">Monthly cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Digital Ocean Database</td>
                            <td>$11 (50% of $22/month)</td>
                        </tr>
                        <tr>
                            <td>Vercel Pro </td>
                            <td>$10 (50% of $20/month)</td>
                        </tr>
                        <tr>
                            <td>Google Workspace</td>
                            <td>$8</td>
                        </tr>
                        <tr>
                            <td>Domain</td>
                            <td>$2.20 ($26.48/year)</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>
    )
}
