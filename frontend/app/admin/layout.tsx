"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // ✅ No useEffect → avoid warning
  const [userName] = useState(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) return JSON.parse(user).name || "Admin";
    }
    return "Admin";
  });

  const navItems = [
      { name: "Dashboard", path: "/admin/dashboard" },
      { name: "Controller", path: "/admin/Controller" }, // future
      { name: "Bookings", path: "/admin/bookings" }, // future
      { name: "Months-Booking", path: "/admin/month-view" }, // future
  ];

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* 🔥 TOP HEADER (FULL WIDTH) */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800">
          Seminar Hall Booking System
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, <span className="font-medium">{userName}</span> 👋
          </span>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* 🔷 BELOW HEADER LAYOUT */}
      <div className="flex">

        {/* 🔵 Sidebar */}
        <aside className="w-64 bg-white border-r p-6 min-h-[calc(100vh-64px)]">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-lg text-sm ${
                  pathname === item.path
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* 🔷 Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}