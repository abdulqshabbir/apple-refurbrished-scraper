import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { subscriptions } from "~/server/db/schema";
import { sendConfirmationEmail } from "~/lib/email";
import { COUNTRIES } from "~/lib/countries";
import { CATEGORIES } from "~/lib/categories";

export const subscriptionsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        category: z.enum(Object.keys(CATEGORIES) as [string, ...string[]]),
        modelKeyword: z.string().min(1).max(200),
        country: z.enum(Object.keys(COUNTRIES) as [string, ...string[]]),
        minPrice: z.number().int().nonnegative().optional(),
        maxPrice: z.number().int().nonnegative().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const id = randomBytes(16).toString("hex");
      const unsubscribeToken = randomBytes(32).toString("hex");

      await db.insert(subscriptions).values({
        id,
        email: input.email,
        category: input.category,
        modelKeyword: input.modelKeyword,
        country: input.country,
        minPrice: input.minPrice ?? null,
        maxPrice: input.maxPrice ?? null,
        unsubscribeToken,
        isActive: 1,
      });

      await sendConfirmationEmail({
        to: input.email,
        modelKeyword: input.modelKeyword,
        country: input.country,
        unsubscribeToken,
      });

      return { success: true };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const result = await db
        .update(subscriptions)
        .set({ isActive: 0 })
        .where(eq(subscriptions.unsubscribeToken, input.token));

      return { success: true };
    }),
});
