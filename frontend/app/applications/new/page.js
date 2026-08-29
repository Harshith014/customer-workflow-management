"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import AppLayout from "../../../components/layout/AppLayout";

import api from "../../../lib/api";

const priorities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export default function NewApplicationPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const customerFromUrl =
    searchParams.get(
      "customer"
    );

  const [customers, setCustomers] =
    useState([]);

  const [form, setForm] =
    useState({
      customer:
        customerFromUrl || "",
      title: "",
      description: "",
      priority: "MEDIUM",
    });

  const [loadingCustomers, setLoadingCustomers] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadCustomers =
      async () => {
        try {
          const response =
            await api.get(
              "/customers?limit=100"
            );

          setCustomers(
            response.data.customers
          );
        } catch (error) {
          setError(
            error.message ||
              "Failed to load customers"
          );
        } finally {
          setLoadingCustomers(
            false
          );
        }
      };

    loadCustomers();
  }, []);

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setLoading(true);

      try {
        const response =
          await api.post(
            "/applications",
            form
          );

        const application =
          response.data
            .application;

        router.push(
          `/applications/${application._id}`
        );
      } catch (error) {
        setError(
          error.message ||
            "Failed to create application"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href="/applications"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Applications
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Create Application
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create a new customer application.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6"
        >
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Application Information
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Customer
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  value={
                    form.customer
                  }
                  onChange={(event) =>
                    updateField(
                      "customer",
                      event.target
                        .value
                    )
                  }
                  required
                  disabled={
                    loadingCustomers
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">
                    {loadingCustomers
                      ? "Loading customers..."
                      : "Select customer"}
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={
                          customer._id
                        }
                        value={
                          customer._id
                        }
                      >
                        {
                          customer.name
                        }{" "}
                        —{" "}
                        {
                          customer.email
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Application Title
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <input
                  value={
                    form.title
                  }
                  onChange={(event) =>
                    updateField(
                      "title",
                      event.target
                        .value
                    )
                  }
                  required
                  placeholder="e.g. Customer verification application"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target
                        .value
                    )
                  }
                  rows="5"
                  placeholder="Describe what this application relates to..."
                  className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Priority
                </label>

                <select
                  value={
                    form.priority
                  }
                  onChange={(event) =>
                    updateField(
                      "priority",
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                >
                  {priorities.map(
                    (priority) => (
                      <option
                        key={
                          priority
                        }
                        value={
                          priority
                        }
                      >
                        {priority}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link
              href="/applications"
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                loading ||
                loadingCustomers
              }
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Application"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}