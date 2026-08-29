"use client";

import {
  useAuth,
} from "../../context/AuthContext";

export default function Header() {
  const {
    user,
    logout,
  } = useAuth();

  const fullName =
    `${user?.name || ""}`.trim();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="lg:ml-64">
        <div className="text-sm font-medium text-slate-500">
          Application Management
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <div className="text-sm font-semibold text-slate-900">
            {fullName}
          </div>

          <div className="text-xs text-slate-500">
            {user?.role}
          </div>
        </div>

        <button
          onClick={logout}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}