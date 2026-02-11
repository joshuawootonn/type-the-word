import { differenceInMonths } from "date-fns"
import { Metadata } from "next"
import Link from "next/link"

import { db } from "~/server/db"
import { TypedVerseRepository } from "~/server/repositories/typedVerse.repository"
import { UserRepository } from "~/server/repositories/user.repository"
import { fetchTotalDonationsCents } from "~/server/stripe"

export const metadata: Metadata = {
    title: "Donate",
    description: "Donate to pay for Type the Word's operation cost.",
}

export default async function DonatePage() {
    const totalDonationsCents = await fetchTotalDonationsCents()
    const totalDonations = (totalDonationsCents / 100).toLocaleString(
        undefined,
        {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        },
    )
    const userRepo = new UserRepository(db)
    const typedVerseRepo = new TypedVerseRepository(db)

    const [userCount, typedVerseCount] = await Promise.all([
        userRepo.count(),
        typedVerseRepo.count(),
    ])

    const projectStartDate = new Date("2023-12-01")
    const apiIntegrationDate = new Date("2025-12-01")
    const now = new Date()

    const monthsBeforeApi = differenceInMonths(
        apiIntegrationDate,
        projectStartDate,
    )
    const monthsWithApi = differenceInMonths(now, apiIntegrationDate)

    const monthlyBurnRateOld = 40
    const monthlyBurnRateNew = 64 // $40 + $29 for api.bible
    const oneOffCosts = 90 // DB migration issues

    const spentToDate =
        monthsBeforeApi * monthlyBurnRateOld +
        monthsWithApi * monthlyBurnRateNew +
        oneOffCosts

    return (
        <main className="typo:prose dark:typo:prose-invert typo:prose-headings:text-primary typo:prose-p:text-primary typo:prose-a:text-primary typo:prose-strong:text-primary typo:prose-code:text-primary typo:prose-table:text-primary typo:prose-th:text-primary typo:prose-td:text-primary relative mx-auto w-full grow pt-4 text-lg lg:pt-8">
            <div
                className={
                    "typo:prose-h2:text-3xl typo:prose-p:text-xl typo:prose-code:before:content-none typo:prose-code:after:content-none"
                }
            >
                <h1>Donate</h1>
                <p className="mt-4">
                    Donations to date: <strong>{totalDonations}</strong>{" "}
                    &nbsp;|&nbsp; Project costs to date:{" "}
                    <strong>
                        {spentToDate.toLocaleString(undefined, {
                            style: "currency",
                            currency: "USD",
                            maximumFractionDigits: 0,
                        })}
                    </strong>
                </p>
                <hr className="border-primary mx-0 w-full border-t-2" />
                <h2>Why donate?</h2>
                <p>
                    I love typing through the Bible and when I created TTW, I
                    wanted to make it easier for myself and others to do so
                    consistently. So far {userCount} people have typed{" "}
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
                    className="svg-outline border-primary text-primary relative border-2 px-3 py-1 font-medium no-underline"
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
                                Planetscale Database <br />
                                <br />
                                <span className="text-xs">
                                    This is where all the data is stored for
                                    TTW. This is a managed PostgreSQL database
                                    dedicated to this project, which ensures
                                    that if I accidentally delete data it can be
                                    recovered. I have the 10$ a month node, and
                                    5$ a month here is for excess egress
                                    bandwidth that we sometimes use.
                                </span>
                            </td>
                            <td>$15</td>
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
                                <span className="text-xs whitespace-nowrap">
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
                                    through josh@typetheword.site.
                                </span>
                            </td>
                            <td>$8</td>
                        </tr>
                        <tr>
                            <td>
                                Domain <br />
                                <br />
                                <span className="text-xs">
                                    This is the cost of having the{" "}
                                    <code>typetheword.site</code> domain.{" "}
                                </span>
                            </td>
                            <td>
                                $2.20 <br />
                                <br />
                                <span className="text-xs">($26.48/year)</span>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                api.bible <br />
                                <br />
                                <span className="text-xs">
                                    This is the API that provides access to
                                    multiple Bible translations (NIV, NLT, CSB,
                                    NKJV, NASB, MSG, BSB, NTV, and more). Added
                                    in December 2024.
                                </span>
                            </td>
                            <td>$29</td>
                        </tr>
                    </tbody>
                </table>
                <p>
                    * I have a few side projects and some of these services are
                    shared accross them, so that&apos;s where the 50% comes
                    from.
                </p>

                <h3>One-off costs</h3>
                <table>
                    <thead>
                        <tr>
                            <th className="text-left">Item</th>
                            <th className="text-left">Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                Database migration egress bandwidth overages{" "}
                                <br />
                                <br />
                                <span className="text-xs">
                                    In late 2025, I swapped to a new database
                                    provider. It&apos;s faster, has better DX,
                                    is potentially cheaper, and this change now
                                    moved TTW to a dedicated database instance.
                                    But I failed to see the egress bandwidth
                                    limit they had, and some the endpoints I had
                                    created were very inefficient. I have
                                    optimized them now, but not before we used
                                    over a TB of bandwidth.
                                </span>
                            </td>
                            <td>$90</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Previous costs</h3>
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
                                Digital Ocean Database{" "}
                                <span className="text-xs">
                                    (Dec 2023 - Nov 2025)
                                </span>
                                <br />
                                <br />
                                <span className="text-xs">
                                    This was the original managed database for
                                    TTW, shared with other side projects.
                                    Migrated to Planetscale for better
                                    performance and dedicated resources.
                                </span>
                            </td>
                            <td>
                                $11 <br />
                                <br />
                                <span className="text-xs whitespace-nowrap">
                                    (50% of $22/month)
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="mb-40">
                <h2>FAQ</h2>

                <p>
                    <strong>Q:</strong> Where will excess donations go?
                    <br />
                    <strong>A:</strong> Scholarships for underprivileged kids
                    from unbelieving families to go to Christian school through{" "}
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
