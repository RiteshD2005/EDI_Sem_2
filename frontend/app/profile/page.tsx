"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Activity,
  BookOpen,
  CheckCircle,
  Clock,
  Edit2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

type User = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
};

type Stats = {
  totalBookings: number;
  accepted: number;
  pending: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const userRes = await fetch("http://localhost:8080/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userRes.ok) throw new Error("Failed to fetch profile");
        const userData = await userRes.json();
        console.log("User data:", userData);
        setUser(userData);

        try {
          const statsRes = await fetch("http://localhost:8080/booking/my-stats", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
          } else {
            setStatsError(true);
          }
        } catch {
          setStatsError(true);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-xl mb-8" />
            <div className="h-64 bg-white rounded-xl shadow-sm mb-6" />
            <div className="h-32 bg-white rounded-xl shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/home")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl shadow-lg mb-8 text-white p-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
              <User className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{user.full_name}</h1>
              <p className="text-indigo-100 mt-1">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Account Details</h2>
            <button
              onClick={() => router.push("/profile/edit")}
              className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoRow icon={User} label="Full Name" value={user.full_name} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow
              icon={Shield}
              label="Role"
              value={user.role}
              badge
              badgeColor="indigo"
            />
            <InfoRow
              icon={Phone}
              label="Phone"
              value={user.phone || "Not provided"}
            />
            <InfoRow
              icon={Activity}
              label="Account Status"
              value={user.active ? "Active" : "Inactive"}
              badge
              badgeColor={user.active ? "green" : "red"}
            />
            <InfoRow
              icon={Calendar}
              label="Member Since"
              value={formattedDate}
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Booking Statistics</h2>
          </div>
          <div className="p-6">
            {statsError ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-yellow-700 text-sm">
                  Unable to load booking statistics at the moment.
                </p>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatCard
                  icon={BookOpen}
                  label="Total Bookings"
                  value={stats.totalBookings}
                  color="blue"
                />
                <StatCard
                  icon={CheckCircle}
                  label="Accepted"
                  value={stats.accepted}
                  color="green"
                />
                <StatCard
                  icon={Clock}
                  label="Pending"
                  value={stats.pending}
                  color="yellow"
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No booking data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components (same as before)
function InfoRow({ icon: Icon, label, value, badge = false, badgeColor = "gray" }: any) {
  const badgeStyles: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        {badge ? (
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyles[badgeColor]}`}>
            {value}
          </span>
        ) : (
          <p className="text-gray-900 font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}

type StatCardColor = "blue" | "green" | "yellow";

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: StatCardColor }) {
  const colorClasses: Record<StatCardColor, string> = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
  };
  return (
    <div className="rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`rounded-full p-2 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}