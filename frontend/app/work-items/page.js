"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppLayout from "../../components/layout/AppLayout";
import api from "../../lib/api";

const STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export default function WorkItemsPage() {
  const [workItems, setWorkItems] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchWorkItems = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        params.set("page", page);
        params.set("limit", "10");

        if (status) {
          params.set("status", status);
        }

        if (assignedTo) {
          params.set("assignedTo", assignedTo);
        }

        const response = await api.get(
          `/work-items?${params.toString()}`
        );

        setWorkItems(
          response.data?.workItems || []
        );

        setPagination(
          response.data?.data?.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (error) {
        console.error(
          "Failed to fetch work items:",
          error
        );

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load work items"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWorkItems();
  }, [
    page,
    status,
    assignedTo,
    refreshKey,
  ]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response =
          await api.get("/users");

        setUsers(
          response.data || []
        );
      } catch (error) {
        console.error(
          "Failed to fetch users:",
          error
        );
      }
    };

    fetchUsers();
  }, []);

  const filteredWorkItems =
    workItems.filter((item) => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return true;
      }

      return (
        item.title
          ?.toLowerCase()
          .includes(value) ||
        item.description
          ?.toLowerCase()
          .includes(value) ||
        item.application?.applicationNumber
          ?.toLowerCase()
          .includes(value) ||
        item.application?.title
          ?.toLowerCase()
          .includes(value) ||
        item.assignedTo?.name
          ?.toLowerCase()
          .includes(value)
      );
    });

  const handleCreated = () => {
    setShowCreateForm(false);
    setPage(1);

    setRefreshKey(
      (current) => current + 1
    );
  };

  const handleUpdated = () => {
    setRefreshKey(
      (current) => current + 1
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setAssignedTo("");
    setPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Work Items
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage and track work associated with applications.
            </p>
          </div>

          <button
            onClick={() =>
              setShowCreateForm(
                (current) => !current
              )
            }
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {showCreateForm
              ? "Cancel"
              : "+ Create Work Item"}
          </button>

        </div>

        {/* CREATE FORM */}
        {showCreateForm && (
          <CreateWorkItemForm
            users={users}
            onCreated={handleCreated}
            onCancel={() =>
              setShowCreateForm(false)
            }
          />
        )}

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">

            <div className="flex items-start gap-3">

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
                !
              </div>

              <div>
                <p className="font-semibold text-red-800">
                  Unable to load work items
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>

            </div>

          </div>
        )}

        {/* FILTERS */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-3">

            {/* SEARCH */}
            <div className="relative">

              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search work items..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

            </div>

            {/* STATUS */}
            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value
                );
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">
                All statuses
              </option>

              <option value="TODO">
                To Do
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>
            </select>

            {/* ASSIGNEE */}
            <select
              value={assignedTo}
              onChange={(event) => {
                setAssignedTo(
                  event.target.value
                );
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">
                All assignees
              </option>

              {users.map((user) => (
                <option
                  key={user._id}
                  value={user._id}
                >
                  {user.name}
                </option>
              ))}
            </select>

          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredWorkItems.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {pagination.total}
              </span>{" "}
              work items
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="text-left text-sm font-semibold text-slate-600 hover:text-slate-900 sm:text-right"
            >
              Clear filters
            </button>

          </div>

        </section>

        {/* TABLE */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <h2 className="text-lg font-bold text-slate-900">
              All Work Items
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Work that needs to be completed for applications.
            </p>

          </div>

          {loading ? (
            <WorkItemsLoading />
          ) : filteredWorkItems.length === 0 ? (
            <EmptyWorkItems
              hasFilters={
                Boolean(
                  search.trim() ||
                    status ||
                    assignedTo
                )
              }
              onCreate={() =>
                setShowCreateForm(true)
              }
            />
          ) : (
            <>
              <WorkItemsTable
                workItems={
                  filteredWorkItems
                }
                users={users}
                onUpdated={
                  handleUpdated
                }
              />

              <Pagination
                pagination={pagination}
                onPageChange={setPage}
              />
            </>
          )}

        </section>

      </div>
    </AppLayout>
  );
}


/* =========================================================
   CREATE WORK ITEM
========================================================= */

function CreateWorkItemForm({
  users,
  onCreated,
  onCancel,
}) {
  const [application, setApplication] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [assignedTo, setAssignedTo] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const submit = async (event) => {
    event.preventDefault();

    if (
      !application.trim() ||
      !title.trim()
    ) {
      setError(
        "Application ID and title are required."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/work-items", {
        application:
          application.trim(),
        title: title.trim(),
        description:
          description.trim(),
        assignedTo:
          assignedTo || null,
        dueDate:
          dueDate || null,
      });

      setApplication("");
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");

      onCreated();
    } catch (error) {
      console.error(
        "Create work item error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create work item"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">

        <h2 className="text-lg font-bold text-slate-900">
          Create Work Item
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Create work that needs to be completed for an application.
        </p>

      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="space-y-5"
      >

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Application ID
          </label>

          <input
            type="text"
            value={application}
            onChange={(event) =>
              setApplication(
                event.target.value
              )
            }
            placeholder="Enter application ID"
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />

          <p className="mt-1.5 text-xs text-slate-400">
            Use the MongoDB application ID.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(
                event.target.value
              )
            }
            placeholder="e.g. Verify submitted documents"
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            rows={4}
            placeholder="Describe the work that needs to be completed..."
            className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Assign To
            </label>

            <select
              value={assignedTo}
              onChange={(event) =>
                setAssignedTo(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">
                No assignment
              </option>

              {users.map((user) => (
                <option
                  key={user._id}
                  value={user._id}
                >
                  {user.name} —{" "}
                  {user.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Due Date
            </label>

            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : "Create Work Item"}
          </button>

        </div>

      </form>
    </section>
  );
}


/* =========================================================
   TABLE
========================================================= */

function WorkItemsTable({
  workItems,
  users,
  onUpdated,
}) {
  return (
    <div className="overflow-x-auto">

      <table className="w-full min-w-[1050px]">

        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Work Item
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Application
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assignee
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Due Date
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>

            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Action
            </th>

          </tr>
        </thead>

        <tbody>
          {workItems.map((item) => (
            <WorkItemRow
              key={item._id}
              item={item}
              users={users}
              onUpdated={onUpdated}
            />
          ))}
        </tbody>

      </table>

    </div>
  );
}


/* =========================================================
   ROW
========================================================= */

function WorkItemRow({
  item,
  users,
  onUpdated,
}) {
  const [updating, setUpdating] =
    useState(false);

  const [error, setError] =
    useState("");

  const changeStatus =
    async (nextStatus) => {
      if (
        nextStatus ===
        item.status
      ) {
        return;
      }

      try {
        setUpdating(true);
        setError("");

        await api.patch(
          `/work-items/${item._id}/status`,
          {
            status: nextStatus,
            version: item.version,
          }
        );

        onUpdated();
      } catch (error) {
        console.error(
          "Update work item status error:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Failed to update status"
        );
      } finally {
        setUpdating(false);
      }
    };

  return (
    <tr className="border-b border-slate-100 transition hover:bg-slate-50">

      {/* WORK ITEM */}
      <td className="px-6 py-5">

        <div className="flex items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
            ✓
          </div>

          <div className="min-w-0">

            <div className="font-semibold text-slate-900">
              {item.title}
            </div>

            {item.description && (
              <div className="mt-1 max-w-xs truncate text-sm text-slate-500">
                {item.description}
              </div>
            )}

            {error && (
              <div className="mt-1 text-xs font-medium text-red-600">
                {error}
              </div>
            )}

          </div>

        </div>

      </td>

      {/* APPLICATION */}
      <td className="px-6 py-5">

        {item.application ? (
          <Link
            href={`/applications/${item.application._id}`}
            className="group"
          >
            <div className="text-sm font-semibold text-slate-900 group-hover:underline">
              {
                item.application
                  .applicationNumber
              }
            </div>

            <div className="mt-1 max-w-[220px] truncate text-sm text-slate-500">
              {
                item.application
                  .title
              }
            </div>
          </Link>
        ) : (
          <span className="text-sm text-slate-400">
            —
          </span>
        )}

      </td>

      {/* ASSIGNEE */}
      <td className="px-6 py-5">

        {item.assignedTo ? (
          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
              {getInitials(
                item.assignedTo.name
              )}
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-900">
                {
                  item.assignedTo
                    .name
                }
              </div>

              <div className="text-xs text-slate-500">
                {
                  item.assignedTo
                    .role
                }
              </div>
            </div>

          </div>
        ) : (
          <span className="text-sm text-slate-400">
            Unassigned
          </span>
        )}

      </td>

      {/* DUE DATE */}
      <td className="px-6 py-5">

        <span className="text-sm text-slate-600">
          {item.dueDate
            ? formatDate(
                item.dueDate
              )
            : "No due date"}
        </span>

      </td>

      {/* STATUS */}
      <td className="px-6 py-5">

        <select
          value={item.status}
          disabled={
            updating ||
            item.status ===
              "COMPLETED"
          }
          onChange={(event) =>
            changeStatus(
              event.target.value
            )
          }
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none ${
            item.status ===
            "COMPLETED"
              ? "border-green-200 bg-green-100 text-green-700"
              : item.status ===
                "IN_PROGRESS"
              ? "border-blue-200 bg-blue-100 text-blue-700"
              : "border-slate-200 bg-slate-100 text-slate-700"
          }`}
        >
          <option value="TODO">
            To Do
          </option>

          <option value="IN_PROGRESS">
            In Progress
          </option>

          <option value="COMPLETED">
            Completed
          </option>
        </select>

      </td>

      {/* ACTION */}
      <td className="px-6 py-5 text-right">

        <Link
          href={`/work-items/${item._id}`}
          className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-slate-50"
        >
          View
        </Link>

      </td>

    </tr>
  );
}


/* =========================================================
   PAGINATION
========================================================= */

function Pagination({
  pagination,
  onPageChange,
}) {
  if (
    !pagination ||
    pagination.totalPages <= 1
  ) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">

      <p className="text-sm text-slate-500">
        Page{" "}
        <span className="font-semibold text-slate-900">
          {pagination.page}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-900">
          {pagination.totalPages}
        </span>
      </p>

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
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>

      </div>

    </div>
  );
}


/* =========================================================
   LOADING
========================================================= */

function WorkItemsLoading() {
  return (
    <div className="divide-y divide-slate-100">

      {[1, 2, 3, 4, 5].map(
        (item) => (
          <div
            key={item}
            className="flex items-center gap-4 px-6 py-5"
          >

            <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />

            <div className="flex-1 space-y-2">

              <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />

              <div className="h-3 w-72 animate-pulse rounded bg-slate-100" />

            </div>

            <div className="hidden h-6 w-28 animate-pulse rounded-full bg-slate-200 md:block" />

            <div className="hidden h-6 w-20 animate-pulse rounded bg-slate-100 md:block" />

          </div>
        )
      )}

    </div>
  );
}


/* =========================================================
   EMPTY
========================================================= */

function EmptyWorkItems({
  hasFilters,
  onCreate,
}) {
  return (
    <div className="px-6 py-16 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">

        <svg
          className="h-7 w-7 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h4m4-12H7a2 2 0 0 0-2 2v14l3-2 3 2 3-2 3 2V6a2 2 0 0 0-2-2Z"
          />
        </svg>

      </div>

      <h3 className="mt-4 font-semibold text-slate-900">
        {hasFilters
          ? "No work items found"
          : "No work items yet"}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {hasFilters
          ? "Try changing your filters or search criteria."
          : "Create your first work item to get started."}
      </p>

      {!hasFilters && (
        <button
          onClick={onCreate}
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + Create Work Item
        </button>
      )}

    </div>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function getInitials(value) {
  if (!value) {
    return "W";
  }

  const words =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase();
}

function formatDate(value) {
  try {
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
  } catch {
    return "—";
  }
}