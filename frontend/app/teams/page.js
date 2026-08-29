"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppLayout from "../../components/layout/AppLayout";
import api from "../../lib/api";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [refreshKey, setRefreshKey] =
    useState(0);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/teams");

        setTeams(
          response.data || []
        );
      } catch (error) {
        console.error(
          "Failed to fetch teams:",
          error
        );

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load teams"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [refreshKey]);

  const filteredTeams = teams.filter(
    (team) => {
      const searchValue =
        search.trim().toLowerCase();

      if (!searchValue) {
        return true;
      }

      return (
        team.name
          ?.toLowerCase()
          .includes(searchValue) ||
        team.description
          ?.toLowerCase()
          .includes(searchValue) ||
        team.manager?.name
          ?.toLowerCase()
          .includes(searchValue) ||
        team.manager?.email
          ?.toLowerCase()
          .includes(searchValue)
      );
    }
  );

  const handleTeamCreated = () => {
    setShowCreateForm(false);

    setRefreshKey(
      (current) => current + 1
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Teams
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage teams and their assigned managers.
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
              : "+ Create Team"}
          </button>
        </div>

        {/* Create Team Form */}
        {showCreateForm && (
          <CreateTeamForm
            onCreated={
              handleTeamCreated
            }
            onCancel={() =>
              setShowCreateForm(false)
            }
          />
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
                !
              </div>

              <div>
                <p className="font-semibold text-red-800">
                  Unable to load teams
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search / Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative w-full lg:max-w-md">
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
                placeholder="Search teams..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filteredTeams.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {teams.length}
              </span>{" "}
              teams
            </div>
          </div>
        </div>

        {/* Teams */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              All Teams
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Teams available in the application.
            </p>
          </div>

          {loading ? (
            <TeamsLoading />
          ) : filteredTeams.length === 0 ? (
            <EmptyTeams
              hasSearch={
                search.trim().length > 0
              }
              onCreate={() =>
                setShowCreateForm(true)
              }
            />
          ) : (
            <TeamsTable
              teams={filteredTeams}
            />
          )}
        </section>
      </div>
    </AppLayout>
  );
}


/* =========================================================
   CREATE TEAM FORM
========================================================= */

function CreateTeamForm({
  onCreated,
  onCancel,
}) {
  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const submit = async (
    event
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Team name is required."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/teams", {
        name: name.trim(),
        description:
          description.trim(),
      });

      setName("");
      setDescription("");

      onCreated();
    } catch (error) {
      console.error(
        "Create team error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create team"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          Create Team
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Add a new team to the system.
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
            Team Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
            placeholder="Enter team name"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            required
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
            placeholder="Describe the team's responsibility..."
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : "Create Team"}
          </button>
        </div>
      </form>
    </section>
  );
}


/* =========================================================
   TEAMS TABLE
========================================================= */

function TeamsTable({
  teams,
}) {
  return (
    <div className="overflow-x-auto">

      <table className="w-full min-w-[760px]">

        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Team
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Manager
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </th>



          </tr>
        </thead>

        <tbody>
          {teams.map(
            (team) => (
              <TeamRow
                key={team._id}
                team={team}
              />
            )
          )}
        </tbody>

      </table>
    </div>
  );
}


/* =========================================================
   TEAM ROW
========================================================= */

function TeamRow({
  team,
}) {
  const initials =
    getInitials(
      team.name
    );

  return (
    <tr className="border-b border-slate-100 transition hover:bg-slate-50">

      {/* Team */}
      <td className="px-6 py-5">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            {initials}
          </div>

          <div>
            <div className="font-semibold text-slate-900">
              {team.name}
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Team ID:{" "}
              {team._id}
            </div>
          </div>

        </div>

      </td>

      {/* Description */}
      <td className="max-w-xs px-6 py-5">

        <p className="line-clamp-2 text-sm text-slate-600">
          {team.description ||
            "No description provided"}
        </p>

      </td>

      {/* Manager */}
      <td className="px-6 py-5">

        {team.manager ? (
          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
              {getInitials(
                team.manager.name
              )}
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-900">
                {
                  team.manager
                    .name
                }
              </div>
            </div>

          </div>
        ) : (
          <span className="text-sm text-slate-400">
            No manager assigned
          </span>
        )}

      </td>

      {/* Email */}
      <td className="px-6 py-5">

        {team.manager?.email ? (
          <a
            href={`mailto:${team.manager.email}`}
            className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
          >
            {
              team.manager.email
            }
          </a>
        ) : (
          <span className="text-sm text-slate-400">
            —
          </span>
        )}

      </td>


    </tr>
  );
}


/* =========================================================
   LOADING
========================================================= */

function TeamsLoading() {
  return (
    <div className="divide-y divide-slate-100">

      {[1, 2, 3, 4].map(
        (item) => (
          <div
            key={item}
            className="flex items-center gap-4 px-6 py-5"
          >

            <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200" />

            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />

              <div className="h-3 w-72 animate-pulse rounded bg-slate-100" />
            </div>

            <div className="hidden h-4 w-32 animate-pulse rounded bg-slate-200 md:block" />

          </div>
        )
      )}

    </div>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyTeams({
  hasSearch,
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
            d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h1m4-8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6 3a3 3 0 1 1-6 0"
          />
        </svg>
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">
        {hasSearch
          ? "No teams found"
          : "No teams yet"}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {hasSearch
          ? "Try changing your search criteria."
          : "Create your first team to get started."}
      </p>

      {!hasSearch && (
        <button
          onClick={onCreate}
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + Create Team
        </button>
      )}

    </div>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function getInitials(
  value
) {
  if (!value) {
    return "T";
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