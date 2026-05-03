"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Tag,
  Briefcase,
  AlertCircle,
  X,
  ChevronLeft,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  CalendarDays,
  User,
  Phone,
} from "lucide-react";

type Booking = {
  id: number;
  description: string;
  student_count: number;
  status: "APPROVED" | "PENDING" | "REJECTED" | "CANCELLED";
  startTime: string;
  endTime: string;
  club_name: string;
  designation: string;
  event_type: string;
  event_title: string;
  resources_needed: string;
  admin_note: string | null;
  approved_at: string | null;
  coordinatorName?: string;
  coordinatorPhone?: string;
  created_at: string;
  hall: {
    name: string;
    location: string;
    capacity?: number;
  };
  user?: {
    name: string;
    email: string;
  };
};

export default function HistoryPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_BASE_URL}/booking/my-history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) throw new Error(text || "Failed to fetch");
        return text ? JSON.parse(text) : [];
      })
      .then((data) => setBookings(data))
      .catch((err) => {
        console.error(err);
        alert("Failed to load booking history");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          border: "border-green-200",
          icon: CheckCircle,
          label: "Approved",
        };
      case "PENDING":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          border: "border-yellow-200",
          icon: ClockIcon,
          label: "Pending",
        };
      case "REJECTED":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          border: "border-red-200",
          icon: XCircle,
          label: "Rejected",
        };
      case "CANCELLED":
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          border: "border-gray-200",
          icon: XCircle,
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          border: "border-gray-200",
          icon: AlertCircle,
          label: status,
        };
    }
  };

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
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const BookingDetailModal = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => {
    const statusConfig = getStatusConfig(booking.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 backdrop-blur-sm p-4">
            <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Title & Status */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {booking.event_title || booking.event_type}
                </h3>
                <p className="text-sm text-gray-500 mt-1">ID: {booking.id}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {statusConfig.label}
              </span>
            </div>

            {/* Venue & Time Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DetailItem icon={MapPin} label="Venue">
                <p className="font-medium">{booking.hall?.name}</p>
                <p className="text-sm text-gray-500">{booking.hall?.location}</p>
                {booking.hall?.capacity && (
                  <p className="text-xs text-gray-400">Capacity: {booking.hall.capacity}</p>
                )}
              </DetailItem>

              <DetailItem icon={CalendarDays} label="Event Date">
                <p className="font-medium">{formatDate(booking.startTime)}</p>
              </DetailItem>

              <DetailItem icon={Clock} label="Time Slot">
                <p className="font-medium">
                  {formatTime(booking.startTime)} → {formatTime(booking.endTime)}
                </p>
              </DetailItem>

              <DetailItem icon={Users} label="Expected Students">
                <p className="font-medium">{booking.student_count}</p>
              </DetailItem>
            </div>

            {/* Coordinator Details */}
            {booking.coordinatorName && (
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Faculty Coordinator
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{booking.coordinatorName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{booking.coordinatorPhone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Organizer Details */}
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Briefcase className="h-4 w-4" /> Organizer Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoField label="Club" value={booking.club_name} />
                <InfoField label="Designation" value={booking.designation} />
                <InfoField label="Event Type" value={booking.event_type} />
                <InfoField label="Event Title" value={booking.event_title} />
              </div>
            </div>

            {/* Description */}
            {booking.description && (
              <DetailItem icon={FileText} label="Description" fullWidth>
                <p className="text-gray-700">{booking.description}</p>
              </DetailItem>
            )}

            {/* Resources */}
            {booking.resources_needed && (
              <DetailItem icon={Tag} label="Resources Needed" fullWidth>
                <p className="text-gray-700">{booking.resources_needed}</p>
              </DetailItem>
            )}

            {/* Admin Note */}
            <DetailItem icon={AlertCircle} label="Admin Note" fullWidth>
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                {booking.admin_note || <span className="italic text-blue-400">No note provided</span>}
              </div>
            </DetailItem>

            {/* Meta */}
            <div className="border-t pt-3 text-xs text-gray-400 space-y-1">
              <p>Created: {formatDateTime(booking.created_at)}</p>
              {booking.approved_at && <p>Approved: {formatDateTime(booking.approved_at)}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 h-8 w-56 animate-pulse rounded bg-gray-200" />
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-xl bg-white p-5 shadow-sm h-40" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Booking History</h1>
            <p className="text-sm text-gray-500 mt-1">Track all your past and upcoming seminar hall bookings</p>
          </div>
          <button
            onClick={() => router.push("/home")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>

        {/* Empty State */}
        {bookings.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No bookings yet</h3>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              You haven't made any bookings. Browse halls and submit a request.
            </p>
            <button
              onClick={() => router.push("/halls")}
              className="mt-6 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-md hover:bg-indigo-700"
            >
              Browse Halls
            </button>
          </div>
        )}

        {/* Booking Cards Grid */}
        {bookings.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {bookings.map((booking) => {
              const statusConfig = getStatusConfig(booking.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <h2 className="line-clamp-1 text-lg font-semibold text-gray-900 pr-2">
                        {booking.event_title || booking.event_type || "Untitled Event"}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} shrink-0`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="mb-2 flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">
                        {booking.hall?.name} • {booking.hall?.location}
                      </span>
                    </div>

                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span>{formatDate(booking.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {formatTime(booking.startTime)} → {formatTime(booking.endTime)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>{booking.student_count} students</span>
                    </div>

                    <div className="mt-4 text-right text-xs text-indigo-500 opacity-0 transition group-hover:opacity-100">
                      Click to view full details →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </main>
  );
}

function DetailItem({
  icon: Icon,
  label,
  children,
  fullWidth = false,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-full" : ""}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 text-gray-400" />
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || "—"}</p>
    </div>
  );
}