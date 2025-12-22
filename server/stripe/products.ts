// Stripe product and price definitions for Christmas Card SaaS
// Prices are in BRL (Brazilian Real) cents

export const PRODUCTS = {
  SINGLE_CARD: {
    id: "single_card",
    name: "Single Christmas Card",
    description: "Create one beautiful Christmas card",
    priceInCents: 300, // R$ 3.00
    cardCount: 1,
  },
  FAMILY_PACK: {
    id: "family_pack",
    name: "Family Pack - 5 Christmas Cards",
    description: "Create up to 5 Christmas cards for your loved ones",
    priceInCents: 500, // R$ 5.00
    cardCount: 5,
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;

export function getProductById(id: string) {
  const product = Object.values(PRODUCTS).find((p) => p.id === id);
  return product;
}

export function getProductByPlan(plan: "single" | "family") {
  return plan === "single" ? PRODUCTS.SINGLE_CARD : PRODUCTS.FAMILY_PACK;
}
