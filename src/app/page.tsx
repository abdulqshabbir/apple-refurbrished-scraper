import { HydrateClient } from "~/trpc/server";
import { SubscriptionForm } from "~/components/SubscriptionForm";

export default function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Apple Refurbished Alerts
            </h1>
            <p className="mt-2 text-gray-600">
              Get notified when a refurbished Apple product matching your search
              becomes available.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <SubscriptionForm />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
