"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppLayout from "../../components/layout/AppLayout";
import api from "../../lib/api";

const ROLE_LABELS = {
  ADMINISTRATOR: "Administrator",
  MANAGER: "Manager",
  EXECUTIVE: "Executive",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [team, setTeam] = useState("");
  const [isActive, setIsActive] = useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (role) {
          params.set("role", role);
        }

        if (team) {
          params.set("team", team);
        }

        if (isActive !== "") {
          params.set(
            "isActive",
            isActive
          );
        }

        const query = params.toString();

        const [usersResponse, teamsResponse] =
          await Promise.all([
            api.get(
              query
                ? `/users?${query}`
                : "/users"
            ),
            api.get("/teams"),
          ]);

        setUsers(
          usersResponse.data || []
        );

        setTeams(
          teamsResponse.data || []
        );
      } catch (error) {
        console.error(
          "Failed to fetch users:",
          error
        );

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to load users"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    refreshKey,
    search,
    role,
    team,
    isActive,
  ]);

  const handleUserCreated = () => {
    setShowCreateForm(false);

    setRefreshKey(
      (current) => current + 1
    );
  };

  const handleUserUpdated = () => {
    setRefreshKey(
      (current) => current + 1
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Users
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage users, roles, teams and account status.
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
              : "+ Create User"}
          </button>
        </div>

        {/* CREATE USER */}
        {showCreateForm && (
          <CreateUserForm
            teams={teams}
            onCreated={
              handleUserCreated
            }
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
                  Unable to load users
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

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">

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
                placeholder="Search users..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />

            </div>

            {/* ROLE */}
            <select
              value={role}
              onChange={(event) =>
                setRole(
                  event.target.value
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">
                All roles
              </option>

              <option value="ADMINISTRATOR">
                Administrator
              </option>

              <option value="MANAGER">
                Manager
              </option>

              <option value="EXECUTIVE">
                Executive
              </option>
            </select>

            {/* TEAM */}
            <select
              value={team}
              onChange={(event) =>
                setTeam(
                  event.target.value
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">
                All teams
              </option>

              {teams.map(
                (teamItem) => (
                  <option
                    key={
                      teamItem._id
                    }
                    value={
                      teamItem._id
                    }
                  >
                    {
                      teamItem.name
                    }
                  </option>
                )
              )}
            </select>

            {/* STATUS */}
            <select
              value={isActive}
              onChange={(event) =>
                setIsActive(
                  event.target.value
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">
                All statuses
              </option>

              <option value="true">
                Active
              </option>

              <option value="false">
                Inactive
              </option>
            </select>

          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {users.length}
              </span>{" "}
              users
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRole("");
                setTeam("");
                setIsActive("");
              }}
              className="text-left text-sm font-semibold text-slate-600 hover:text-slate-900 sm:text-right"
            >
              Clear filters
            </button>

          </div>
        </section>

        {/* USERS TABLE */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <h2 className="text-lg font-bold text-slate-900">
              All Users
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Users registered in the application.
            </p>

          </div>

          {loading ? (
            <UsersLoading />
          ) : users.length === 0 ? (
            <EmptyUsers
              hasFilters={
                Boolean(
                  search.trim() ||
                  role ||
                  team ||
                  isActive !== ""
                )
              }
              onCreate={() =>
                setShowCreateForm(true)
              }
            />
          ) : (
            <UsersTable
              users={users}
              teams={teams}
              onUpdated={
                handleUserUpdated
              }
            />
          )}

        </section>

      </div>
    </AppLayout>
  );
}


/* =========================================================
   CREATE USER FORM
========================================================= */

function CreateUserForm({
  teams,
  onCreated,
  onCancel,
}) {
  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState("EXECUTIVE");

  const [team, setTeam] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const submit = async (
    event
  ) => {
    event.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !role
    ) {
      setError(
        "Name, email, password and role are required."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.post("/users", {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        team: team || null,
      });

      setName("");
      setEmail("");
      setPassword("");
      setRole("EXECUTIVE");
      setTeam("");

      onCreated();
    } catch (error) {
      console.error(
        "Create user error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          Create User
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Add a new user to the application.
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

        <div className="grid gap-5 md:grid-cols-2">

          {/* NAME */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Enter full name"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="user@example.com"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter password"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* ROLE */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Role
            </label>

            <select
              value={role}
              onChange={(event) =>
                setRole(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="ADMINISTRATOR">
                Administrator
              </option>

              <option value="MANAGER">
                Manager
              </option>

              <option value="EXECUTIVE">
                Executive
              </option>
            </select>
          </div>

          {/* TEAM */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Team
            </label>

            <select
              value={team}
              onChange={(event) =>
                setTeam(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">
                No team
              </option>

              {teams.map(
                (teamItem) => (
                  <option
                    key={
                      teamItem._id
                    }
                    value={
                      teamItem._id
                    }
                  >
                    {
                      teamItem.name
                    }
                  </option>
                )
              )}
            </select>
          </div>

        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

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
              : "Create User"}
          </button>

        </div>

      </form>
    </section>
  );
}


/* =========================================================
   USERS TABLE
========================================================= */

function UsersTable({
  users,
  teams,
  onUpdated,
}) {
  return (
    <div className="overflow-x-auto">

      <table className="w-full min-w-[950px]">

        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              User
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Team
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
          {users.map(
            (user) => (
              <UserRow
                key={user._id}
                user={user}
                teams={teams}
                onUpdated={
                  onUpdated
                }
              />
            )
          )}
        </tbody>

      </table>
    </div>
  );
}


/* =========================================================
   USER ROW
========================================================= */

function UserRow({
  user,
  teams,
  onUpdated,
}) {
  const [editing, setEditing] =
    useState(false);

  const [name, setName] =
    useState(
      user.name || ""
    );

  const [role, setRole] =
    useState(
      user.role || "EXECUTIVE"
    );

  const [team, setTeam] =
    useState(
      user.team?._id || ""
    );

  const [isActive, setIsActive] =
    useState(
      Boolean(user.isActive)
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const save = async () => {
    try {
      setLoading(true);
      setError("");

      await api.patch(
        `/users/${user._id}`,
        {
          name: name.trim(),
          role,
          team: team || null,
          isActive,
        }
      );

      setEditing(false);

      onUpdated();
    } catch (error) {
      console.error(
        "Update user error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update user"
      );
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <tr className="border-b border-slate-100 bg-slate-50">

        <td className="px-6 py-5">
          <div className="space-y-2">

            <input
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            <div className="text-xs text-slate-500">
              {user.email}
            </div>

            {error && (
              <div className="text-xs font-medium text-red-600">
                {error}
              </div>
            )}

          </div>
        </td>

        <td className="px-6 py-5">

          <select
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value
              )
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ADMINISTRATOR">
              Administrator
            </option>

            <option value="MANAGER">
              Manager
            </option>

            <option value="EXECUTIVE">
              Executive
            </option>
          </select>

        </td>

        <td className="px-6 py-5">

          <select
            value={team}
            onChange={(event) =>
              setTeam(
                event.target.value
              )
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">
              No team
            </option>

            {teams.map(
              (teamItem) => (
                <option
                  key={
                    teamItem._id
                  }
                  value={
                    teamItem._id
                  }
                >
                  {
                    teamItem.name
                  }
                </option>
              )
            )}
          </select>

        </td>

        <td className="px-6 py-5">

          <label className="inline-flex cursor-pointer items-center gap-2">

            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) =>
                setIsActive(
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border-slate-300"
            />

            <span className="text-sm text-slate-700">
              Active
            </span>

          </label>

        </td>

        <td className="px-6 py-5">

          <div className="flex justify-end gap-2">

            <button
              onClick={() =>
                setEditing(false)
              }
              disabled={loading}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Cancel
            </button>

            <button
              onClick={save}
              disabled={
                loading ||
                !name.trim()
              }
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : "Save"}
            </button>

          </div>

        </td>

      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 transition hover:bg-slate-50">

      {/* USER */}
      <td className="px-6 py-5">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
            {getInitials(
              user.name
            )}
          </div>

          <div>

            <div className="font-semibold text-slate-900">
              {user.name}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              {user.email}
            </div>

          </div>

        </div>

      </td>

      {/* ROLE */}
      <td className="px-6 py-5">

        <RoleBadge
          role={user.role}
        />

      </td>

      {/* TEAM */}
      <td className="px-6 py-5">

        {user.team ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {user.team.name}
          </span>
        ) : (
          <span className="text-sm text-slate-400">
            No team
          </span>
        )}

      </td>

      {/* STATUS */}
      <td className="px-6 py-5">

        <StatusBadge
          isActive={
            user.isActive
          }
        />

      </td>

      {/* ACTION */}
      <td className="px-6 py-5 text-right">

        <button
          onClick={() =>
            setEditing(true)
          }
          className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-slate-50"
        >
          Edit
        </button>

      </td>

    </tr>
  );
}


/* =========================================================
   ROLE BADGE
========================================================= */

function RoleBadge({
  role,
}) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {ROLE_LABELS[role] ||
        role}
    </span>
  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  isActive,
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        isActive
          ? "bg-green-100 text-green-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {isActive
        ? "Active"
        : "Inactive"}
    </span>
  );
}


/* =========================================================
   LOADING
========================================================= */

function UsersLoading() {
  return (
    <div className="divide-y divide-slate-100">

      {[1, 2, 3, 4, 5].map(
        (item) => (
          <div
            key={item}
            className="flex items-center gap-4 px-6 py-5"
          >

            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />

            <div className="flex-1 space-y-2">

              <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />

              <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />

            </div>

            <div className="hidden h-6 w-24 animate-pulse rounded-full bg-slate-200 md:block" />

            <div className="hidden h-6 w-20 animate-pulse rounded-full bg-slate-100 md:block" />

          </div>
        )
      )}

    </div>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyUsers({
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
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m9-10a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm7 10v-2a4 4 0 0 0-3-3.87m-1-10a4 4 0 0 1 0 7.75"
          />
        </svg>

      </div>

      <h3 className="mt-4 font-semibold text-slate-900">
        {hasFilters
          ? "No users found"
          : "No users yet"}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {hasFilters
          ? "Try changing your filters or search criteria."
          : "Create your first user to get started."}
      </p>

      {!hasFilters && (
        <button
          onClick={onCreate}
          className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          + Create User
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
    return "U";
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