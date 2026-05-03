"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { ArrowLeft, Calendar, Clock, Users, Building2, Check, X, AlertCircle, Wand2, ChevronDown, ChevronUp } from "lucide-react";

interface Hall {
  id: number;
  name: string;
  capacity: number;
  location: string;
  type: "HALL" | "CLASSROOM" | "LAB" | "CABIN";
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

type GroupedHalls = {
  HALL: Hall[];
  CLASSROOM: Hall[];
  LAB: Hall[];
  CABIN: Hall[];
};

export default function CreateTnpPage() {
  const router = useRouter();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [groupedHalls, setGroupedHalls] = useState<GroupedHalls>({
    HALL: [],
    CLASSROOM: [],
    LAB: [],
    CABIN: [],
  });
  const [expandedSections, setExpandedSections] = useState({
    HALL: true,
    CLASSROOM: true,
    LAB: true,
    CABIN: true,
  });
  const [loadingHalls, setLoadingHalls] = useState(true);
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [conflictError, setConflictError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoadingHalls(true);
    fetch(`${API_BASE_URL}/halls`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch halls");
        return res.json();
      })
      .then((data) => {
        const hallsArray = Array.isArray(data) ? data : [];
        setHalls(hallsArray);
        // Group by type
        const grouped: GroupedHalls = {
          HALL: hallsArray.filter((h: Hall) => h.type === "HALL"),
          CLASSROOM: hallsArray.filter((h: Hall) => h.type === "CLASSROOM"),
          LAB: hallsArray.filter((h: Hall) => h.type === "LAB"),
          CABIN: hallsArray.filter((h: Hall) => h.type === "CABIN"),
        };
        setGroupedHalls(grouped);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load halls");
      })
      .finally(() => setLoadingHalls(false));
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear conflict error when user changes drive type
    if (name === "driveType") setConflictError("");
  };

  const toggleHallSelection = (hallId: number) => {
    setFormData((prev) => ({
      ...prev,
      hallIds: prev.hallIds.includes(hallId)
        ? prev.hallIds.filter((id) => id !== hallId)
        : [...prev.hallIds, hallId],
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Improved auto-assign with priority based on drive type
  const autoAssignHalls = () => {
    const requiredStrength = formData.expectedStudents;
    if (requiredStrength <= 0) {
      setError("Please enter expected students before auto-assigning halls.");
      return;
    }

    // Define priority order for hall types based on drive type
    let priorityOrder: Array<keyof GroupedHalls> = [];
    if (formData.driveType === "Test") {
      priorityOrder = ["LAB", "CLASSROOM", "HALL", "CABIN"];
    } else {
      // Placement / Internship
      priorityOrder = ["HALL", "CLASSROOM", "LAB", "CABIN"];
    }

    // Collect all halls in priority order (each hall appears once)
    const sortedHalls: Hall[] = [];
    for (const type of priorityOrder) {
      sortedHalls.push(...groupedHalls[type]);
    }

    // Sort each group by capacity (ascending) to avoid over‑selecting large halls?
    // Actually for auto‑assign, we want to pick smallest halls first to exactly meet capacity.
    // But we need to respect priority order: first try all halls of highest priority type (sorted by capacity),
    // then move to next type.
    // Simpler: filter halls by priority order and sort each group by capacity.
    const prioritizedHalls: Hall[] = [];
    for (const type of priorityOrder) {
      const hallsOfType = [...groupedHalls[type]].sort((a, b) => a.capacity - b.capacity);
      prioritizedHalls.push(...hallsOfType);
    }

    let totalCapacity = 0;
    const selectedIds: number[] = [];
    for (const hall of prioritizedHalls) {
      if (totalCapacity >= requiredStrength) break;
      totalCapacity += hall.capacity;
      selectedIds.push(hall.id);
    }

    if (totalCapacity < requiredStrength) {
      setError(
        `Not enough total capacity (${totalCapacity}) to accommodate ${requiredStrength} students.`
      );
      return;
    }

    setFormData((prev) => ({ ...prev, hallIds: selectedIds }));
    setError("");
  };

  const validateForm = (): string | null => {
    if (!formData.companyName.trim()) return "Company name is required";
    if (!formData.roundType.trim()) return "Round type is required";
    if (!formData.startTime) return "Start time is required";
    if (!formData.endTime) return "End time is required";
    if (formData.expectedStudents <= 0) return "Expected students must be greater than 0";
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
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Conflict check failed");
    }
    return res.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setConflictError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const conflictResult = await checkConflicts();
      if (conflictResult.conflicts && conflictResult.conflicts.length > 0) {
        setConflictError("Some halls already booked. Admin approval will override.");
        // Optionally, still allow submission – just show warning
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
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSelectedCapacity = formData.hallIds.reduce((total, hallId) => {
    const hall = halls.find((h) => h.id === hallId);
    return total + (hall?.capacity || 0);
  }, 0);

  const isCapacitySufficient = formData.expectedStudents > 0 && totalSelectedCapacity >= formData.expectedStudents;

  if (loadingHalls) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 transition"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create TNP Request</h1>
            <p className="text-sm text-gray-500">
              Fill in the details for placement / internship / test drive
            </p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {conflictError && (
          <div className="mb-6 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            {conflictError}
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., TCS, Infosys, Google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drive Type *
                </label>
                <select
                  name="driveType"
                  value={formData.driveType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Placement">Placement</option>
                  <option value="Internship">Internship</option>
                  <option value="Test">Test</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Round Type *
                </label>
                <input
                  type="text"
                  name="roundType"
                  value={formData.roundType}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Technical, HR, Aptitude"
                />
              </div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Schedule
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Details Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Additional Details
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Students *
                </label>
                <input
                  type="number"
                  name="expectedStudents"
                  value={formData.expectedStudents}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Number of students expected"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Additional information about the drive..."
                />
              </div>
            </div>
          </div>

          {/* Halls Selection Card (Grouped by Type) */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Select Halls *
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {formData.hallIds.length} selected
                </span>
                <button
                  type="button"
                  onClick={autoAssignHalls}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Auto Assign
                </button>
              </div>
            </div>

            {/* Total Capacity of Selected Halls */}
            {formData.hallIds.length > 0 && (
              <div className="mb-4 p-2 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium text-gray-700">Total Capacity:</span>{" "}
                <span className="text-indigo-600 font-semibold">{totalSelectedCapacity}</span> students
                {formData.expectedStudents > 0 && (
                  <span
                    className={`ml-2 text-xs ${
                      isCapacitySufficient ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isCapacitySufficient ? "✓ Sufficient" : "⚠ Insufficient"}
                  </span>
                )}
              </div>
            )}

            {/* Grouped Halls with collapsible sections */}
            <div className="space-y-4">
              {(["HALL", "CLASSROOM", "LAB", "CABIN"] as const).map((type) => {
                const hallsOfType = groupedHalls[type];
                if (hallsOfType.length === 0) return null;
                const isExpanded = expandedSections[type];
                return (
                  <div key={type} className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleSection(type)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <span className="font-medium text-gray-700">
                        {type === "HALL"
                          ? "Hall"
                          : type === "CLASSROOM"
                          ? "Classrooms"
                          : type === "LAB"
                          ? "Labs"
                          : "Cabins"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {hallsOfType.map((hall) => {
                          const isSelected = formData.hallIds.includes(hall.id);
                          return (
                            <div
                              key={hall.id}
                              onClick={() => toggleHallSelection(hall.id)}
                              className={`cursor-pointer rounded-lg border-2 transition-all p-3 relative ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50 shadow-md"
                                  : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm"
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <Check className="h-4 w-4 text-indigo-600" />
                                </div>
                              )}
                              <h4 className="font-semibold text-gray-900 pr-6">{hall.name}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                Capacity: {hall.capacity}
                              </p>
                              <p className="text-sm text-gray-500">Location: {hall.location}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {formData.hallIds.length === 0 && (
              <p className="text-xs text-red-500 mt-2">Select at least one hall</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/tnp/home")}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                "Create Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}