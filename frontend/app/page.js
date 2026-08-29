"use client";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "../context/AuthContext";

export default function Home() {
  const router =
    useRouter();

  const {
    authenticated,
    loading,
  } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    router.replace(
      authenticated
        ? "/dashboard"
        : "/login"
    );
  }, [
    authenticated,
    loading,
    router,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-sm text-slate-500">
        Loading...
      </div>
    </div>
  );
}