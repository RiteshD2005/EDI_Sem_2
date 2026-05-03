// components/TnpForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface Hall {
  id: number;
  name: string;
  capacity: number;
}

interface FormData {
  companyName: string;
  driveType: "Placement" | "Internship" | "Test";
  roundType: string;
  startTime: string;
  endTime: string;
  expectedStudents: number;
  description: string;
  hallIds: number[];
}

export default function TnpForm({ halls }: { halls: Hall[] }) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    driveType: "Placement",
    roundType: "",
    startTime: "",
    endTime: "",
    expectedStudents: 0,
    description: "",
    hallIds: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [conflictMsg, setConflictMsg] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHallToggle = (hallId: number) => {
    setFormData((prev) => ({
      ...prev,
      hallIds: prev.hallIds.includes(hallId)
        ? prev.hallIds.filter((id) => id !== hallId)
        : [...prev.hallIds, hallId],
    }));
  };

  const validate = () => {
    if (!formData.companyName.trim()) return "Company name is required";
    if (!formData.roundType.trim()) return "Round type is required";
    if (!formData.startTime) return "Start time is required";
    if (!formData.endTime) return "End time is required";
    if (formData.expectedStudents <= 0) return "Expected students must be > 0";
    if (formData.hallIds.length === 0) return "Select at least one hall";
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (start >= end) return "End time must be after start time";
    return null;
  };

  const checkConflicts = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Unauthorized");

    const res = await fetch(`${API_BASE_URL}/api/tnp/check-conflicts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        startTime: formData.startTime,
        endTime: formData.endTime,
        hallIds: formData.hallIds,
      }),
    });
    if (!res.ok) throw new Error("Conflict check failed");
    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setConflictMsg("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const conflictResult = await checkConflicts();
      if (conflictResult.conflicts && conflictResult.conflicts.length > 0) {
        const conflictingHallNames = conflictResult.conflicts
          .map((id: number) => halls.find((h) => h.id === id)?.name || id)
          .join(", ");
        setConflictMsg(`Conflict in halls: ${conflictingHallNames}. Cannot proceed.`);
        return;
      }

      const token = localStorage.getItem("token");
      const createRes = await fetch(`${API_BASE_URL}/api/tnp/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.message || "Creation failed");
      }
      setSuccess("Request created successfully!");
      setTimeout(() => router.push("/tnp/home"), 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-500 hover:text-indigo-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm text-gray-400">Back</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {conflictMsg && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
          {conflictMsg}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Company Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Company Name *</label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Drive Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Drive Type *</label>
        <select
          name="driveType"
          value={formData.driveType}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="Placement">Placement</option>
          <option value="Internship">Internship</option>
          <option value="Test">Test</option>
        </select>
      </div>

      {/* Round Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Round Type *</label>
        <input
          type="text"
          name="roundType"
          value={formData.roundType}
          onChange={handleChange}
          required
          placeholder="e.g., Technical, HR, Aptitude"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time *</label>
          <input
            type="datetime-local"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Time *</label>
          <input
            type="datetime-local"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Expected Students */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Expected Students *</label>
        <input
          type="number"
          name="expectedStudents"
          value={formData.expectedStudents}
          onChange={handleChange}
          required
          min="1"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      {/* Halls Multi-Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Halls *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto">
          {halls.map((hall) => (
            <label key={hall.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.hallIds.includes(hall.id)}
                onChange={() => handleHallToggle(hall.id)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              {hall.name} (Cap: {hall.capacity})
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          placeholder="Additional details..."
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/tnp/home")}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
          {loading ? "Creating..." : "Create Request"}
        </button>
      </div>
    </form>
  );
}