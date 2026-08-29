"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { useParams, useRouter } from "next/navigation";

import AppLayout from "../../../components/layout/AppLayout";

import api from "../../../lib/api";

import { useAuth } from "../../../context/AuthContext";

const STAGES = [
  "NEW",
  "WAITING_FOR_INFORMATION",
  "IN_PROGRESS",
  "UNDER_REVIEW",
  "COMPLETED",
];

const STAGE_LABELS = {
  NEW: "New",
  WAITING_FOR_INFORMATION: "Waiting for Information",
  IN_PROGRESS: "In Progress",
  UNDER_REVIEW: "Under Review",
  COMPLETED: "Completed",
};

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const { user } = useAuth();

  const id = params.id;

  const [application, setApplication] = useState(null);

  const [activities, setActivities] = useState([]);

  const [workItems, setWorkItems] = useState([]);

  const [syncRecord, setSyncRecord] = useState(null);

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const loadApplication = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        applicationResponse,
        activityResponse,
        workResponse,
        syncResponse,
      ] = await Promise.all([
        api.get(`/applications/${id}`),

        api.get(`/applications/${id}/activities`),

        api.get(`/work-items?applicationId=${id}`),

        api.get(`/applications/${id}/sync`),
      ]);

      setApplication(applicationResponse.data.application);

      setActivities(activityResponse.data.activities || []);

      setWorkItems(workResponse.data.workItems || []);

      setSyncRecord(syncResponse.data.syncRecord || null);
    } catch (error) {
      setError(error.message || "Failed to load application");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadApplication();
    }
  }, [id]);

  const refreshData = async () => {
    try {
      const [
        applicationResponse,
        activityResponse,
        workResponse,
        syncResponse,
      ] = await Promise.all([
        api.get(`/applications/${id}`),

        api.get(`/applications/${id}/activities`),

        api.get(`/work-items?applicationId=${id}`),

        api.get(`/applications/${id}/sync`),
      ]);

      setApplication(applicationResponse.data.application);

      setActivities(activityResponse.data.activities || []);

      setWorkItems(workResponse.data.workItems || []);

      setSyncRecord(syncResponse.data.syncRecord || null);
    } catch (error) {
      setError(error.message || "Failed to refresh application");
    }
  };

  const changeStage = async (nextStage) => {
    if (!application || nextStage === application.stage) {
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await api.patch(`/applications/${id}/stage`, {
        stage: nextStage,
        version: application.version,
      });

      setSuccessMessage(`Application moved to ${STAGE_LABELS[nextStage]}.`);

      await refreshData();
    } catch (error) {
      setError(error.message || "Failed to change application stage");
    } finally {
      setActionLoading(false);
    }
  };

  const assignApplication = async (userId) => {
    setActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await api.patch(`/applications/${id}/assignment`, {
        assignedTo: userId || null,
        version: application.version,
      });

      setSuccessMessage("Application assignment updated.");

      await refreshData();
    } catch (error) {
      setError(error.message || "Failed to update assignment");
    } finally {
      setActionLoading(false);
    }
  };

  const retrySync = async () => {
    setActionLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await api.post(`/applications/${id}/sync/retry`);

      setSuccessMessage("Synchronization retry scheduled.");

      await refreshData();
    } catch (error) {
      setError(error.message || "Failed to retry synchronization");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-sm text-slate-500">
          Loading application...
        </div>
      </AppLayout>
    );
  }

  if (error && !application) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Link
            href="/applications"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Back to Applications
          </Link>

          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!application) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-sm text-slate-500">
          Application not found.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <ApplicationHeader
          application={application}
          onBack={() => router.push("/applications")}
        />

        {(error || successMessage) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {error || successMessage}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <ApplicationOverview application={application} />

            <WorkflowSection
              application={application}
              onStageChange={changeStage}
              loading={actionLoading}
            />

            <WorkItemsSection
              applicationId={id}
              workItems={workItems}
              onRefresh={refreshData}
            />

            <ActivitySection activities={activities} />
          </div>

          <div className="space-y-6">
            <AssignmentSection
              application={application}
              user={user}
              onAssign={assignApplication}
              loading={actionLoading}
            />

            <SyncSection
              application={application}
              syncRecord={syncRecord}
              onRetry={retrySync}
              loading={actionLoading}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ApplicationHeader({ application, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Back to Applications
      </button>

      <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              {application.applicationNumber}
            </h1>

            <StageBadge stage={application.stage} />

            <PriorityBadge priority={application.priority} />
          </div>

          <p className="mt-2 text-sm text-slate-500">{application.title}</p>
        </div>

        <div className="text-sm text-slate-500">
          Updated {formatDateTime(application.updatedAt)}
        </div>
      </div>
    </div>
  );
}

function ApplicationOverview({ application }) {
  const customer = application.customer;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">
          Application Details
        </h2>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Info
          label="Application Number"
          value={application.applicationNumber}
        />

        <Info
          label="Priority"
          value={PRIORITY_LABELS[application.priority] || application.priority}
        />

        <Info label="Created" value={formatDateTime(application.createdAt)} />

        <Info
          label="Last Updated"
          value={formatDateTime(application.updatedAt)}
        />

        <Info
          label="Current Stage"
          value={STAGE_LABELS[application.stage] || application.stage}
        />

        <Info
          label="Completed"
          value={
            application.completedAt
              ? formatDateTime(application.completedAt)
              : "Not completed"
          }
        />
      </div>

      {application.description && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Description
          </div>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {application.description}
          </p>
        </div>
      )}

      {customer && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Customer
          </div>

          <Link
            href={`/customers/${customer._id}`}
            className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
          >
            <div className="font-semibold text-slate-900">{customer.name} </div>

            <div className="mt-1 text-sm text-slate-500">{customer.email}</div>

            {customer.phone && (
              <div className="mt-1 text-sm text-slate-500">
                {customer.phone}
              </div>
            )}
          </Link>
        </div>
      )}
    </section>
  );
}

function WorkflowSection({ application, onStageChange, loading }) {
  const currentIndex = STAGES.indexOf(application.stage);

  const validNextStages = getValidNextStages(application.stage);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Workflow</h2>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute left-0 right-0 top-4 hidden h-0.5 bg-slate-200 sm:block" />

          <div className="relative grid gap-4 sm:grid-cols-5">
            {STAGES.map((stage, index) => {
              const completed = index < currentIndex;

              const current = index === currentIndex;

              return (
                <div key={stage} className="relative">
                  <div
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      current
                        ? "border-slate-900 bg-slate-900 text-white"
                        : completed
                          ? "border-slate-700 bg-slate-700 text-white"
                          : "border-slate-300 bg-white text-slate-400"
                    }`}
                  >
                    {completed ? "✓" : index + 1}
                  </div>

                  <div
                    className={`mt-2 text-center text-xs font-medium ${
                      current ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {application.stage !== "COMPLETED" && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="text-sm font-semibold text-slate-900">
            Available transitions
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {validNextStages.map((stage) => (
              <button
                key={stage}
                disabled={loading}
                onClick={() => onStageChange(stage)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Move to {STAGE_LABELS[stage]}
              </button>
            ))}
          </div>
        </div>
      )}

      {application.stage === "COMPLETED" && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          This application has been completed.
        </div>
      )}
    </section>
  );
}

function AssignmentSection({ application, user, onAssign, loading }) {
  const assigned = application.assignedTo;

  const canAssign = user?.role === "ADMINISTRATOR" || user?.role === "MANAGER";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Assignment</h2>

      <div className="mt-5 rounded-lg bg-slate-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Responsible User
        </div>

        <div className="mt-2 text-sm font-semibold text-slate-900">
          {assigned ? `${assigned.name}` : "Unassigned"}
        </div>

        {assigned?.email && (
          <div className="mt-1 text-xs text-slate-500">{assigned.email}</div>
        )}
      </div>

      {canAssign && (
        <AssignmentSelector
          application={application}
          onAssign={onAssign}
          loading={loading}
        />
      )}

      {!canAssign && (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          You do not have permission to reassign this application.
        </p>
      )}
    </section>
  );
}

function AssignmentSelector({ application, onAssign, loading }) {
  const [users, setUsers] = useState([]);

  const [value, setValue] = useState(application.assignedTo?._id || "");

  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get("/users?limit=100");

        setUsers(
          (response.data || []).filter(
            (user) => user.role !== "ADMINISTRATOR" && user.isActive,
          ),
        );
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const handleChange = async (event) => {
    const nextValue = event.target.value;

    setValue(nextValue);

    await onAssign(nextValue);
  };

  return (
    <div className="mt-5">
      <label className="mb-2 block text-sm font-medium text-slate-700">
        Assign / Reassign
      </label>

      <select
        value={value}
        onChange={handleChange}
        disabled={loading || loadingUsers}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900 disabled:opacity-50"
      >
        <option value="">Unassigned</option>

        {users.map((user) => (
          <option key={user._id} value={user._id}>
            {user.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function WorkItemsSection({ applicationId, workItems, onRefresh }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Work Items</h2>

          <p className="mt-1 text-sm text-slate-500">
            Work required to process this application.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "+ Add Work Item"}
        </button>
      </div>

      {showForm && (
        <CreateWorkItemForm
          applicationId={applicationId}
          onCreated={() => {
            setShowForm(false);
            onRefresh();
          }}
        />
      )}

      {workItems.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500">
          No work items have been created.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {workItems.map((item) => (
            <WorkItemRow key={item._id} item={item} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </section>
  );
}

function CreateWorkItemForm({ applicationId, onCreated }) {
  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [application, setApplication] = useState(applicationId);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await api.post(`/work-items`, {
        application,
        title,
        description,
      });

      setApplication("");
      setTitle("");
      setDescription("");

      onCreated();
    } catch (error) {
      setError(error.message || "Failed to create work item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="border-b border-slate-200 bg-slate-50 p-6"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Work Item
          </label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="e.g. Verify customer documentation"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows="3"
            className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex justify-end">
          <button
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Work Item"}
          </button>
        </div>
      </div>
    </form>
  );
}

function WorkItemRow({ item, onRefresh }) {
  const [loading, setLoading] = useState(false);

  const complete = async () => {
    setLoading(true);

    try {
      await api.patch(`/work-items/${item._id}/status`, {
        status: "COMPLETED",
      });

      await onRefresh();
    } catch (error) {
      console.error("Failed to complete work item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="font-semibold text-slate-900">{item.title}</div>

        {item.description && (
          <div className="mt-1 text-sm text-slate-500">{item.description}</div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {item.status}
          </span>

          {item.assignedTo && (
            <span className="text-xs text-slate-500">
              Assigned to {item.assignedTo.name}
            </span>
          )}
        </div>
      </div>

      {item.status !== "COMPLETED" && (
        <button
          onClick={complete}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Mark Complete"}
        </button>
      )}
    </div>
  );
}

function ActivitySection({ activities }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Activity History</h2>

      <div className="mt-6">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No activity recorded yet.
          </div>
        ) : (
          <div className="relative space-y-6">
            {activities.map((activity, index) => (
              <div key={activity._id || index} className="relative flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {getActivityIcon(activity.type)}
                  </div>

                  {index < activities.length - 1 && (
                    <div className="absolute top-8 h-full w-px bg-slate-200" />
                  )}
                </div>

                <div className="min-w-0 flex-1 pb-2">
                  <div className="font-semibold text-slate-900">
                    {activity.description}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {activity.actorType === "SYSTEM"
                      ? "System"
                      : activity.performedBy
                        ? `${activity.performedBy.name}`
                        : "Unknown user"}{" "}
                    · {formatDateTime(activity.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SyncSection({ application, syncRecord, onRetry, loading }) {
  if (application.stage !== "COMPLETED" && !syncRecord) {
    return null;
  }

  const status = syncRecord?.status || "PENDING";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        External Synchronization
      </h2>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Status</span>

          <SyncBadge status={status} />
        </div>

        {syncRecord && (
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
            <Info label="Attempts" value={syncRecord.attempts} />

            <Info
              label="Last Attempt"
              value={
                syncRecord.lastAttemptAt
                  ? formatDateTime(syncRecord.lastAttemptAt)
                  : "Not attempted"
              }
            />

            {syncRecord.syncedAt && (
              <Info
                label="Synchronized"
                value={formatDateTime(syncRecord.syncedAt)}
              />
            )}

            {syncRecord.externalReference && (
              <Info
                label="External Reference"
                value={syncRecord.externalReference}
              />
            )}

            {syncRecord.lastError && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Last Error
                </div>

                <div className="mt-1 break-words text-sm text-red-600">
                  {syncRecord.lastError}
                </div>
              </div>
            )}
          </div>
        )}

        {status === "FAILED" && (
          <button
            onClick={onRetry}
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Retrying..." : "Retry Synchronization"}
          </button>
        )}

        {status === "PROCESSING" && (
          <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            Synchronization is currently being processed.
          </div>
        )}

        {status === "SUCCESS" && (
          <div className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-xs leading-5 text-green-700">
            This application has been successfully synchronized with the
            external system.
          </div>
        )}
      </div>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-medium text-slate-900">
        {value ?? "-"}
      </div>
    </div>
  );
}

function StageBadge({ stage }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {STAGE_LABELS[stage] || stage}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

function SyncBadge({ status }) {
  const labels = {
    PENDING: "Pending",
    PROCESSING: "Processing",
    SUCCESS: "Synchronized",
    FAILED: "Failed",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        status === "SUCCESS"
          ? "bg-green-100 text-green-700"
          : status === "FAILED"
            ? "bg-red-100 text-red-700"
            : status === "PROCESSING"
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-700"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function getValidNextStages(currentStage) {
  const transitions = {
    NEW: ["WAITING_FOR_INFORMATION", "IN_PROGRESS"],

    WAITING_FOR_INFORMATION: ["IN_PROGRESS"],

    IN_PROGRESS: ["WAITING_FOR_INFORMATION", "UNDER_REVIEW"],

    UNDER_REVIEW: ["IN_PROGRESS", "COMPLETED"],

    COMPLETED: [],
  };

  return transitions[currentStage] || [];
}

function getActivityIcon(type) {
  switch (type) {
    case "APPLICATION_CREATED":
      return "+";

    case "APPLICATION_ASSIGNED":
    case "APPLICATION_REASSIGNED":
      return "→";

    case "STATUS_CHANGED":
      return "↗";

    case "WORK_ITEM_CREATED":
      return "W";

    case "WORK_ITEM_COMPLETED":
      return "✓";

    case "SYNC_SUCCEEDED":
      return "✓";

    case "SYNC_FAILED":
      return "!";

    default:
      return "•";
  }
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
