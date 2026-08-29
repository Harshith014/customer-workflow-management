"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";

import ProtectedRoute from "./auth/ProtectedRoute";

export default function AppLayout({
  children,
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />

        <Header />

        <main className="lg:ml-64">
          <div className="mx-auto max-w-[1600px] p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}