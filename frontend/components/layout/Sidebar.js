"use client";

import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import {
  useAuth,
} from "../../context/AuthContext";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: [
      "ADMINISTRATOR",
      "MANAGER",
      "EXECUTIVE",
    ],
  },

  {
    label: "Applications",
    href: "/applications",
    roles: [
      "ADMINISTRATOR",
      "MANAGER",
      "EXECUTIVE",
    ],
  },

  {
    label: "Customers",
    href: "/customers",
    roles: [
      "ADMINISTRATOR",
      "MANAGER",
      "EXECUTIVE",
    ],
  },

  {
    label: "Work Items",
    href: "/work-items",
    roles: [
      "ADMINISTRATOR",
      "MANAGER",
      "EXECUTIVE",
    ],
  },

  {
    label: "Users",
    href: "/users",
    roles: [
      "ADMINISTRATOR",
    ],
  },

  {
    label: "Teams",
    href: "/teams",
    roles: [
      "ADMINISTRATOR",
    ],
  },
];

export default function Sidebar() {
  const pathname =
    usePathname();

  const { user } =
    useAuth();

  const visibleNavigation =
    navigation.filter(
      (item) =>
        user &&
        item.roles.includes(
          user.role
        )
    );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <div>
          <div className="text-lg font-bold text-slate-900">
            Application Hub
          </div>

          <div className="text-xs text-slate-500">
            Operations Management
          </div>
        </div>
      </div>

      <nav className="space-y-1 p-4">
        {visibleNavigation.map(
          (item) => {
            const active =
              pathname ===
                item.href ||
              pathname.startsWith(
                `${item.href}/`
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          }
        )}
      </nav>
    </aside>
  );
}