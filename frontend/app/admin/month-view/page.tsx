"use client";

import { useEffect, useState, useCallback } from "react";

type RawBooking = {
  date?: string;
  eventDate?: string;
  startTime?: string;
  name: string;
  time: string;
  phone: string;
  event: string;
  eventType: string;
  hall: string;
};

type DisplayRow = {
  day: number;
  hall: string;
  name: string;
  event: string;
  eventType: string;
  time: string;
  phone: string;
};

export default function MonthlyViewPage() {
  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const generateEmptyRows = useCallback(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      hall: "",
      name: "",
      event: "",
      eventType: "",
      time: "",
      phone: "",
    }));
  }, [year, month]);

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("Authentication token missing");
      setRows(generateEmptyRows());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:8080/admin/month-view?year=${year}&month=${month}`;
      console.log("Fetching:", url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let errorText = `HTTP error ${res.status}`;
        try {
          const errorBody = await res.text();
          if (errorBody) errorText += `: ${errorBody}`;
        } catch {}
        throw new Error(errorText);
      }
      const data = await res.json();
      console.log("BACKEND DATA:", data);
      console.log("Year:", year, "Month:", month); // 🔍 Debug log

      // ✅ Ensure bookings is an array
      const bookings: RawBooking[] = Array.isArray(data) ? data : [];

      // Group by day number with safe date parsing
      const bookingsByDay: Record<number, RawBooking[]> = {};
      for (const b of bookings) {
        // Try multiple possible date fields
        const rawDate = b.date || b.eventDate || b.startTime;
        if (!rawDate) {
          console.warn("No date field in booking:", b);
          continue;
        }
        const parsedDate = new Date(rawDate);
        if (isNaN(parsedDate.getTime())) {
          console.error("Invalid date from backend:", b);
          continue;
        }
        const dayNum = parsedDate.getDate();
        if (!bookingsByDay[dayNum]) bookingsByDay[dayNum] = [];
        bookingsByDay[dayNum].push(b);
      }

      const daysInMonth = new Date(year, month, 0).getDate();
      const allRows: DisplayRow[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayBookings = bookingsByDay[day] || [];
        if (dayBookings.length === 0) {
          allRows.push({
            day,
            hall: "",
            name: "",
            event: "",
            eventType: "",
            time: "",
            phone: "",
          });
        } else {
          for (const booking of dayBookings) {
            const nameParts = booking.name.split(" / ");
            const formattedName = nameParts.length > 1
              ? `${nameParts[0]} / ${nameParts[1]}`
              : nameParts[0];

            const phoneParts = booking.phone.split(" / ");
            const formattedPhone = phoneParts.length > 1
              ? `${phoneParts[0]} / ${phoneParts[1]}`
              : phoneParts[0];

            allRows.push({
              day,
              hall: booking.hall || "—",
              name: formattedName,
              event: booking.event,
              eventType: booking.eventType || "—",
              time: booking.time,
              phone: formattedPhone,
            });
          }
        }
      }
      setRows(allRows);
    } catch (err) {
      console.error("Error fetching monthly data", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      setRows(generateEmptyRows());
    } finally {
      setLoading(false);
    }
  }, [token, year, month, generateEmptyRows]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monthly Booking View</h1>
        <p className="text-sm text-gray-500">All days shown – empty rows where no booking exists</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border px-3 py-2 rounded-lg bg-white"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border px-3 py-2 rounded-lg w-28 bg-white"
        />
        <button
          onClick={fetchData}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          ⚠️ {error} – showing empty table for the selected month.
        </div>
      )}

      <div className="bg-white rounded-xl shadow border overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No data for this month</div>
        ) : (
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border px-4 py-3 text-left font-semibold">Date</th>
                <th className="border px-4 py-3 text-left font-semibold">Hall</th>
                <th className="border px-4 py-3 text-left font-semibold">Name</th>
                <th className="border px-4 py-3 text-left font-semibold">Event Details</th>
                <th className="border px-4 py-3 text-left font-semibold">Event Type</th>
                <th className="border px-4 py-3 text-left font-semibold">Time</th>
                <th className="border px-4 py-3 text-left font-semibold">Phone</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="border px-4 py-3 text-center">{row.day}</td>
                  <td className="border px-4 py-3 text-gray-700">{row.hall || "—"}</td>
                  <td className="border px-4 py-3 font-medium">{row.name || "—"}</td>
                  <td className="border px-4 py-3">{row.event || "—"}</td>
                  <td className="border px-4 py-3">{row.eventType || "—"}</td>
                  <td className="border px-4 py-3">{row.time || "—"}</td>
                  <td className="border px-4 py-3">{row.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-gray-400 border-t pt-4">
        <p>📅 The Date column shows only the day number (month/year selected above).</p>
        <p>👥 Name and Phone show faculty alone, or student/faculty separated by '/' when applicable.</p>
        <p>📌 Days without any booking appear as empty rows.</p>
      </div>
    </div>
  );
}