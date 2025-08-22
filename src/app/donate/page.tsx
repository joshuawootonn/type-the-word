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
        <main className="prose relative mx-auto w-full flex-grow pt-4 text-lg dark:prose-invert prose-headings:text-primary prose-p:text-primary prose-a:text-primary prose-strong:text-primary prose-code:text-primary prose-table:text-primary prose-th:text-primary prose-td:text-primary lg:pt-8">
            <div
                className={
                    'prose-h2:text-3xl prose-p:text-xl prose-code:before:content-none prose-code:after:content-none'
                }
            >
                <h1>Donate</h1>
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
                <hr className="mx-0 w-full border-t-2  border-primary" />
                <h2>Why donate?</h2>
                <p>
                    I love typing through the Bible and when I created TTW, I
                    wanted to make it easier for myself and others to do so
                    consistently. So far {userCount} people have typed{' '}
                    {typedVerseCount} verses!
                    <br />
                    <br />
                    My goal has always been to keep the project free and
                    accessible to everyone, but running a website costs money.
                    Your contributions will go directly to supporting the
                    hosting costs of TTW.
                    <br />
                    <br />
                    If you would like to contribute to it&apos;s continued
                    hosting into the future I would much appreciate the support.
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
            <div>
                <h2>What does the money go towards?</h2>
                <p>
                    Here is a breakdown of what your donation will help cover.
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
                            <td>
                                Digital Ocean Database <br />
                                <br />
                                <span className="text-xs">
                                    This is where all the data is stored for
                                    TTW. This is a managed database which
                                    ensures that if I accidentally delete data
                                    it can be recovered.
                                </span>
                            </td>
                            <td>
                                $11 <br />
                                <br />
                                <span className="whitespace-nowrap text-xs">
                                    (50% of $22/month) *
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Vercel Pro
                                <br />
                                <br />
                                <span className="text-xs">
                                    This is where the website is hosted.
                                </span>
                            </td>
                            <td>
                                $10 <br />
                                <br />
                                <span className="whitespace-nowrap text-xs">
                                    (50% of $20/month) *
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Google Workspace <br />
                                <br />
                                <span className="text-xs">
                                    This is how I communicate with you all
                                    through josh@typetheword.site. I set this up
                                    because I was thinking the project could
                                    scale to multiple contributors. Long term,
                                    if it doesn&apos;t, I&apos;m planning to
                                    switch back to my personal email to save on
                                    costs.{' '}
                                </span>
                            </td>
                            <td>$8</td>
                        </tr>
                        <tr>
                            <td>
                                Domain <br />
                                <br />
                                <span className="text-xs">
                                    This is the cost of having the{' '}
                                    <code>typetheword.site</code> domain.{' '}
                                </span>
                            </td>
                            <td>
                                $2.20 <br />
                                <br />
                                <span className="text-xs">($26.48/year)</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p>
                    * I have a few side projects and some of these services are
                    shared accross them, so that&apos;s where the 50% comes
                    from.
                </p>
            </div>
            <div className="mb-40">
                <h2>FAQ</h2>

                <p>
                    <strong>Q:</strong> Where will excess donations go?
                    <br />
                    <strong>A:</strong> Scholarships for children going to Christian
                    school through{' '}
                    <Link
                        href="https://www.faithacademyiowa.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Faith Academy
                    </Link>
                </p>
            </div>
        </main>
    )
}
