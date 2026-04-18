import { Resend } from "resend";
import { env } from "~/env";
import { COUNTRIES } from "./countries";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendConfirmationEmail({
  to,
  modelKeyword,
  country,
  unsubscribeToken,
}: {
  to: string;
  modelKeyword: string;
  country: string;
  unsubscribeToken: string;
}) {
  const countryName = COUNTRIES[country]?.name ?? country.toUpperCase();
  const unsubscribeUrl = `${env.NEXT_PUBLIC_APP_URL}/unsubscribe/${unsubscribeToken}`;

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: `Alert set: "${modelKeyword}" on Apple Refurbished (${countryName})`,
    html: `
      <h2>You're subscribed!</h2>
      <p>We'll notify you when <strong>${modelKeyword}</strong> appears on the Apple Refurbished store in <strong>${countryName}</strong>.</p>
      <p><a href="${unsubscribeUrl}">Unsubscribe</a></p>
    `,
  });
}

export async function sendAlertEmail({
  to,
  productTitle,
  productPrice,
  productUrl,
  country,
  unsubscribeToken,
}: {
  to: string;
  productTitle: string;
  productPrice: number;
  productUrl: string;
  country: string;
  unsubscribeToken: string;
}) {
  const countryName = COUNTRIES[country]?.name ?? country.toUpperCase();
  const priceFormatted = (productPrice / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  const unsubscribeUrl = `${env.NEXT_PUBLIC_APP_URL}/unsubscribe/${unsubscribeToken}`;

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: `Apple Refurbished alert: ${productTitle}`,
    html: `
      <h2>New match on Apple Refurbished (${countryName})</h2>
      <p><strong>${productTitle}</strong> — ${priceFormatted}</p>
      <p><a href="${productUrl}">View on Apple</a></p>
      <hr />
      <p><a href="${unsubscribeUrl}">Unsubscribe from this alert</a></p>
    `,
  });
}
