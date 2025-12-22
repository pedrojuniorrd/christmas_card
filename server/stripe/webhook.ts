import { Request, Response } from "express";
import { constructWebhookEvent } from "./checkout";
import * as db from "../db";
import { nanoid } from "nanoid";

// Generate a credit code
function generateCreditCode(): string {
  return nanoid(8).toUpperCase();
}

// Default expiration date: January 15th of next year
function getDefaultExpirationDate(): Date {
  const now = new Date();
  const year = now.getMonth() >= 11 ? now.getFullYear() + 1 : now.getFullYear();
  return new Date(year, 0, 15, 23, 59, 59);
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    console.error("[Webhook] Missing stripe-signature header");
    return res.status(400).json({ error: "Missing signature" });
  }

  let event;
  try {
    event = constructWebhookEvent(req.body, signature);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const publicId = metadata.publicId;
        const plan = metadata.plan as "single" | "family";
        const cardCount = parseInt(metadata.cardCount || "1");

        console.log(`[Webhook] Checkout completed for card: ${publicId}, plan: ${plan}`);

        if (publicId) {
          // Activate the card
          await db.activateCard(publicId);

          // Create payment record
          const externalId = `pay_${session.payment_intent || session.id}`;
          await db.createPayment({
            externalId,
            method: "stripe",
            amountCents: session.amount_total || 0,
            currency: session.currency || "brl",
            cardCount,
            status: "completed",
            payerEmail: session.customer_email || null,
            sessionId: session.id,
            metadata: JSON.stringify(metadata),
          });

          // If multiple cards, create credit for remaining cards
          if (cardCount > 1) {
            const creditCode = generateCreditCode();
            await db.createCardCredit({
              creditCode,
              paymentId: 0, // We don't need to link it
              remainingCards: cardCount - 1,
              totalCards: cardCount,
              email: session.customer_email || null,
              expiresAt: getDefaultExpirationDate(),
            });
            console.log(`[Webhook] Created credit code: ${creditCode} with ${cardCount - 1} remaining cards`);
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        console.log("[Webhook] Payment intent succeeded");
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
