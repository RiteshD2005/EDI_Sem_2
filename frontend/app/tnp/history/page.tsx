// app/tnp/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { Loader2, Calendar, Building2, ArrowLeft } from "lucide-react";

type Hall = {
  id: number;
  name: string;
};

type Request = {
  id: number;
  companyName: string;
  driveType: string;
  roundType: string;
  startTime: string;
  endTime: string;
  expectedStudents: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | null; // null possible from backend
  halls: Hall[] | string[];
};

export default function TnpHistoryPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_BASE_URL}/api/tnp/my-requests`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch your requests");
        }
        return res.json();
      })
      .then((data) => {
        const raw = Array.isArray(data) ? data : [];
        // Fix null statuses and ensure valid data
        const sanitized = raw.map((req: Request) => ({
          ...req,
          status: req.status || "PENDING",
          halls: req.halls || [],
        }));
        setRequests(sanitized);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Something went wrong");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const getStatusColor = (status: string) => {
    if (status === "APPROVED") return "bg-green-100 text-green-700";
    if (status === "REJECTED") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-800";
  };

  const getHallNames = (halls: Request["halls"]): string => {
    if (!halls || halls.length === 0) return "None";
    if (typeof halls[0] === "string") {
      return (halls as string[]).join(", ");
    }
    return (halls as Hall[]).map((h) => h.name).join(", ");
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900">TNP Request History</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && requests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No requests found. Create one!</p>
          <button
            onClick={() => router.push("/tnp/create")}
            className="mt-4 inline-flex items-center gap-1 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Create Request →
          </button>
        </div>
      )}

      {requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                <h2 className="font-bold text-lg text-gray-900 break-words">
                  {req.companyName}
                </h2>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full w-fit ${getStatusColor(req.status)}`}
                >
                  {req.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <span className="font-medium">Drive:</span> {req.driveType} ({req.roundType})
                </p>
                <p className="flex flex-wrap items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {formatDateTime(req.startTime)} →{" "}
                    {new Date(req.endTime).toLocaleTimeString()}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Students:</span> {req.expectedStudents}
                </p>
                <p className="flex gap-1.5">
                  <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="break-words">Halls: {getHallNames(req.halls)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}