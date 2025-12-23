import Stripe from "stripe";
import { ENV } from "../_core/env";

// Inicializa sem versão fixa para evitar conflitos
const stripe = new Stripe(ENV.stripeSecretKey || "", {
  typescript: true,
});

export interface CreateCheckoutParams {
  publicId: string;
  plan?: string; 
  email: string;
  origin: string;
  creditCode?: string | null; 
  currency: "BRL" | "USD";
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const { publicId, plan = "single", email, origin, creditCode, currency } = params;

  if (!ENV.stripeSecretKey) {
    throw new Error("Stripe Secret Key não configurada no .env");
  }

  const isBRL = currency === "BRL";
  
  // 1. MUDANÇA PRINCIPAL: Sempre usa "card", independente do país
  const paymentMethods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ["card"];

  // Preços e Moedas continuam dinâmicos
  const priceInCents = isBRL ? 1000 : 500; // R$ 10,00 ou $ 5.00
  const currencyCode = isBRL ? "brl" : "usd";

  const productName = isBRL 
    ? "Cartão de Natal Digital Premium" 
    : "Premium Digital Christmas Card";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods,
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: currencyCode,
            product_data: {
              name: productName,
              description: isBRL ? "Acesso Vitalício" : "Lifetime Access",
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        publicId,
        plan,
        currency,
        creditCode: creditCode || "",
        type: "card_purchase" 
      },
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel`,
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error: any) {
    console.error("❌ Erro Detalhado Stripe:", error);
    throw new Error(error.message);
  }
}

export async function retrieveCheckoutSession(sessionId: string) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    return null;
  }
}

export function constructWebhookEvent(payload: string | Buffer, signature: string) {
  return stripe.webhooks.constructEvent(payload, signature, ENV.stripeWebhookSecret || "");
}

export { stripe };