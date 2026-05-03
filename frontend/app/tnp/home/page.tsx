// app/tnp/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  History,
  User,
  LogOut,
  ChevronDown,
  Plus,
  Users,
  FileText,
} from "lucide-react";

export default function TnpHomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        return JSON.parse(userData).name || "User";
      }
    }
    return "User";
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/tnp/home" className="text-xl font-bold text-indigo-600">
                TNP Dashboard
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/tnp/create"
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  Create Request
                </Link>
                <Link
                  href="/tnp/history"
                  className="text-gray-700 hover:text-indigo-600 transition"
                >
                  My Requests
                </Link>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 focus:outline-none"
                >
                  <span className="text-sm font-medium">{userName}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl">
            Training & Placement Portal
          </h1>
          <p className="mt-4 text-xl text-indigo-100 max-w-2xl mx-auto">
            Manage placement drives, internships, and test requests efficiently.
          </p>
          <div className="mt-8">
            <Link
              href="/tnp/create"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Request
            </Link>
          </div>
        </div>
      </section>

      {/* Action Cards */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Create Request",
              description: "Submit a new placement/internship drive request.",
              icon: Plus,
              path: "/tnp/create",
              color: "bg-indigo-50 text-indigo-600",
            },
            {
              title: "My Requests",
              description: "View all your submitted requests and status.",
              icon: History,
              path: "/tnp/history",
              color: "bg-amber-50 text-amber-600",
            },
          ].map((card) => (
            <div
              key={card.title}
              onClick={() => router.push(card.path)}
              className="cursor-pointer group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="p-6">
                <div
                  className={`inline-flex p-3 rounded-lg ${card.color} mb-4`}
                >
                  <card.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">About TNP Module</h2>
          <p className="mt-4 text-gray-600 text-lg">
            This portal allows Training & Placement officers to request seminar
            halls for placement drives, internships, and tests. It ensures
            conflict-free scheduling and provides real-time approval tracking.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2026 Seminar Booking System — VIT Pune
            </p>
            <div className="flex gap-6">
              <Link href="/about" className="text-sm text-gray-500 hover:text-indigo-600">
                About
              </Link>
              <Link href="/contact" className="text-sm text-gray-500 hover:text-indigo-600">
                Contact
              </Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-indigo-600">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}