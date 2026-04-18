import { sql } from "drizzle-orm";
import { index, sqliteTableCreator } from "drizzle-orm/sqlite-core";

export const createTable = sqliteTableCreator(
  (name) => `apple_refurbished_scraper_${name}`,
);

export const subscriptions = createTable(
  "subscription",
  (d) => ({
    id: d.text().primaryKey(),
    email: d.text().notNull(),
    category: d.text().notNull(),
    modelKeyword: d.text().notNull(),
    country: d.text().notNull(),
    minPrice: d.integer(),
    maxPrice: d.integer(),
    unsubscribeToken: d.text().notNull().unique(),
    isActive: d.integer().notNull().default(1),
    createdAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }),
  (t) => [index("ars_subscription_email_idx").on(t.email)],
);

export const products = createTable(
  "product",
  (d) => ({
    id: d.text().primaryKey(),
    partNumber: d.text().notNull(),
    country: d.text().notNull(),
    title: d.text().notNull(),
    price: d.integer().notNull(),
    url: d.text().notNull(),
    firstSeenAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    lastSeenAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }),
  (t) => [index("ars_product_country_idx").on(t.country)],
);

export const notificationsSent = createTable(
  "notification_sent",
  (d) => ({
    id: d.text().primaryKey(),
    subscriptionId: d
      .text()
      .notNull()
      .references(() => subscriptions.id),
    productId: d
      .text()
      .notNull()
      .references(() => products.id),
    sentAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }),
  (t) => [
    index("ars_notification_subscription_idx").on(t.subscriptionId),
    index("ars_notification_product_idx").on(t.productId),
  ],
);
