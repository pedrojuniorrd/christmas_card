import Stripe from "stripe";
import { ENV } from "../_core/env";
import { getProductByPlan } from "./products";

// Initialize Stripe with secret key
const stripe = new Stripe(ENV.stripeSecretKey || "", {
  apiVersion: "2025-12-15.clover",
});

export interface CreateCheckoutParams {
  publicId: string;
  plan: "single" | "family";
  email: string;
  origin: string;
  creditCode?: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const { publicId, plan, email, origin, creditCode } = params;
  const product = getProductByPlan(plan);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: email,
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      publicId,
      plan,
      cardCount: product.cardCount.toString(),
      creditCode: creditCode || "",
    },
    success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/payment/cancel`,
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
}

export async function retrieveCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    return null;
  }
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    ENV.stripeWebhookSecret || ""
  );
}

export { stripe };
