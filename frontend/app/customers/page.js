"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import AppLayout from "../../components/layout/AppLayout";

import api from "../../lib/api";

export default function CustomersPage() {
  const [customers, setCustomers] =
    useState([]);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadCustomers =
    async (page = 1) => {
      setLoading(true);
      setError("");

      try {
        const params =
          new URLSearchParams();

        params.set(
          "page",
          page
        );

        params.set(
          "limit",
          "10"
        );

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        const response =
          await api.get(
            `/customers?${params.toString()}`
          );

        setCustomers(
          response.data.customers
        );

        setPagination(
          response.data.pagination
        );
      } catch (error) {
        setError(
          error.message ||
            "Failed to load customers"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadCustomers(1);
  }, []);

  const handleSearch =
    (event) => {
      event.preventDefault();

      loadCustomers(1);
    };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Customers
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage customer information and applications.
            </p>
          </div>

          <Link
            href="/customers/new"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            + New Customer
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <form
            onSubmit={
              handleSearch
            }
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search name, email, phone..."
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Search
            </button>
          </form>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map(
                    (customer) => (
                      <CustomerRow
                        key={
                          customer._id
                        }
                        customer={
                          customer
                        }
                      />
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={
              pagination
            }
            onPageChange={
              loadCustomers
            }
          />
        </div>
      </div>
    </AppLayout>
  );
}

function CustomerRow({
  customer,
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="px-5 py-4">
        <div className="font-semibold text-slate-900">
          {customer.name}{" "}
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-slate-600">
        {customer.email}
      </td>

      <td className="px-5 py-4 text-sm text-slate-600">
        {customer.phone ||
          "-"}
      </td>

      <td className="px-5 py-4 text-sm text-slate-500">
        {formatDate(
          customer.createdAt
        )}
      </td>

      <td className="px-5 py-4">
        <Link
          href={`/customers/${customer._id}`}
          className="text-sm font-semibold text-slate-900 hover:underline"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function Pagination({
  pagination,
  onPageChange,
}) {
  if (
    pagination.totalPages <=
    1
  ) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
      <div className="text-sm text-slate-500">
        Page{" "}
        <strong>
          {pagination.page}
        </strong>{" "}
        of{" "}
        <strong>
          {
            pagination.totalPages
          }
        </strong>
      </div>

      <div className="flex gap-2">
        <button
          disabled={
            pagination.page <=
            1
          }
          onClick={() =>
            onPageChange(
              pagination.page - 1
            )
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <button
          disabled={
            pagination.page >=
            pagination.totalPages
          }
          onClick={() =>
            onPageChange(
              pagination.page + 1
            )
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
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