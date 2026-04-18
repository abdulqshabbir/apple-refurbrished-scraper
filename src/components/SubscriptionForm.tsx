"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { COUNTRIES } from "~/lib/countries";

export function SubscriptionForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const create = api.subscriptions.create.useMutation({
    onSuccess: () => router.push("/subscribe/confirmed"),
    onError: (e) => setError(e.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const minPriceRaw = form.get("minPrice") as string;
    const maxPriceRaw = form.get("maxPrice") as string;

    create.mutate({
      email: form.get("email") as string,
      modelKeyword: form.get("modelKeyword") as string,
      country: form.get("country") as string,
      minPrice: minPriceRaw ? Math.round(parseFloat(minPriceRaw) * 100) : undefined,
      maxPrice: maxPriceRaw ? Math.round(parseFloat(maxPriceRaw) * 100) : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Model keyword
        </label>
        <input
          name="modelKeyword"
          type="text"
          required
          placeholder='e.g. "MacBook Pro 14"'
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Country
        </label>
        <select
          name="country"
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(COUNTRIES).map(([code, { name }]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Min price (optional)
          </label>
          <input
            name="minPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Max price (optional)
          </label>
          <input
            name="maxPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="9999.00"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={create.isPending}
        className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {create.isPending ? "Setting up alert…" : "Notify me"}
      </button>
    </form>
  );
}
