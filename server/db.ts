import { eq, and, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  cards, 
  songs, 
  payments, 
  cardCredits,
  InsertCard,
  InsertSong,
  InsertPayment,
  InsertCardCredit,
  Card,
  Song,
  Payment,
  CardCredit
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Helpers ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Song Helpers ============

export async function getActiveSongs(): Promise<Song[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(songs).where(eq(songs.isActive, true));
  return result;
}

export async function getSongById(id: number): Promise<Song | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(songs).where(eq(songs.id, id)).limit(1);
  return result[0];
}

export async function createSong(song: InsertSong): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(songs).values(song);
  return Number(result[0].insertId);
}

// ============ Card Helpers ============

export async function createCard(card: InsertCard): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(cards).values(card);
  return Number(result[0].insertId);
}

export async function getCardByPublicId(publicId: string): Promise<Card | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const now = new Date();
  const result = await db.select()
    .from(cards)
    .where(
      and(
        eq(cards.publicId, publicId),
        eq(cards.isActive, true),
        gt(cards.expiresAt, now)
      )
    )
    .limit(1);
  
  return result[0];
}

export async function getCardWithSong(publicId: string): Promise<(Card & { songUrl?: string }) | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const now = new Date();
  const result = await db.select({
    card: cards,
    songUrl: songs.fileUrl,
  })
    .from(cards)
    .leftJoin(songs, eq(cards.songId, songs.id))
    .where(
      and(
        eq(cards.publicId, publicId),
        eq(cards.isActive, true),
        gt(cards.expiresAt, now)
      )
    )
    .limit(1);
  
  if (!result[0]) return undefined;
  
  return {
    ...result[0].card,
    songUrl: result[0].songUrl || undefined,
  };
}

export async function incrementCardViewCount(publicId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(cards)
    .set({ viewCount: sql`${cards.viewCount} + 1` })
    .where(eq(cards.publicId, publicId));
}

export async function activateCard(publicId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(cards)
    .set({ isActive: true, paymentStatus: "completed" })
    .where(eq(cards.publicId, publicId));
}

export async function updateCardPayment(publicId: string, paymentId: string, paymentMethod: "stripe" | "pix"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(cards)
    .set({ paymentId, paymentMethod })
    .where(eq(cards.publicId, publicId));
}

// ============ Payment Helpers ============

export async function createPayment(payment: InsertPayment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(payments).values(payment);
  return Number(result[0].insertId);
}

export async function getPaymentByExternalId(externalId: string): Promise<Payment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(payments).where(eq(payments.externalId, externalId)).limit(1);
  return result[0];
}

export async function getPaymentBySessionId(sessionId: string): Promise<Payment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(payments).where(eq(payments.sessionId, sessionId)).limit(1);
  return result[0];
}

export async function updatePaymentStatus(externalId: string, status: "pending" | "completed" | "failed" | "refunded"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(payments)
    .set({ status })
    .where(eq(payments.externalId, externalId));
}

// ============ Card Credit Helpers ============

export async function createCardCredit(credit: InsertCardCredit): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(cardCredits).values(credit);
  return Number(result[0].insertId);
}

export async function getCardCreditByCode(creditCode: string): Promise<CardCredit | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const now = new Date();
  const result = await db.select()
    .from(cardCredits)
    .where(
      and(
        eq(cardCredits.creditCode, creditCode),
        gt(cardCredits.remainingCards, 0),
        gt(cardCredits.expiresAt, now)
      )
    )
    .limit(1);
  
  return result[0];
}

export async function decrementCardCredit(creditCode: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.update(cardCredits)
    .set({ remainingCards: sql`${cardCredits.remainingCards} - 1` })
    .where(
      and(
        eq(cardCredits.creditCode, creditCode),
        gt(cardCredits.remainingCards, 0)
      )
    );
  
  return (result[0].affectedRows ?? 0) > 0;
}
