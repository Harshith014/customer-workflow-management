"use client";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "../../../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles,
}) {
  const router =
    useRouter();

  const {
    user,
    loading,
    authenticated,
  } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!authenticated) {
      router.replace("/login");
      return;
    }

    if (
      allowedRoles &&
      !allowedRoles.includes(
        user?.role
      )
    ) {
      router.replace(
        "/dashboard"
      );
    }
  }, [
    loading,
    authenticated,
    user,
    allowedRoles,
    router,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading...
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(
      user?.role
    )
  ) {
    return null;
  }

  return children;
}