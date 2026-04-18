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
): Promise<AppleProduct[]> {
  const country = COUNTRIES[countryCode];
  if (!country) return [];

  const slugPrefix = country.slug ? `/${country.slug}` : "";
  const url = `https://www.apple.com${slugPrefix}/shop/refurbished/browse?pl=true&mco=refurbished&page=1&hits=40`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "application/json, text/javascript, */*",
    },
  });

  if (!res.ok) return [];

  const text = await res.text();

  // Apple's refurbished page returns HTML with embedded JSON; parse product tiles
  const { load } = await import("cheerio");
  const $ = load(text);
  const result: AppleProduct[] = [];

  $(".rf-refurb-product-tile-wrapper").each((_, el) => {
    const titleEl = $(el).find(".rf-refurb-product-tile-description h3 a");
    const priceEl = $(el).find(".rf-refurb-product-tile-price .current_price");
    const href = titleEl.attr("href") ?? "";
    const title = titleEl.text().trim();
    const priceText = priceEl.text().replace(/[^0-9.]/g, "");
    const price = Math.round(parseFloat(priceText) * 100);
    const partNumberMatch = href.match(/\/([A-Z0-9]+)(?:\?|$)/);
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

  const uniqueCountries = [...new Set(activeSubscriptions.map((s) => s.country))];

  for (const countryCode of uniqueCountries) {
    const fetched = await fetchRefurbishedProducts(countryCode);

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
