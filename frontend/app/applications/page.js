"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import AppLayout from "../../components/layout/AppLayout";

import api from "../../lib/api";

const stages = [
  {
    value: "",
    label: "All stages",
  },
  {
    value: "NEW",
    label: "New",
  },
  {
    value:
      "WAITING_FOR_INFORMATION",
    label: "Waiting for Information",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
  },
  {
    value: "UNDER_REVIEW",
    label: "Under Review",
  },
  {
    value: "COMPLETED",
    label: "Completed",
  },
];

const priorities = [
  {
    value: "",
    label: "All priorities",
  },
  {
    value: "LOW",
    label: "Low",
  },
  {
    value: "MEDIUM",
    label: "Medium",
  },
  {
    value: "HIGH",
    label: "High",
  },
  {
    value: "URGENT",
    label: "Urgent",
  },
];

export default function ApplicationsPage() {
  const [
    applications,
    setApplications,
  ] = useState([]);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    stage,
    setStage,
  ] = useState("");

  const [
    priority,
    setPriority,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadApplications =
    async (
      page = 1
    ) => {
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

        if (stage) {
          params.set(
            "stage",
            stage
          );
        }

        if (priority) {
          params.set(
            "priority",
            priority
          );
        }

        const response =
          await api.get(
            `/applications?${params.toString()}`
          );

        setApplications(
          response.data
            .applications
        );

        setPagination(
          response.data
            .pagination
        );
      } catch (error) {
        setError(
          error.message ||
            "Failed to load applications"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadApplications(1);
  }, [stage, priority]);

  const handleSearch =
    (event) => {
      event.preventDefault();

      loadApplications(1);
    };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Applications
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Search, filter and manage customer applications.
            </p>
          </div>

          <Link
            href="/applications/new"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800"
          >
            + New Application
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <form
            onSubmit={
              handleSearch
            }
            className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]"
          >
            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search application number, title..."
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />

            <select
              value={stage}
              onChange={(event) =>
                setStage(
                  event.target.value
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
            >
              {stages.map(
                (item) => (
                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
            >
              {priorities.map(
                (item) => (
                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>

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
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <TableHeader>
                    Application
                  </TableHeader>

                  <TableHeader>
                    Customer
                  </TableHeader>

                  <TableHeader>
                    Stage
                  </TableHeader>

                  <TableHeader>
                    Priority
                  </TableHeader>

                  <TableHeader>
                    Assigned To
                  </TableHeader>

                  <TableHeader>
                    Created
                  </TableHeader>

                  <TableHeader>
                    Action
                  </TableHeader>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      Loading applications...
                    </td>
                  </tr>
                ) : applications.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  applications.map(
                    (application) => (
                      <ApplicationRow
                        key={
                          application._id
                        }
                        application={
                          application
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
              loadApplications
            }
          />
        </div>
      </div>
    </AppLayout>
  );
}

function TableHeader({
  children,
}) {
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function ApplicationRow({
  application,
}) {
  const customer =
    application.customer;

  const assigned =
    application.assignedTo;

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
      <td className="px-5 py-4">
        <div className="font-semibold text-slate-900">
          {
            application.applicationNumber
          }
        </div>

        <div className="mt-1 max-w-xs truncate text-sm text-slate-500">
          {application.title}
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-slate-700">
        {customer
          ? `${customer.name}`
          : "-"}
      </td>

      <td className="px-5 py-4">
        <StageBadge
          stage={
            application.stage
          }
        />
      </td>

      <td className="px-5 py-4">
        <PriorityBadge
          priority={
            application.priority
          }
        />
      </td>

      <td className="px-5 py-4 text-sm text-slate-700">
        {assigned
          ? `${assigned.name}`
          : "Unassigned"}
      </td>

      <td className="px-5 py-4 text-sm text-slate-500">
        {formatDate(
          application.createdAt
        )}
      </td>

      <td className="px-5 py-4">
        <Link
          href={`/applications/${application._id}`}
          className="text-sm font-semibold text-slate-900 hover:underline"
        >
          View
        </Link>
      </td>
    </tr>
  );
}

function StageBadge({
  stage,
}) {
  const labels = {
    NEW: "New",
    WAITING_FOR_INFORMATION:
      "Waiting for Information",
    IN_PROGRESS: "In Progress",
    UNDER_REVIEW: "Under Review",
    COMPLETED: "Completed",
  };

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {labels[stage] ||
        stage}
    </span>
  );
}

function PriorityBadge({
  priority,
}) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {priority}
    </span>
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
            pagination.page <= 1
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