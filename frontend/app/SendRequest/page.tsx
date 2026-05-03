"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import {
  Calendar,
  Clock,
  Users,
  Home,
  FileText,
  Package,
  User as UserIcon,
  Briefcase,
  Tag,
  ArrowLeft,
} from "lucide-react";

interface Hall {
  id: number;
  name: string;
  capacity: number;
  location: string;
  amenities?: string;
  image_urls?: string;
}

interface FormData {
  userId: number;
  userName: string;
  clubName: string;
  designation: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  studentStrength: number;
  hallId: number | null;
  eventTitle: string;
  eventDescription: string;
  resourcesNeeded: string;
  coordinatorName: string;
  coordinatorPhone: string;
}

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  icon?: React.ElementType;
  disabled?: boolean;
  min?: string;
  max?: string;
}

const Field = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder = "",
  icon: Icon,
  ...props
}: FieldProps) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative rounded-md shadow-sm">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`block w-full ${Icon ? "pl-10" : "pl-3"} pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
        {...props}
      />
    </div>
  </div>
);

export default function RequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [userRole, setUserRole] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    userId: 0,
    userName: "",
    clubName: "",
    designation: "",
    eventType: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    studentStrength: 0,
    hallId: null,
    eventTitle: "",
    eventDescription: "",
    resourcesNeeded: "",
    coordinatorName: "",
    coordinatorPhone: "",
  });

  const [allHalls, setAllHalls] = useState<Hall[]>([]);
  const [filteredHalls, setFilteredHalls] = useState<Hall[]>([]);
  const [loadingHalls, setLoadingHalls] = useState(false);

  const eventTypes = ["Seminar", "Workshop", "Conference", "Guest Lecture", "Cultural", "Other"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setFormData((prev) => ({
        ...prev,
        userId: user.user_id || user.id,
        userName: user.full_name || user.name,
      }));
      setUserRole(user.role || "USER");
    }

    const fetchHalls = async () => {
      setLoadingHalls(true);
      try {
        const response = await fetch(`${API_BASE_URL}/halls`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch halls");
        const data = await response.json();
        setAllHalls(data);
        setFilteredHalls(data);
      } catch (err) {
        console.error("Error fetching halls:", err);
        setError("Could not load hall list.");
      } finally {
        setLoadingHalls(false);
      }
    };
    fetchHalls();
  }, [router]);

  useEffect(() => {
    if (formData.studentStrength > 0) {
      const filtered = allHalls.filter(
        (hall) => hall.capacity >= formData.studentStrength
      );
      setFilteredHalls(filtered);
      if (formData.hallId && !filtered.some((h) => h.id === formData.hallId)) {
        setFormData((prev) => ({ ...prev, hallId: null }));
      }
    } else {
      setFilteredHalls(allHalls);
    }
  }, [formData.studentStrength, allHalls, formData.hallId]);

  const validateForm = () => {
    if (!formData.clubName) return "Club name is required";
    if (!formData.designation) return "Designation is required";
    if (!formData.eventType) return "Event type is required";
    if (!formData.eventDate) return "Event date is required";
    if (!formData.startTime) return "Start time is required";
    if (!formData.endTime) return "End time is required";
    if (formData.studentStrength <= 0) return "Student strength must be greater than 0";
    if (!formData.hallId) return "Please select a hall";
    if (!formData.eventTitle) return "Event title is required";
    if (!formData.eventDescription) return "Event description is required";
    if (!formData.resourcesNeeded) return "Resources needed is required";

    // Student-specific validations
    if (userRole === "STUDENT") {
      if (!formData.coordinatorName) return "Coordinator name is required";
      if (!formData.coordinatorPhone) return "Coordinator phone is required";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.eventDate);
    if (selectedDate < today) return "Event date cannot be in the past";

    const startTime = formData.startTime;
    const endTime = formData.endTime;
    if (startTime < "08:00" || startTime > "17:00") {
      return "Start time must be between 08:00 and 17:00";
    }
    if (endTime < "09:00" || endTime > "18:00") {
      return "End time must be between 09:00 and 18:00";
    }
    if (startTime >= endTime) {
      return "End time must be after start time";
    }

    const selectedHall = allHalls.find((h) => h.id === formData.hallId);
    if (selectedHall && selectedHall.capacity < formData.studentStrength) {
      return "Selected hall capacity is insufficient for the student strength";
    }

    return null;
  };

  // Handler for text inputs (used by Field components)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for select and textarea (union type)
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStrengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, studentStrength: isNaN(value) ? 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const startDateTime = `${formData.eventDate}T${formData.startTime}:00`;
    const endDateTime = `${formData.eventDate}T${formData.endTime}:00`;

    const payload: any = {
      hallId: formData.hallId,
      clubName: formData.clubName,
      designation: formData.designation,
      eventType: formData.eventType,
      startTime: startDateTime,
      endTime: endDateTime,
      eventDate: formData.eventDate,
      studentStrength: formData.studentStrength,
      eventTitle: formData.eventTitle,
      eventDescription: formData.eventDescription,
      resourcesNeeded: formData.resourcesNeeded,
    };

    // Add coordinator info only for students
    if (userRole === "STUDENT") {
      payload.coordinatorName = formData.coordinatorName;
      payload.coordinatorPhone = formData.coordinatorPhone;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/booking/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit request");
      }

      setSuccess("Request submitted successfully!");
      setFormData({
        ...formData,
        clubName: "",
        designation: "",
        eventType: "",
        eventDate: "",
        startTime: "",
        endTime: "",
        studentStrength: 0,
        hallId: null,
        eventTitle: "",
        eventDescription: "",
        resourcesNeeded: "",
        coordinatorName: "",
        coordinatorPhone: "",
      });
      setContactPhone("");
      setTimeout(() => router.push("/home"), 5000);
    } catch (err: unknown) {
      let errorMessage = "An error occurred. Please try again.";
      if (err instanceof Error) errorMessage = err.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/home")}
            className="inline-flex items-center text-gray-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Home
          </button>
          <div className="text-sm text-gray-500">
            <span className="font-medium">Step 1 of 1</span> — Request Booking
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-linear-to-r from-indigo-600 to-indigo-800 px-6 py-8">
            <h1 className="text-2xl font-bold text-white">Request a Seminar Hall</h1>
            <p className="text-indigo-100 mt-1">
              Fill out the details below to submit your booking request.
            </p>
          </div>

          {/* Error & Success Messages */}
          {(error || success) && (
            <div className="px-6 py-4 border-b">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700 text-sm">{success}</p>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Personal & Club Info */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-indigo-600" />
                Personal & Club Details
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field
                  label="User Name"
                  name="userName"
                  value={formData.userName}
                  onChange={() => { }}
                  disabled
                  icon={UserIcon}
                />
                <Field
                  label="Club Name"
                  name="clubName"
                  value={formData.clubName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your club name"
                  icon={Briefcase}
                />
                <Field
                  label="Designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., President, Secretary"
                  icon={Tag}
                />
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Your phone number"
                  />
                </div>
                <div>
                  <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="eventType"
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleSelectChange}
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select event type</option>
                      {eventTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Event Details
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field
                  label="Event Title"
                  name="eventTitle"
                  value={formData.eventTitle}
                  onChange={handleInputChange}
                  required
                  placeholder="Title of the event"
                  icon={FileText}
                />

                {userRole === "STUDENT" && (
                  <>
                    <Field
                      label="Coordinator Name (Faculty)"
                      name="coordinatorName"
                      value={formData.coordinatorName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter faculty coordinator name"
                      icon={UserIcon}
                    />
                    <Field
                      label="Coordinator Phone"
                      name="coordinatorPhone"
                      value={formData.coordinatorPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter coordinator phone"
                      icon={Users}
                    />
                  </>
                )}

                <div className="sm:col-span-2">
                  <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="eventDescription"
                      name="eventDescription"
                      rows={3}
                      value={formData.eventDescription}
                      onChange={handleSelectChange}
                      required
                      placeholder="Describe the event in detail"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Time & Venue */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Time & Venue
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field
                  label="Event Date"
                  name="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  icon={Calendar}
                />
                <Field
                  label="Start Time"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  required
                  min="08:00"
                  max="18:00"
                  icon={Clock}
                />
                <Field
                  label="End Time"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  required
                  min="08:00"
                  max="18:00"
                  icon={Clock}
                />
                <Field
                  label="Student Strength"
                  name="studentStrength"
                  type="number"
                  value={formData.studentStrength}
                  onChange={handleStrengthChange}
                  required
                  min="1"
                  placeholder="Expected number of attendees"
                  icon={Users}
                />
                <div className="sm:col-span-2">
                  <label htmlFor="hallId" className="block text-sm font-medium text-gray-700 mb-1">
                    Hall / Room <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Home className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="hallId"
                      name="hallId"
                      value={formData.hallId ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hallId: e.target.value ? parseInt(e.target.value, 10) : null,
                        }))
                      }
                      required
                      disabled={loadingHalls}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select a hall</option>
                      {filteredHalls.map((hall) => (
                        <option key={hall.id} value={hall.id}>
                          {hall.name} (Capacity: {hall.capacity})
                        </option>
                      ))}
                    </select>
                    {loadingHalls && <p className="mt-1 text-sm text-gray-500">Loading halls...</p>}
                    {formData.studentStrength > 0 && filteredHalls.length === 0 && !loadingHalls && (
                      <p className="mt-1 text-sm text-red-600">
                        No hall available with capacity ≥ {formData.studentStrength}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resources Needed */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                Resources
              </h2>
              <div>
                <label htmlFor="resourcesNeeded" className="block text-sm font-medium text-gray-700 mb-1">
                  Resources Needed <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="resourcesNeeded"
                    name="resourcesNeeded"
                    rows={2}
                    value={formData.resourcesNeeded}
                    onChange={handleSelectChange}
                    required
                    placeholder="e.g., Projector, Microphone, Whiteboard"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}