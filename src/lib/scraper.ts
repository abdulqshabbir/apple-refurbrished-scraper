import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { notificationsSent, products, subscriptions } from "~/server/db/schema";
import { COUNTRIES } from "./countries";
import { sendAlertEmail } from "./email";
import { randomBytes } from "crypto";

interface AppleProduct {
  partNumber: string;
  title: string;
  price: number;
  url: string;
}

async function fetchRefurbishedProducts(
  countryCode: string,
  category: string,
): Promise<AppleProduct[]> {
  const country = COUNTRIES[countryCode];
  if (!country) return [];

  const slugPrefix = country.slug ? `/${country.slug}` : "";
  const url = `https://www.apple.com${slugPrefix}/shop/refurbished/${category}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) return [];

  const text = await res.text();

  const { load } = await import("cheerio");
  const $ = load(text);
  const result: AppleProduct[] = [];

  $(".rf-refurb-category-grid-no-js li").each((_, el) => {
    const titleEl = $(el).find("h3 a");
    const priceEl = $(el).find(".as-producttile-currentprice");
    const href = titleEl.attr("href") ?? "";
    const title = titleEl.text().trim();
    const priceText = priceEl.text().replace(/[^0-9.]/g, "");
    const price = Math.round(parseFloat(priceText) * 100);
    const partNumberMatch = href.match(/\/product\/([^/]+)\//i);
    const partNumber = partNumberMatch?.[1] ?? href;

    if (title && price > 0 && partNumber) {
      result.push({
        partNumber,
        title,
        price,
        url: href.startsWith("http")
          ? href
          : `https://www.apple.com${href}`,
      });
    }
  });

  return result;
}

export async function runScraper() {
  const activeSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.isActive, 1));

  if (activeSubscriptions.length === 0) return;

  const uniquePairs = [
    ...new Map(
      activeSubscriptions.map((s) => [`${s.country}:${s.category}`, { country: s.country, category: s.category }]),
    ).values(),
  ];

  for (const { country: countryCode, category } of uniquePairs) {
    const fetched = await fetchRefurbishedProducts(countryCode, category);

    for (const item of fetched) {
      const productId = `${item.partNumber}_${countryCode}`;
      const now = new Date();

      const existing = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(products).values({
          id: productId,
          partNumber: item.partNumber,
          country: countryCode,
          title: item.title,
          price: item.price,
          url: item.url,
          firstSeenAt: now,
          lastSeenAt: now,
        });
      } else {
        await db
          .update(products)
          .set({ lastSeenAt: now, price: item.price })
          .where(eq(products.id, productId));
      }

      const matchingSubs = activeSubscriptions.filter((sub) => {
        if (sub.country !== countryCode) return false;
        if (sub.category !== category) return false;
        const keyword = sub.modelKeyword.toLowerCase();
        if (!item.title.toLowerCase().includes(keyword)) return false;
        if (sub.minPrice !== null && item.price < sub.minPrice) return false;
        if (sub.maxPrice !== null && item.price > sub.maxPrice) return false;
        return true;
      });

      for (const sub of matchingSubs) {
        const alreadyNotified = await db
          .select()
          .from(notificationsSent)
          .where(
            and(
              eq(notificationsSent.subscriptionId, sub.id),
              eq(notificationsSent.productId, productId),
            ),
          )
          .limit(1);

        if (alreadyNotified.length > 0) continue;

        await sendAlertEmail({
          to: sub.email,
          productTitle: item.title,
          productPrice: item.price,
          productUrl: item.url,
          country: countryCode,
          unsubscribeToken: sub.unsubscribeToken,
        });

        await db.insert(notificationsSent).values({
          id: randomBytes(16).toString("hex"),
          subscriptionId: sub.id,
          productId,
          sentAt: new Date(),
        });
      }
    }
  }
}
