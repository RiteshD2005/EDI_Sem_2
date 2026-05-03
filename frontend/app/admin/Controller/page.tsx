"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  Building2,
  Users,
  Plus,
  Power,
  PowerOff,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

type Hall = {
  id: number;
  name: string;
  capacity: number;
  active: boolean;
};

export default function AdminControllerPage() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hallName, setHallName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [hallLocation, setHallLocation] = useState("");
  const [imageLinks, setImageLinks] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [amenityInput, setAmenityInput] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [hallType, setHallType] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [coordinatorEmail, setCoordinatorEmail] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch Halls
  const fetchHalls = async () => {
    if (!token) {
      setNotification({ type: "error", message: "Authentication token missing" });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/halls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("Unauthorized: Please login again");
        }
        throw new Error(`Failed to fetch halls (${res.status})`);
      }
      const text = await res.text();
      let data = [];
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = [];
        }
      }
      setHalls(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setNotification({ type: "error", message: err.message || "Failed to load halls" });
    } finally {
      setLoading(false);
    }
  };

  const addImageLink = () => {
    if (!imageInput) return;

    setImageLinks([...imageLinks, imageInput]);
    setImageInput("");
  };

  const removeImage = (index: number) => {
    setImageLinks(imageLinks.filter((_, i) => i !== index));
  };

  const addHall = async () => {
    const token = localStorage.getItem("token");

    if (!hallName || !capacity) {
      alert("Name and capacity required");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/admin/halls/addhall`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: hallName,
          capacity: Number(capacity),
          halllocation: hallLocation,
          amenities: amenities,
          imageUrls: imageLinks,

          type: hallType,
          visibility: visibility,
          coordinatorEmail: coordinatorEmail || null
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        alert(text);
        return;
      }

      alert("Hall added successfully");

      setHallName("");
      setCapacity("");
      setHallLocation("");
      setAmenities([]);

      fetchHalls(); // 🔥 refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to add hall");
    }
  };

  const addAmenity = () => {
    if (!amenityInput.trim()) return;
    setAmenities([...amenities, amenityInput.trim()]);
    setAmenityInput("");
  };

  const removeAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  // Toggle Hall Active/Inactive
  const toggleHall = async (id: number, current: boolean) => {
    if (!token) return;

    setTogglingId(id);

    try {
      const res = await fetch(`${API_BASE_URL}/halls/${id}/toggle`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      // ✅ instant UI update
      setHalls((prev) =>
        prev.map((h) =>
          h.id === id ? { ...h, active: !h.active } : h
        )
      );

      setNotification({
        type: "success",
        message: `Hall ${current ? "deactivated" : "activated"} successfully`,
      });

    } catch (err: any) {
      console.error(err);
      setNotification({
        type: "error",
        message: err.message || "Failed to update hall status",
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Add Admin with proper error handling
  const addAdmin = async () => {
    if (!email.trim()) {
      setNotification({ type: "error", message: "Please enter an email address" });
      return;
    }
    if (!email.includes("@")) {
      setNotification({ type: "error", message: "Please enter a valid email address" });
      return;
    }
    setAddingAdmin(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/add-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      // Handle specific HTTP status codes
      if (res.status === 404) {
        throw new Error("Email not found. User does not exist.");
      }
      if (res.status === 409) {
        throw new Error("User already has admin privileges.");
      }
      if (res.status === 400) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Invalid request. Please check the email.");
      }
      if (!res.ok) {
        throw new Error(`Failed to add admin (${res.status})`);
      }

      setEmail("");
      setNotification({ type: "success", message: "Admin added successfully" });
    } catch (err: any) {
      console.error(err);
      setNotification({ type: "error", message: err.message || "Failed to add admin" });
    } finally {
      setAddingAdmin(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg transition-all ${notification.type === "success"
            ? "bg-green-50 text-green-800 border border-green-200"
            : "bg-red-50 text-red-800 border border-red-200"
            }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">System Controller</h1>
        <p className="text-sm text-gray-500">Manage admin privileges and control hall availability</p>
      </div>

      {/* Add Admin Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800">Add Administrator</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="email"
              placeholder="Enter user email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={addingAdmin}
            />
            <button
              onClick={addAdmin}
              disabled={addingAdmin}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {addingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {addingAdmin ? "Adding..." : "Add Admin"}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">The user will be granted admin privileges immediately.</p>
        </div>
      </div>

      {/* Halls Management Section */}
      <div>
        <div className="bg-white p-6 rounded-xl shadow space-y-5">
          <h2 className="text-lg font-semibold text-gray-800">
            Add New Hall
          </h2>

          {/* BASIC FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <input
              type="text"
              placeholder="Hall Name"
              value={hallName}
              onChange={(e) => setHallName(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            />

            <input
              type="number"
              placeholder="Capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            />

            <input
              type="text"
              placeholder="Location"
              value={hallLocation}
              onChange={(e) => setHallLocation(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            />

          </div>

          {/* 🔥 NEW FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* TYPE */}
            <select
              value={hallType}
              onChange={(e) => setHallType(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            >
              <option value="">Select Type</option>
              <option value="LAB">Lab</option>
              <option value="HALL">Hall</option>
              <option value="CLASSROOM">Classroom</option>
              <option value="CABIN">Cabin</option>
            </select>

            {/* VISIBILITY */}
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            >
              <option value="PUBLIC">Public (Student + TNP)</option>
              <option value="TNP_ONLY">TNP Only</option>
            </select>

            {/* COORDINATOR EMAIL */}
            <input
              type="email"
              placeholder="Coordinator Email (optional)"
              value={coordinatorEmail}
              onChange={(e) => setCoordinatorEmail(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            />

          </div>

          {/* AMENITIES */}
          <div className="space-y-3">
            <label className="text-sm text-gray-600">Amenities</label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add amenity (e.g. Projector, AC)"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                className="flex-1 border px-3 py-2 rounded-lg text-sm"
              />
              <button
                onClick={addAmenity}
                className="bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity, index) => (
                <div
                  key={index}
                  className="bg-gray-100 px-3 py-1 rounded-full text-xs flex items-center gap-2"
                >
                  <span className="truncate max-w-[120px]">{amenity}</span>
                  <button
                    onClick={() => removeAmenity(index)}
                    className="text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* IMAGES */}
            <label className="text-sm text-gray-600">Hall Images (Links)</label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste image link"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className="flex-1 border px-3 py-2 rounded-lg text-sm"
              />

              <button
                onClick={addImageLink}
                className="bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {imageLinks.map((link, index) => (
                <div
                  key={index}
                  className="bg-gray-100 px-3 py-1 rounded-full text-xs flex items-center gap-2"
                >
                  <span className="truncate max-w-[120px]">{link}</span>
                  <button
                    onClick={() => removeImage(index)}
                    className="text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT */}
          <button
            onClick={addHall}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
          >
            Add Hall
          </button>
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-800">All Halls</h2>
        </div>
        <span className="text-sm text-gray-500">{halls.length} total</span>
      </div>


      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-200" />
                <div className="h-5 w-24 rounded bg-gray-200" />
              </div>
              <div className="mb-4 h-4 w-20 rounded bg-gray-200" />
              <div className="h-8 w-24 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : halls.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No halls found</h3>
          <p className="mt-1 text-sm text-gray-500">Halls will appear here once added via backend.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {halls.map((hall) => (
            <div key={hall.id}
              className="group relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              {/* Status indicator */}
              <div className="absolute right-4 top-4">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${hall.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                >
                  {hall.active ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                  {hall.active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Hall name */}
              <div className="mb-3 pr-20">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{hall.name}</h3>
              </div>

              {/* Capacity */}
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>
                  Capacity: <span className="font-medium text-gray-900">{hall.capacity}</span>
                </span>
              </div>

              {/* Toggle button */}
              <button
                onClick={() => toggleHall(hall.id, hall.active)}
                disabled={togglingId === hall.id}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${hall.active
                  ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                  } focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50`}
              >
                {togglingId === hall.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : hall.active ? (
                  <>
                    <PowerOff className="h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4" />
                    Activate
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}