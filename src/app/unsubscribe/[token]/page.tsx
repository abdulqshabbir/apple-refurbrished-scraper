import { api } from "~/trpc/server";

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let success = false;

  try {
    await api.subscriptions.unsubscribe({ token });
    success = true;
  } catch {
    success = false;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md text-center">
        {success ? (
          <>
            <h1 className="text-3xl font-bold text-gray-900">Unsubscribed</h1>
            <p className="mt-4 text-gray-600">
              You've been removed from this alert. You won't receive any more
              notifications.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900">Invalid link</h1>
            <p className="mt-4 text-gray-600">
              This unsubscribe link is invalid or has already been used.
            </p>
          </>
        )}
        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Back to home
        </a>
      </div>
    </main>
  );
}
