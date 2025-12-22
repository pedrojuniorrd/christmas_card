import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getActiveSongs: vi.fn().mockResolvedValue([
    { id: 1, title: "Jingle Bells", artist: "Traditional", duration: 120, fileUrl: "https://example.com/jingle.mp3", isPremium: false },
    { id: 2, title: "Silent Night", artist: "Traditional", duration: 180, fileUrl: "https://example.com/silent.mp3", isPremium: false },
  ]),
  getSongById: vi.fn().mockResolvedValue({ id: 1, title: "Jingle Bells", fileUrl: "https://example.com/jingle.mp3" }),
  createCard: vi.fn().mockResolvedValue(1),
  getCardByPublicId: vi.fn().mockResolvedValue({
    id: 1,
    publicId: "test123",
    templateId: 1,
    message: "Merry Christmas!",
    senderName: "John",
    recipientName: "Jane",
    songId: 1,
    photoUrl: null,
    customSongUrl: null,
    isActive: true,
    viewCount: 5,
  }),
  getCardWithSong: vi.fn().mockResolvedValue({
    id: 1,
    publicId: "test123",
    templateId: 1,
    message: "Merry Christmas!",
    senderName: "John",
    recipientName: "Jane",
    songId: 1,
    photoUrl: null,
    customSongUrl: null,
    songUrl: "https://example.com/jingle.mp3",
    isActive: true,
    viewCount: 5,
  }),
  incrementCardViewCount: vi.fn().mockResolvedValue(undefined),
  activateCard: vi.fn().mockResolvedValue(undefined),
  updateCardPayment: vi.fn().mockResolvedValue(undefined),
  getCardCreditByCode: vi.fn().mockResolvedValue({
    id: 1,
    creditCode: "TESTCODE",
    remainingCards: 3,
    totalCards: 5,
  }),
  decrementCardCredit: vi.fn().mockResolvedValue(true),
  createPayment: vi.fn().mockResolvedValue(1),
  getPaymentBySessionId: vi.fn().mockResolvedValue({
    id: 1,
    externalId: "pay_123",
    status: "completed",
    sessionId: "cs_test_123",
    metadata: JSON.stringify({ publicId: "test123", creditCode: "TESTCODE" }),
  }),
}));

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Wishing you a wonderful Christmas!" } }],
  }),
}));

// Mock Stripe checkout
vi.mock("./stripe/checkout", () => ({
  createCheckoutSession: vi.fn().mockResolvedValue({
    sessionId: "cs_test_123",
    checkoutUrl: "https://checkout.stripe.com/test",
  }),
  retrieveCheckoutSession: vi.fn().mockResolvedValue({
    id: "cs_test_123",
    payment_status: "paid",
    metadata: { publicId: "test123", creditCode: "TESTCODE", cardCount: "5" },
  }),
}));

function createTestContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {
        origin: "https://test.example.com",
        host: "test.example.com",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("songs.list", () => {
  it("returns a list of active songs", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const songs = await caller.songs.list();

    expect(songs).toHaveLength(2);
    expect(songs[0]).toMatchObject({
      id: 1,
      title: "Jingle Bells",
      artist: "Traditional",
    });
  });
});

describe("cards.generateMessage", () => {
  it("generates a Christmas message", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cards.generateMessage({
      recipientName: "Mom",
      senderName: "John",
      tone: "warm",
    });

    expect(result.message).toBeTruthy();
    expect(typeof result.message).toBe("string");
  });
});

describe("cards.getByPublicId", () => {
  it("returns card data for a valid public ID", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const card = await caller.cards.getByPublicId({ publicId: "test123" });

    expect(card).toMatchObject({
      publicId: "test123",
      message: "Merry Christmas!",
      senderName: "John",
      recipientName: "Jane",
    });
  });
});

describe("cards.create with credit code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a card using a valid credit code", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.cards.create({
      templateId: 1,
      message: "Merry Christmas!",
      senderName: "John",
      recipientName: "Jane",
      email: "test@example.com",
      plan: "single",
      creditCode: "TESTCODE",
    });

    expect(result.publicId).toBeTruthy();
    expect(result.creditCode).toBe("TESTCODE");
  });
});

describe("payments.verifySession", () => {
  it("verifies a successful payment session", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payments.verifySession({
      sessionId: "cs_test_123",
    });

    expect(result.status).toBe("completed");
    expect(result.publicId).toBe("test123");
  });
});
