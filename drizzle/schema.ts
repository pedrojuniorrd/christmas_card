import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Christmas card templates - predefined layouts and styles
 */
export const cardTemplates = mysqlTable("card_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  previewUrl: text("previewUrl"),
  backgroundColor: varchar("backgroundColor", { length: 20 }),
  accentColor: varchar("accentColor", { length: 20 }),
  fontFamily: varchar("fontFamily", { length: 100 }),
  animationType: mysqlEnum("animationType", ["snow", "lights", "stars", "none"]).default("snow"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CardTemplate = typeof cardTemplates.$inferSelect;
export type InsertCardTemplate = typeof cardTemplates.$inferInsert;

/**
 * Curated library of public domain Christmas songs
 */
export const songs = mysqlTable("songs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  artist: varchar("artist", { length: 200 }),
  duration: int("duration"), // in seconds
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }),
  isPremium: boolean("isPremium").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;

/**
 * Main cards table - stores all created Christmas cards
 */
export const cards = mysqlTable("cards", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique non-sequential ID for public access (e.g., "A1b2C3d4E5f6") */
  publicId: varchar("publicId", { length: 20 }).notNull().unique(),
  /** Reference to template used */
  templateId: int("templateId").notNull(),
  /** Custom message on the card */
  message: text("message").notNull(),
  /** Sender name */
  senderName: varchar("senderName", { length: 100 }),
  /** Recipient name */
  recipientName: varchar("recipientName", { length: 100 }),
  /** Selected song from library (null if custom upload) */
  songId: int("songId"),
  /** Custom uploaded song URL (null if using library song) */
  customSongUrl: text("customSongUrl"),
  customSongKey: varchar("customSongKey", { length: 500 }),
  /** Uploaded photo URL */
  photoUrl: text("photoUrl"),
  photoKey: varchar("photoKey", { length: 500 }),
  /** Payment status */
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed"]).default("pending").notNull(),
  paymentId: varchar("paymentId", { length: 100 }),
  paymentMethod: mysqlEnum("paymentMethod", ["stripe", "pix"]),
  /** Card status */
  isActive: boolean("isActive").default(false).notNull(),
  /** View count */
  viewCount: int("viewCount").default(0).notNull(),
  /** Expiration date (default: January 15th of next year) */
  expiresAt: timestamp("expiresAt").notNull(),
  /** Creator info (optional, no auth required) */
  creatorEmail: varchar("creatorEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Card = typeof cards.$inferSelect;
export type InsertCard = typeof cards.$inferInsert;

/**
 * Payments table - tracks all payment transactions
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  /** External payment ID from Stripe or PIX provider */
  externalId: varchar("externalId", { length: 200 }).notNull(),
  /** Payment method used */
  method: mysqlEnum("method", ["stripe", "pix"]).notNull(),
  /** Amount in cents (BRL) */
  amountCents: int("amountCents").notNull(),
  /** Currency code */
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  /** Number of cards purchased */
  cardCount: int("cardCount").notNull(),
  /** Payment status */
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  /** Payer email */
  payerEmail: varchar("payerEmail", { length: 320 }),
  /** Stripe checkout session ID or PIX transaction ID */
  sessionId: varchar("sessionId", { length: 200 }),
  /** Metadata JSON */
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Card credits - tracks available card credits from purchases
 */
export const cardCredits = mysqlTable("card_credits", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique credit code for redemption */
  creditCode: varchar("creditCode", { length: 50 }).notNull().unique(),
  /** Associated payment */
  paymentId: int("paymentId").notNull(),
  /** Number of cards remaining */
  remainingCards: int("remainingCards").notNull(),
  /** Total cards purchased */
  totalCards: int("totalCards").notNull(),
  /** Email associated with purchase */
  email: varchar("email", { length: 320 }),
  /** Expiration for using credits */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CardCredit = typeof cardCredits.$inferSelect;
export type InsertCardCredit = typeof cardCredits.$inferInsert;
