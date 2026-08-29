"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import AppLayout from "../../../components/layout/AppLayout";

import api from "../../../lib/api";

export default function CustomerDetailsPage() {
  const params =
    useParams();

  const id = params.id;

  const [customer, setCustomer] =
    useState(null);

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadCustomer =
      async () => {
        setLoading(true);
        setError("");

        try {
          const [
            customerResponse,
            applicationsResponse,
          ] = await Promise.all([
            api.get(
              `/customers/${id}`
            ),

            api.get(
              `/applications?customer=${id}`
            ),
          ]);

          setCustomer(
            customerResponse.data
              .customer
          );

          setApplications(
            applicationsResponse
              .data.applications
          );
        } catch (error) {
          setError(
            error.message ||
              "Failed to load customer"
          );
        } finally {
          setLoading(false);
        }
      };

    loadCustomer();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-sm text-slate-500">
          Loading customer...
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-sm text-slate-500">
          Customer not found.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <Link
            href="/customers"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Customers
          </Link>

          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {customer.name}{" "}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Customer profile and associated applications.
              </p>
            </div>

            <Link
              href={`/applications/new?customer=${customer._id}`}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Create Application
            </Link>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Customer Information
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Info
              label="First Name"
              value={
                customer.firstName
              }
            />

            <Info
              label="Email"
              value={
                customer.email
              }
            />

            <Info
              label="Phone"
              value={
                customer.phone
              }
            />

            <Info
              label="Date of Birth"
              value={formatDate(
                customer.dateOfBirth
              )}
            />

            <Info
              label="Created"
              value={formatDate(
                customer.createdAt
              )}
            />
          </div>

          {customer.address && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Address
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {customer.address
                  .line1}

                {customer.address
                  .line2 && (
                  <>
                    <br />
                    {
                      customer
                        .address
                        .line2
                    }
                  </>
                )}

                <br />

                {customer.address
                  .city}
                ,{" "}
                {
                  customer.address
                    .state
                }{" "}
                {
                  customer.address
                    .postalCode
                }

                <br />

                {
                  customer.address
                    .country
                }
              </p>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Applications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Applications associated with this customer.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {
                applications.length
              }
            </span>
          </div>

          {applications.length ===
          0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No applications found for this customer.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.map(
                (application) => (
                  <Link
                    key={
                      application._id
                    }
                    href={`/applications/${application._id}`}
                    className="flex flex-col justify-between gap-3 px-6 py-5 hover:bg-slate-50 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {
                          application.applicationNumber
                        }
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {
                          application.title
                        }
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {
                          application.stage
                        }
                      </span>

                      <span className="text-sm text-slate-400">
                        →
                      </span>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}

function Info({
  label,
  value,
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium text-slate-900">
        {value || "-"}
      </div>
    </div>
  );
}

function formatDate(
  value
) {
  if (!value) {
    return "-";
  }

  return new Date(
    value
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}