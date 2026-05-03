"use client";

import { useState, useEffect } from "react";

type Slot = {
    start: string;
    end: string;
    status: "FREE" | "BOOKED" |"TNP";
    event?: string;
    hall?: string;
};

export default function BookingSlotsPage() {
    const [hallId, setHallId] = useState("");
    const [date, setDate] = useState("");
    const [slots, setSlots] = useState<Slot[]>([]);
    const [halls, setHalls] = useState([]);

    const fetchSlots = async () => {
        const token = localStorage.getItem("token");

        const res = await fetch(
            `http://localhost:8080/admin/slots?hallId=${hallId}&date=${date}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        const text = await res.text();

        if (!res.ok) {
            console.log(text);
            alert("Failed to fetch slots");
            setSlots([]);
            return;
        }

        const data = text ? JSON.parse(text) : [];

        // ✅ ensure it's array
        if (Array.isArray(data)) {
            setSlots(data);
        } else {
            setSlots([]);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");

        fetch("http://localhost:8080/admin/halls", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(setHalls);
    }, []);

    return (
        <div className="space-y-8">

            {/* 🔥 TITLE */}
            <div>
                <h1 className="text-2xl font-bold">Booking Timeline</h1>
                <p className="text-sm text-gray-500">
                    View booked and available slots for selected hall
                </p>
            </div>

            {/* 🔍 FILTER */}
            <div className="bg-white p-4 rounded-xl shadow flex gap-4">

                <select
                    value={hallId}
                    onChange={(e) => setHallId(e.target.value)}
                    className="border px-3 py-2 rounded-lg text-sm"
                >
                    <option value="">Select Hall</option>

                    {halls.map((hall: any) => (
                        <option key={hall.id} value={hall.id}>
                            {hall.name}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border px-3 py-2 rounded-lg text-sm"
                />

                <button
                    disabled={!hallId || !date}
                    onClick={fetchSlots}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                    Check Slots
                </button>
            </div>

            {/* 📊 TABLE */}
            <div className="bg-white rounded-xl shadow overflow-hidden">

                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="p-3 text-left">#</th>
                            <th className="p-3 text-left">Time</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Event</th>
                            <th className="p-3 text-left">Hall</th>
                        </tr>
                    </thead>

                    <tbody>
                        {slots.map((slot, index) => (
                            <tr key={`${slot.start}-${slot.end}-${index}`}>

                                {/* S.NO */}
                                <td className="p-3">{index + 1}</td>

                                {/* TIME */}
                                <td className="p-3">
                                    {slot.start} → {slot.end}
                                </td>

                                {/* STATUS */}
                                <td className="p-3">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${slot.status === "BOOKED"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-green-100 text-green-700"
                                            }`}
                                    >
                                        {slot.status}
                                    </span>
                                </td>

                                {/* EVENT */}
                                <td className="p-3">
                                    {slot.event || "-"}
                                </td>

                                {/* HALL */}
                                <td className="p-3">
                                    {slot.hall || "-"}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>

                {slots.length === 0 && (
                    <p className="p-4 text-gray-500 text-sm">
                        No data available. Select hall and date.
                    </p>
                )}
            </div>
        </div>
    );
}