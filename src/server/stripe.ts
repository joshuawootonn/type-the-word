import Stripe from "stripe"

import { env } from "~/env.mjs"

const stripeSecretKey = env.STRIPE_SECRET_KEY

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-07-30.basil",
    typescript: true,
})

// Claiming 15 because I got 15 from Janet and then tested with 5 dollars myself.
export const alternateDonationAmounts = 1000

export async function fetchTotalDonationsCents(): Promise<number> {
    try {
        let total = alternateDonationAmounts

        const paymentIntentParams: Stripe.PaymentIntentListParams = {
            limit: 1000,
        }

        const paymentIntents =
            await stripe.paymentIntents.list(paymentIntentParams)
        for (const paymentIntent of paymentIntents.data) {
            if (paymentIntent.status === "succeeded") {
                const refunds = await stripe.refunds.list({
                    payment_intent: paymentIntent.id,
                    limit: 100,
                })

                const totalRefunded = refunds.data.reduce((sum, refund) => {
                    return (
                        sum +
                        (refund.status === "succeeded" ? refund.amount : 0)
                    )
                }, 0)

                // Add the net amount (payment minus refunds)
                const netAmount = paymentIntent.amount - totalRefunded
                if (netAmount > 0) {
                    total += netAmount
                }
            }
        }

        return total
    } catch (error) {
        console.error("Error fetching donations from Stripe:", error)
        return alternateDonationAmounts
    }
}
