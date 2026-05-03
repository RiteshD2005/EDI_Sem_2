// app/check-slot/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { ArrowLeft, Calendar as CalendarIcon, Loader2, AlertCircle, Clock } from "lucide-react";

type Hall = {
  id: number;
  name: string;
  location?: string;
};

type Event = {
  id: number;
  title: string;
  start: string;
  end: string;
  hall: string;
  type: "TNP" | "BOOKING";
};

type DayStatus = {
  date: Date;
  isFullyBooked: boolean;
  hasAnyBooking: boolean;
  bookings: Event[];
  loaded: boolean;
};

export default function CalendarAvailabilityPage() {
  const router = useRouter();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [daysStatus, setDaysStatus] = useState<Map<string, DayStatus>>(new Map());
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bookingsForSelectedDate, setBookingsForSelectedDate] = useState<Event[]>([]);
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const loadingRef = useRef(false);
  const lastLoadedRef = useRef<{ hallId: number | null; year: number; month: number }>({
    hallId: null,
    year: -1,
    month: -1,
  });

  const formatDateKey = (date: Date) => {
    return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
  };

  const getDaysInMonth = useCallback((year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, []);

  const fetchDayOverview = useCallback(
    async (date: Date): Promise<Event[]> => {
      const dateStr = formatDateKey(date);
      const url = `${API_BASE_URL}/booking/day-overview?date=${dateStr}`;
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 404) return [];
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error(`Failed to fetch ${dateStr}:`, err);
        return [];
      }
    },
    [token]
  );

  const evaluateDay = useCallback((events: Event[]) => {
    if (!events.length) return { full: false, partial: false };
    // TNP always makes the day fully booked (🔴 RED)
    const hasTnp = events.some((e) => e.type === "TNP");
    if (hasTnp) return { full: true, partial: false };

    const ranges = events.map((e) => ({
      start: new Date(e.start).getTime(),
      end: new Date(e.end).getTime(),
    }));
    ranges.sort((a, b) => a.start - b.start);

    let coveredMs = 0;
    let currentStart = ranges[0].start;
    let currentEnd = ranges[0].end;

    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i].start <= currentEnd) {
        currentEnd = Math.max(currentEnd, ranges[i].end);
      } else {
        coveredMs += currentEnd - currentStart;
        currentStart = ranges[i].start;
        currentEnd = ranges[i].end;
      }
    }
    coveredMs += currentEnd - currentStart;
    const totalHours = coveredMs / (1000 * 60 * 60);
    const isFull = totalHours >= 8; // fully booked (8 hours)
    return { full: isFull, partial: !isFull && events.length > 0 };
  }, []);

  const loadMonthData = useCallback(async () => {
    if (!selectedHallId) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (
      loadingRef.current ||
      (lastLoadedRef.current.hallId === selectedHallId &&
        lastLoadedRef.current.year === year &&
        lastLoadedRef.current.month === month)
    ) {
      return;
    }

    loadingRef.current = true;
    setLoadingMonth(true);
    setError("");

    const days = getDaysInMonth(year, month);
    const newMap = new Map<string, DayStatus>();

    for (const day of days) {
      const key = formatDateKey(day);
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      if (isWeekend) {
        // weekends are always free (white)
        newMap.set(key, {
          date: day,
          isFullyBooked: false,
          hasAnyBooking: false,
          bookings: [],
          loaded: true,
        });
        continue;
      }

      const events = await fetchDayOverview(day);
      const { full, partial } = evaluateDay(events);
      newMap.set(key, {
        date: day,
        isFullyBooked: full,
        hasAnyBooking: partial,
        bookings: events,
        loaded: true,
      });
    }

    setDaysStatus(newMap);
    lastLoadedRef.current = { hallId: selectedHallId, year, month };
    setLoadingMonth(false);
    loadingRef.current = false;
  }, [selectedHallId, currentDate, fetchDayOverview, evaluateDay, getDaysInMonth]);

  // Trigger loading when hall or month/year changes
  useEffect(() => {
    if (selectedHallId) {
      loadMonthData();
    }
  }, [selectedHallId, currentDate.getFullYear(), currentDate.getMonth(), loadMonthData]);

  // Fetch halls once
  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/halls`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch halls");
        const data = await res.json();
        setHalls(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHalls();
  }, []);

  const handleDateClick = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      const key = formatDateKey(date);
      const status = daysStatus.get(key);
      setBookingsForSelectedDate(status?.bookings || []);
    },
    [daysStatus]
  );

  const changeMonth = useCallback((delta: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
    setSelectedDate(null);
    setBookingsForSelectedDate([]);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) calendarDays.push(null);
  daysInMonth.forEach((day) => calendarDays.push(day));
  while (calendarDays.length < 42) calendarDays.push(null);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push("/home")}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hall Availability Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">
            🔴 Red = Fully booked (≥8 hours) or TNP event &nbsp;|&nbsp; 🟡 Yellow = Partially booked &nbsp;|&nbsp; ⚪ White = Free
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Hall</label>
          <select
            value={selectedHallId ?? ""}
            onChange={(e) => setSelectedHallId(Number(e.target.value))}
            className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Choose a hall --</option>
            {halls.map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.name} {hall.location ? `(${hall.location})` : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedHallId && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                ◀ Previous
              </button>
              <span className="text-lg font-semibold">
                {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
              </span>
              <button
                onClick={() => changeMonth(1)}
                className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Next ▶
              </button>
            </div>

            {loadingMonth && (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600 mr-2" />
                <span className="text-sm text-gray-500">Loading availability...</span>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-600">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="bg-white p-2 h-24" />;
                  const key = formatDateKey(day);
                  const status = daysStatus.get(key);
                  const isFullyBooked = status?.isFullyBooked || false;
                  const hasAnyBooking = status?.hasAnyBooking || false;
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === day.toDateString();

                  // Color logic: RED (full/TNP), YELLOW (partial), WHITE (free)
                  let bgColor = "bg-white";
                  if (status?.loaded) {
                    if (isFullyBooked) bgColor = "bg-red-100 hover:bg-red-200";
                    else if (hasAnyBooking) bgColor = "bg-yellow-100 hover:bg-yellow-200";
                    else bgColor = "bg-white hover:bg-gray-50";
                  } else {
                    bgColor = "bg-gray-50";
                  }

                  return (
                    <button
                      key={key}
                      onClick={() => handleDateClick(day)}
                      className={`${bgColor} p-2 h-24 flex flex-col items-center justify-start transition ${
                        isToday ? "ring-2 ring-indigo-400" : ""
                      } ${isSelected ? "ring-2 ring-indigo-600 bg-indigo-50" : ""}`}
                    >
                      <span className={`text-sm font-medium ${isToday ? "text-indigo-600" : "text-gray-700"}`}>
                        {day.getDate()}
                      </span>
                      {status?.loaded && !isFullyBooked && hasAnyBooking && (
                        <span className="text-[10px] text-yellow-700 mt-1">● partial</span>
                      )}
                      {status?.loaded && isFullyBooked && (
                        <span className="text-[10px] text-red-700 mt-1">● full</span>
                      )}
                      {status?.loaded && !hasAnyBooking && (
                        <span className="text-[10px] text-green-600 mt-1">○ free</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-indigo-600" />
                  Events on {selectedDate.toDateString()}
                </h3>
                {bookingsForSelectedDate.length === 0 ? (
                  <p className="text-gray-500 text-sm">No events scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {bookingsForSelectedDate.map((event, idx) => (
                      <div key={idx} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.start).toLocaleTimeString()} → {new Date(event.end).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.hall} • {event.type === "TNP" ? "TNP BLOCK" : "Booking"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}