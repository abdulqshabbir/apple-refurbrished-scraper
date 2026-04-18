export default function ConfirmedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-900">You're subscribed!</h1>
        <p className="mt-4 text-gray-600">
          We'll email you as soon as a matching product appears on the Apple
          Refurbished store.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Set up another alert
        </a>
      </div>
    </main>
  );
}
