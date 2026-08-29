"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import AppLayout from "../../components/layout/AppLayout";

import api from "../../lib/api";

import {
  useAuth,
} from "../../context/AuthContext";

export default function DashboardPage() {
  const { user } =
    useAuth();

  const [stats, setStats] =
    useState({
      applications: 0,
      completed: 0,
      inProgress: 0,
      workItems: 0,
    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadDashboard =
      async () => {
        try {
          const [
            applicationsResponse,
            workResponse,
          ] = await Promise.all([
            api.get(
              "/applications?limit=1"
            ),

            api.get(
              "/work-items?limit=1"
            ),
          ]);

          const applicationPagination =
            applicationsResponse
              .data.pagination;

          const workPagination =
            workResponse
              .data.pagination;

          setStats({
            applications:
              applicationPagination
                .total,

            completed: 0,

            inProgress: 0,

            workItems:
              workPagination.total,
          });
        } catch (error) {
          console.error(
            "Dashboard loading error:",
            error
          );
        } finally {
          setLoading(false);
        }
      };

    loadDashboard();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back,{" "}
            {user?.name}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Here's an overview of your application workspace.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Applications"
            value={
              loading
                ? "..."
                : stats.applications
            }
          />

          <StatCard
            title="Completed"
            value={
              loading
                ? "..."
                : stats.completed
            }
          />

          <StatCard
            title="In Progress"
            value={
              loading
                ? "..."
                : stats.inProgress
            }
          />

          <StatCard
            title="Work Items"
            value={
              loading
                ? "..."
                : stats.workItems
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <QuickActions />

          <RoleSummary user={user} />
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  title,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">
        {title}
      </div>

      <div className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">
        Quick actions
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href="/applications/new"
          className="rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
        >
          Create Application
        </Link>

        <Link
          href="/customers/new"
          className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Create Customer
        </Link>

        <Link
          href="/applications"
          className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Applications
        </Link>

        <Link
          href="/work-items"
          className="rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Work
        </Link>
      </div>
    </div>
  );
}

function RoleSummary({
  user,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-900">
        Workspace
      </h2>

      <div className="mt-4 space-y-3">
        <InfoRow
          label="Name"
          value={`${user?.name || ""}`}
        />

        <InfoRow
          label="Role"
          value={user?.role}
        />

        <InfoRow
          label="Email"
          value={user?.email}
        />

        <InfoRow
          label="Team"
          value={
            user?.team?.name ||
            "Not assigned"
          }
        />
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-slate-900">
        {value || "-"}
      </span>
    </div>
  );
}