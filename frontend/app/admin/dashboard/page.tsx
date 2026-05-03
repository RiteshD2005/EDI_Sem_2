"use client";

import { useEffect, useState } from "react";
import { getValidToken } from "@/utils/auth";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Users,
  FileText,
  Briefcase,
  AlertCircle,
  Search,
  Eye,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Building2,
  GraduationCap,
} from "lucide-react";
import router from "next/router";

// Booking type
type Booking = {
  id: number;
  event_title: string;
  event_type: string;
  description: string;
  club_name: string;
  designation: string;
  resources_needed: string;
  student_count: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  startTime: string;
  endTime: string;
  admin_note?: string | null;
  coordinatorName?: string;
  coordinatorPhone?: string;
  hall: {
    id: number;
    name: string;
    location: string;
    capacity?: number;
  };
  user?: {
    name: string;
    email: string;
    role?: string;
  };
};

// TNP Request type
type TnpRequest = {
  id: number;
  companyName: string;
  driveType: string;
  startTime: string;
  endTime: string;
  expectedStudents: number;
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  halls?: { id: number; name: string }[];
};

type TabType = "PENDING" | "APPROVED" | "REJECTED";
const PAGE_SIZE = 50;

export default function AdminDashboard() {
  // Booking state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  // TNP state
  const [tnpRequests, setTnpRequests] = useState<TnpRequest[]>([]);
  const [tnpLoading, setTnpLoading] = useState(false);
  const [tnpActionLoading, setTnpActionLoading] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<"BOOKINGS" | "TNP">("BOOKINGS");

  // Fetch bookings
  const fetchBookings = async () => {
    const token = getValidToken();

    if (!token) {
      router.push("/login");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch TNP requests
  const fetchTnpRequests = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      setTnpLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/tnp/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch TNP requests");
      const data = await res.json();
      setTnpRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setTnpRequests([]);
      alert("Failed to load TNP requests");
    } finally {
      setTnpLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchTnpRequests();
  }, []);

  // Filter bookings by tab & search
  useEffect(() => {
    let filtered = bookings.filter((b) => {
      if (activeTab === "PENDING") return b.status === "PENDING";
      if (activeTab === "APPROVED") return b.status === "APPROVED";
      if (activeTab === "REJECTED") return b.status === "REJECTED" || b.status === "CANCELLED";
      return false;
    });
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.event_title.toLowerCase().includes(term) ||
          b.club_name.toLowerCase().includes(term) ||
          b.hall.name.toLowerCase().includes(term)
      );
    }
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [activeTab, searchTerm, bookings]);

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Approve/Reject for bookings
  const handleApproveReject = async (id: number, action: "APPROVE" | "REJECT") => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionLoading(true);
    setActionType(action);
    try {
      const url =
        action === "APPROVE"
          ? `${API_BASE_URL}/admin/approve/${id}`
          : `${API_BASE_URL}/admin/reject/${id}?note=${encodeURIComponent(adminNote)}`;
      const res = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const text = await res.text();
        alert(text);
        return;
      }
      await fetchBookings();
      setSelectedBooking(null);
      setAdminNote("");
      setActionType(null);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setActionLoading(false);
    }
  };

  // Approve TNP request with loading
  const approveTnp = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setTnpActionLoading(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tnp/approve/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Approval failed");
      alert("TNP request approved ✅");
      await fetchTnpRequests();
    } catch (err) {
      console.error(err);
      alert("Error approving request");
    } finally {
      setTnpActionLoading(null);
    }
  };

  // Reject TNP request with loading
  const rejectTnp = async (id: number) => {
    const reason = prompt("Optional rejection reason:");
    const token = localStorage.getItem("token");
    if (!token) return;
    setTnpActionLoading(id);
    try {
      const url = `${API_BASE_URL}/api/tnp/reject/${id}${reason ? `?note=${encodeURIComponent(reason)}` : ""}`;
      const res = await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Rejection failed");
      alert("TNP request rejected");
      await fetchTnpRequests();
    } catch (err) {
      console.error(err);
      alert("Error rejecting request");
    } finally {
      setTnpActionLoading(null);
    }
  };

  // Formatters
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  // Stats
  const todayCount = bookings.filter((b) => {
    const today = new Date().toDateString();
    return new Date(b.startTime).toDateString() === today;
  }).length;

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
    today: todayCount,
  };

  if (loading && activeSection === "BOOKINGS") {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">
          Manage seminar hall bookings and TNP placement requests.
        </p>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-2 mt-4 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSection("BOOKINGS")}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeSection === "BOOKINGS"
              ? "bg-indigo-600 text-white shadow"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          📋 Bookings
        </button>
        <button
          onClick={() => setActiveSection("TNP")}
          className={`px-4 py-2 rounded-lg font-medium transition ${activeSection === "TNP"
              ? "bg-indigo-600 text-white shadow"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
        >
          🎓 TNP Requests
        </button>
      </div>

      {/* Metric Cards (only for Bookings section) */}
      if (activeSection === `BOOKINGS`) {
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <MetricCard title="Total Requests" value={stats.total} color="blue" />
          <MetricCard title="Pending Requests" value={stats.pending} color="yellow" />
          <MetricCard title="Today's Bookings" value={stats.today} color="indigo" />
        </div>
      }

      {/* ================= BOOKINGS SECTION ================= */}
      {activeSection === "BOOKINGS" && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["PENDING", "APPROVED", "REJECTED"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  {tab === "PENDING"
                    ? "Pending"
                    : tab === "APPROVED"
                      ? "Approved"
                      : "Rejected / Cancelled"}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by event, club, or hall..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-6">
            {paginatedBookings.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                <p className="text-gray-500">No bookings found.</p>
              </div>
            ) : (
              paginatedBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onView={() => setSelectedBooking(booking)}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * PAGE_SIZE, filteredBookings.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredBookings.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-2 text-gray-400 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 text-sm font-semibold ${currentPage === pageNum
                              ? "bg-indigo-600 text-white"
                              : "text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2 py-2 text-gray-400 ring-1 ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= TNP REQUESTS SECTION ================= */}
      {activeSection === "TNP" && (
        <div className="space-y-4 mt-6">
          {tnpLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : tnpRequests.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-white rounded-xl shadow-sm">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No TNP requests found.</p>
            </div>
          ) : (
            tnpRequests.map((req) => (
              <div key={req.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{req.companyName}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{req.driveType}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${req.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : req.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateTime(req.startTime)} → {formatDateTime(req.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Expected students: {req.expectedStudents}</span>
                  </div>
                  {req.halls && req.halls.length > 0 && (
                    <div className="flex items-center gap-2 col-span-full">
                      <Building2 className="h-4 w-4" />
                      <span>Halls: {req.halls.map(h => h.name).join(", ")}</span>
                    </div>
                  )}
                  {req.description && (
                    <div className="col-span-full">
                      <p className="text-gray-500 text-xs mb-1">Description</p>
                      <p className="text-gray-700">{req.description}</p>
                    </div>
                  )}
                </div>

                {req.status === "PENDING" && (
                  <div className="mt-5 flex gap-3 justify-end border-t pt-4">
                    <button
                      onClick={() => approveTnp(req.id)}
                      disabled={tnpActionLoading === req.id}
                      className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      {tnpActionLoading === req.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      {tnpActionLoading === req.id ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => rejectTnp(req.id)}
                      disabled={tnpActionLoading === req.id}
                      className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      {tnpActionLoading === req.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      {tnpActionLoading === req.id ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          adminNote={adminNote}
          setAdminNote={setAdminNote}
          actionLoading={actionLoading}
          actionType={actionType}
          onApproveReject={handleApproveReject}
          onClose={() => {
            setSelectedBooking(null);
            setAdminNote("");
            setActionType(null);
          }}
          formatDate={formatDate}
          formatTime={formatTime}
        />
      )}
    </div>
  );
}

// ============================================================
// Helper Components
// ============================================================

function MetricCard({ title, value, color }: { title: string; value: number; color: "blue" | "yellow" | "indigo" }) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-2 ${colorClasses[color]}`} />
      </div>
    </div>
  );
}

function BookingCard({
  booking,
  onView,
  formatDate,
  formatTime,
}: {
  booking: Booking;
  onView: () => void;
  formatDate: (date?: string) => string;
  formatTime: (date?: string) => string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900">{booking.event_title}</h3>
            <StatusBadge status={booking.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {booking.club_name}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {booking.hall.name}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(booking.startTime)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(booking.startTime)} → {formatTime(booking.endTime)}
            </div>
          </div>
        </div>
        <button
          onClick={onView}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
    APPROVED: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
    REJECTED: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
    CANCELLED: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
  };
  const { bg, text, icon: Icon } = config[status as keyof typeof config] || config.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${bg} ${text}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function BookingModal({
  booking,
  adminNote,
  setAdminNote,
  actionLoading,
  actionType,
  onApproveReject,
  onClose,
  formatDate,
  formatTime,
}: {
  booking: Booking;
  adminNote: string;
  setAdminNote: (val: string) => void;
  actionLoading: boolean;
  actionType: "APPROVE" | "REJECT" | null;
  onApproveReject: (id: number, action: "APPROVE" | "REJECT") => void;
  onClose: () => void;
  formatDate: (date?: string) => string;
  formatTime: (date?: string) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 p-6">
          <div className="flex justify-between">
            <h3 className="text-lg font-bold text-gray-900">{booking.event_title}</h3>
            <StatusBadge status={booking.status} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoItem icon={MapPin} label="Venue" value={`${booking.hall.name} (${booking.hall.location})`} />
            <InfoItem icon={Calendar} label="Event Date" value={formatDate(booking.startTime)} />
            <InfoItem icon={Clock} label="Time" value={`${formatTime(booking.startTime)} → ${formatTime(booking.endTime)}`} />
            <InfoItem icon={Users} label="Students" value={booking.student_count.toString()} />
            <InfoItem icon={Briefcase} label="Club" value={booking.club_name} />
            <InfoItem icon={FileText} label="Event Type" value={booking.event_type} />
          </div>

          {(booking.coordinatorName || booking.coordinatorPhone) && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <User className="h-4 w-4" /> Faculty Coordinator
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {booking.coordinatorName && (
                  <InfoItem icon={User} label="Coordinator Name" value={booking.coordinatorName} />
                )}
                {booking.coordinatorPhone && (
                  <InfoItem icon={Phone} label="Coordinator Phone" value={booking.coordinatorPhone} />
                )}
              </div>
            </div>
          )}

          <InfoItem icon={FileText} label="Description" value={booking.description} fullWidth />
          {booking.resources_needed && (
            <InfoItem icon={AlertCircle} label="Resources Needed" value={booking.resources_needed} fullWidth />
          )}
          {booking.admin_note && (
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-800">Admin Note:</p>
              <p className="text-sm text-blue-700">{booking.admin_note}</p>
            </div>
          )}

          {booking.status === "PENDING" && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700">Admin Note (optional)</label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note for the user (reason for approval/rejection)..."
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => onApproveReject(booking.id, "REJECT")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading && actionType === "REJECT" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Reject
                </button>
                <button
                  onClick={() => onApproveReject(booking.id, "APPROVE")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading && actionType === "APPROVE" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  fullWidth = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 text-gray-400" />
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
        </div>
      </div>
    </div>
  );
}