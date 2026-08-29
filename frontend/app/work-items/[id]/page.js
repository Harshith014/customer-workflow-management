"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import AppLayout from "../../../components/layout/AppLayout";
import api from "../../../lib/api";

const STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

const STATUS_ORDER = [
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
];

export default function WorkItemDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id;

  const [workItem, setWorkItem] =
    useState(null);

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [assigning, setAssigning] =
    useState(false);

  const [changingStatus, setChangingStatus] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const fetchWorkItem = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/work-items/${id}`
      );

      setWorkItem(
        response.data?.workItem ||
          null
      );
    } catch (error) {
      console.error(
        "Failed to fetch work item:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load work item"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchWorkItem();
  }, [id]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response =
          await api.get("/users");

        setUsers(
          response.data?.data || []
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

  const updateWorkItem = async (
    values
  ) => {
    try {
      setSaving(true);
      setActionError("");

      const response =
        await api.patch(
          `/work-items/${workItem._id}`,
          {
            ...values,
            version:
              workItem.version,
          }
        );

      const updated =
        response.data?.data?.workItem;

      if (updated) {
        setWorkItem(updated);
      }

      setEditing(false);
    } catch (error) {
      console.error(
        "Update work item error:",
        error
      );

      setActionError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update work item"
      );
    } finally {
      setSaving(false);
    }
  };

  const assignWorkItem = async (
    assignedTo
  ) => {
    try {
      setAssigning(true);
      setActionError("");

      const response =
        await api.patch(
          `/work-items/${workItem._id}/assign`,
          {
            assignedTo:
              assignedTo || null,
            version:
              workItem.version,
          }
        );

      const updated =
        response.data?.data?.workItem;

      if (updated) {
        setWorkItem(updated);
      }
    } catch (error) {
      console.error(
        "Assign work item error:",
        error
      );

      setActionError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update assignment"
      );
    } finally {
      setAssigning(false);
    }
  };

  const changeStatus = async (
    nextStatus
  ) => {
    if (
      nextStatus === workItem.status
    ) {
      return;
    }

    try {
      setChangingStatus(true);
      setActionError("");

      const response =
        await api.patch(
          `/work-items/${workItem._id}/status`,
          {
            status: nextStatus,
            version:
              workItem.version,
          }
        );

      const updated =
        response.data?.workItem;

      if (updated) {
        setWorkItem(updated);
      }
    } catch (error) {
      console.error(
        "Change work item status error:",
        error
      );

      setActionError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update work item status"
      );
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <WorkItemDetailsLoading />
      </AppLayout>
    );
  }

  if (error || !workItem) {
    return (
      <AppLayout>
        <div className="space-y-6">

          <Link
            href="/workItems"
            className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            ← Back to Work Items
          </Link>

          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
              !
            </div>

            <h2 className="mt-4 font-bold text-red-900">
              Unable to load work item
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error ||
                "Work item not found"}
            </p>

            <button
              onClick={() =>
                router.back()
              }
              className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Go Back
            </button>

          </div>

        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* BACK */}
        <Link
          href="/workItems"
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          ← Back to Work Items
        </Link>

        {/* HEADER */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                  ✓
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">

                    <h1 className="text-2xl font-bold text-slate-900">
                      {workItem.title}
                    </h1>

                    <StatusBadge
                      status={
                        workItem.status
                      }
                    />

                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Work Item ID:{" "}
                    <span className="font-medium text-slate-700">
                      {workItem._id}
                    </span>
                  </p>

                </div>

              </div>

              <div className="flex flex-wrap gap-2">

                {workItem.status !==
                  "COMPLETED" && (
                  <button
                    onClick={() =>
                      setEditing(
                        true
                      )
                    }
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                )}

              </div>

            </div>

          </div>

          {/* STATUS PROGRESS */}
          <div className="border-t border-slate-200 px-6 py-5">

            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Progress
            </div>

            <StatusProgress
              currentStatus={
                workItem.status
              }
            />

          </div>

        </section>

        {/* ACTION ERROR */}
        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">

            <div className="flex items-start gap-3">

              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
                !
              </div>

              <div>
                <p className="font-semibold text-red-800">
                  Action failed
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {actionError}
                </p>
              </div>

            </div>

          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* MAIN */}
          <div className="space-y-6 lg:col-span-2">

            {/* DESCRIPTION */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-lg font-bold text-slate-900">
                  Work Details
                </h2>

              </div>

              <div className="p-6">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {workItem.description ||
                      "No description provided."}
                  </p>
                </div>

              </div>

            </section>

            {/* APPLICATION */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-lg font-bold text-slate-900">
                  Application
                </h2>

              </div>

              <div className="p-6">

                {workItem.application ? (
                  <Link
                    href={`/applications/${workItem.application._id}`}
                    className="block rounded-xl border border-slate-200 p-5 transition hover:border-slate-400 hover:bg-slate-50"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Application Number
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {
                            workItem
                              .application
                              .applicationNumber
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            workItem
                              .application
                              .title
                          }
                        </p>

                      </div>

                      <div className="flex gap-3">

                        <InfoBadge
                          label="Stage"
                          value={
                            workItem
                              .application
                              .stage
                          }
                        />

                        <InfoBadge
                          label="Priority"
                          value={
                            workItem
                              .application
                              .priority
                          }
                        />

                      </div>

                    </div>

                  </Link>
                ) : (
                  <p className="text-sm text-slate-400">
                    No application information available.
                  </p>
                )}

              </div>

            </section>

            {/* STATUS ACTION */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-lg font-bold text-slate-900">
                  Update Progress
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Move the work item through its processing stages.
                </p>

              </div>

              <div className="p-6">

                <div className="grid gap-3 sm:grid-cols-3">

                  {STATUS_ORDER.map(
                    (status) => {
                      const isCurrent =
                        workItem.status ===
                        status;

                      const isCompleted =
                        STATUS_ORDER.indexOf(
                          status
                        ) <
                        STATUS_ORDER.indexOf(
                          workItem.status
                        );

                      const disabled =
                        changingStatus ||
                        isCurrent ||
                        workItem.status ===
                          "COMPLETED";

                      return (
                        <button
                          key={status}
                          disabled={
                            disabled
                          }
                          onClick={() =>
                            changeStatus(
                              status
                            )
                          }
                          className={`rounded-xl border px-4 py-4 text-left transition ${
                            isCurrent
                              ? "border-slate-900 bg-slate-900 text-white"
                              : isCompleted
                              ? "border-slate-200 bg-slate-50 text-slate-500"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-50"
                          } ${
                            disabled &&
                            !isCurrent
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }`}
                        >

                          <div className="flex items-center justify-between">

                            <span className="text-sm font-semibold">
                              {
                                STATUS_LABELS[
                                  status
                                ]
                              }
                            </span>

                            {isCurrent && (
                              <span className="text-xs">
                                Current
                              </span>
                            )}

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

            </section>

          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">

            {/* ASSIGNMENT */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-lg font-bold text-slate-900">
                  Assignment
                </h2>

              </div>

              <div className="space-y-5 p-6">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assigned To
                  </p>

                  {workItem.assignedTo ? (
                    <div className="mt-3 flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                        {getInitials(
                          workItem
                            .assignedTo
                            .name
                        )}
                      </div>

                      <div>

                        <p className="text-sm font-semibold text-slate-900">
                          {
                            workItem
                              .assignedTo
                              .name
                          }
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {
                            workItem
                              .assignedTo
                              .email
                          }
                        </p>

                      </div>

                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">
                      Unassigned
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Assigned Team
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {workItem.assignedTeam
                      ?.name ||
                      "No team assigned"}
                  </p>
                </div>

                {workItem.status !==
                  "COMPLETED" && (
                  <AssignmentControl
                    users={users}
                    currentUser={
                      workItem
                        .assignedTo
                    }
                    version={
                      workItem.version
                    }
                    loading={
                      assigning
                    }
                    onAssign={
                      assignWorkItem
                    }
                  />
                )}

              </div>

            </section>

            {/* DUE DATE */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-lg font-bold text-slate-900">
                  Schedule
                </h2>

              </div>

              <div className="space-y-5 p-6">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Due Date
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {workItem.dueDate
                      ? formatDate(
                          workItem.dueDate
                        )
                      : "No due date"}
                  </p>
                </div>

                {workItem.completedAt && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Completed
                    </p>

                    <p className="mt-2 text-sm font-semibold text-green-700">
                      {formatDateTime(
                        workItem.completedAt
                      )}
                    </p>
                  </div>
                )}

              </div>

            </section>

            {/* CREATED BY */}
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">

                <h2 className="text-lg font-bold text-slate-900">
                  Information
                </h2>

              </div>

              <div className="space-y-5 p-6">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created By
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {
                      workItem
                        .createdBy
                        ?.name ||
                      "—"
                    }
                  </p>

                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </p>

                  <p className="mt-2 text-sm text-slate-700">
                    {workItem.createdAt
                      ? formatDateTime(
                          workItem.createdAt
                        )
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last Updated
                  </p>

                  <p className="mt-2 text-sm text-slate-700">
                    {workItem.updatedAt
                      ? formatDateTime(
                          workItem.updatedAt
                        )
                      : "—"}
                  </p>
                </div>

              </div>

            </section>

          </div>

        </div>

        {/* EDIT MODAL */}
        {editing && (
          <EditWorkItemModal
            workItem={workItem}
            saving={saving}
            onClose={() =>
              setEditing(false)
            }
            onSave={
              updateWorkItem
            }
          />
        )}

      </div>
    </AppLayout>
  );
}


/* =========================================================
   ASSIGNMENT CONTROL
========================================================= */

function AssignmentControl({
  users,
  currentUser,
  loading,
  onAssign,
}) {
  const currentId =
    currentUser?._id || "";

  return (
    <div className="border-t border-slate-100 pt-5">

      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Assign / Reassign
      </label>

      <select
        value={currentId}
        disabled={loading}
        onChange={(event) =>
          onAssign(
            event.target.value
          )
        }
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:opacity-50"
      >

        <option value="">
          Unassigned
        </option>

        {users
          .filter(
            (user) =>
              user.isActive
          )
          .map((user) => (
            <option
              key={user._id}
              value={user._id}
            >
              {user.name} —{" "}
              {user.role}
            </option>
          ))}

      </select>

      {loading && (
        <p className="mt-2 text-xs text-slate-400">
          Updating assignment...
        </p>
      )}

    </div>
  );
}


/* =========================================================
   EDIT MODAL
========================================================= */

function EditWorkItemModal({
  workItem,
  saving,
  onClose,
  onSave,
}) {
  const [title, setTitle] =
    useState(
      workItem.title || ""
    );

  const [description, setDescription] =
    useState(
      workItem.description || ""
    );

  const [dueDate, setDueDate] =
    useState(
      workItem.dueDate
        ? toInputDate(
            workItem.dueDate
          )
        : ""
    );

  const [error, setError] =
    useState("");

  const submit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Work item title cannot be empty."
      );

      return;
    }

    setError("");

    await onSave({
      title: title.trim(),
      description:
        description.trim(),
      dueDate:
        dueDate || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="border-b border-slate-200 px-6 py-5">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Edit Work Item
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the work item information.
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ×
            </button>

          </div>

        </div>

        <form
          onSubmit={submit}
          className="space-y-5 p-6"
        >

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

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
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
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
              rows={5}
              className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
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

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  const styles = {
    TODO:
      "bg-slate-100 text-slate-700",
    IN_PROGRESS:
      "bg-blue-100 text-blue-700",
    COMPLETED:
      "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ||
        styles.TODO
      }`}
    >
      {STATUS_LABELS[status] ||
        status}
    </span>
  );
}


/* =========================================================
   STATUS PROGRESS
========================================================= */

function StatusProgress({
  currentStatus,
}) {
  const currentIndex =
    STATUS_ORDER.indexOf(
      currentStatus
    );

  return (
    <div className="flex items-center">

      {STATUS_ORDER.map(
        (status, index) => {
          const completed =
            index <= currentIndex;

          return (
            <div
              key={status}
              className="flex flex-1 items-center"
            >

              <div className="flex flex-col items-center">

                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    completed
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {index + 1}
                </div>

                <span
                  className={`mt-2 text-center text-xs font-semibold ${
                    completed
                      ? "text-slate-900"
                      : "text-slate-400"
                  }`}
                >
                  {
                    STATUS_LABELS[
                      status
                    ]
                  }
                </span>

              </div>

              {index <
                STATUS_ORDER.length -
                  1 && (
                <div
                  className={`mx-2 mt-[-20px] h-0.5 flex-1 ${
                    index <
                    currentIndex
                      ? "bg-slate-900"
                      : "bg-slate-200"
                  }`}
                />
              )}

            </div>
          );
        }
      )}

    </div>
  );
}


/* =========================================================
   INFO BADGE
========================================================= */

function InfoBadge({
  label,
  value,
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-700">
        {value || "—"}
      </p>

    </div>
  );
}


/* =========================================================
   LOADING
========================================================= */

function WorkItemDetailsLoading() {
  return (
    <div className="space-y-6">

      <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />

      <section className="rounded-xl border border-slate-200 bg-white p-6">

        <div className="flex items-start gap-4">

          <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />

          <div className="flex-1 space-y-3">

            <div className="h-7 w-72 animate-pulse rounded bg-slate-200" />

            <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />

          </div>

        </div>

        <div className="mt-8 h-2 w-full animate-pulse rounded bg-slate-100" />

      </section>

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <SkeletonCard />
          <SkeletonCard />

        </div>

        <div className="space-y-6">

          <SkeletonCard />
          <SkeletonCard />

        </div>

      </div>

    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">

      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />

      <div className="mt-5 space-y-3">

        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />

        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />

        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />

      </div>

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
  if (!value) {
    return "—";
  }

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

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(
      value
    ).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  } catch {
    return "—";
  }
}

function toInputDate(value) {
  try {
    const date = new Date(value);

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}