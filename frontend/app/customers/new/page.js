"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Link from "next/link";

import AppLayout from "../../../components/layout/AppLayout";

import api from "../../../lib/api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  },
};

export default function NewCustomerPage() {
  const router =
    useRouter();

  const [form, setForm] =
    useState(initialForm);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateAddress = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
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
            "/customers",
            form
          );

        const customer =
          response.data.customer;

        router.push(
          `/customers/${customer._id}`
        );
      } catch (error) {
        setError(
          error.message ||
            "Failed to create customer"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link
            href="/customers"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Customers
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Create Customer
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Add customer information to the system.
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
            <SectionTitle>
              Personal Information
            </SectionTitle>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField
                label="name"
                required
                value={
                  form.name
                }
                onChange={(value) =>
                  updateField(
                    "name",
                    value
                  )
                }
              />

              <FormField
                label="Email"
                type="email"
                required
                value={
                  form.email
                }
                onChange={(value) =>
                  updateField(
                    "email",
                    value
                  )
                }
              />

              <FormField
                label="Phone"
                value={
                  form.phone
                }
                onChange={(value) =>
                  updateField(
                    "phone",
                    value
                  )
                }
              />

              <FormField
                label="Date of Birth"
                type="date"
                value={
                  form.dateOfBirth
                }
                onChange={(value) =>
                  updateField(
                    "dateOfBirth",
                    value
                  )
                }
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle>
              Address
            </SectionTitle>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField
                  label="Address Line 1"
                  value={
                    form.address
                      .line1
                  }
                  onChange={(value) =>
                    updateAddress(
                      "line1",
                      value
                    )
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <FormField
                  label="Address Line 2"
                  value={
                    form.address
                      .line2
                  }
                  onChange={(value) =>
                    updateAddress(
                      "line2",
                      value
                    )
                  }
                />
              </div>

              <FormField
                label="City"
                value={
                  form.address
                    .city
                }
                onChange={(value) =>
                  updateAddress(
                    "city",
                    value
                  )
                }
              />

              <FormField
                label="State"
                value={
                  form.address
                    .state
                }
                onChange={(value) =>
                  updateAddress(
                    "state",
                    value
                  )
                }
              />

              <FormField
                label="Postal Code"
                value={
                  form.address
                    .postalCode
                }
                onChange={(value) =>
                  updateAddress(
                    "postalCode",
                    value
                  )
                }
              />

              <FormField
                label="Country"
                value={
                  form.address
                    .country
                }
                onChange={(value) =>
                  updateAddress(
                    "country",
                    value
                  )
                }
              />
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link
              href="/customers"
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating..."
                : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

function SectionTitle({
  children,
}) {
  return (
    <h2 className="text-lg font-bold text-slate-900">
      {children}
    </h2>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        required={required}
        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}