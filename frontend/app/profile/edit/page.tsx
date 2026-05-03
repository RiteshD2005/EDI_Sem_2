"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    // 🔥 Load existing data
    fetch("http://localhost:8080/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setName(data.full_name || "");
        setPhone(data.phone || "");
      });
  }, []);

  const handleUpdate = async () => {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: name,
          phone: phone,
        }),
      });

      if (!res.ok) {
        alert("Update failed");
        return;
      }

      alert("Profile updated successfully ✅");

      router.push("/profile");

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow space-y-6">

        <h1 className="text-xl font-semibold">
          Edit Profile
        </h1>

        {/* Name */}
        <div>
          <label className="text-sm text-gray-600">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 border px-3 py-2 rounded-lg"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm text-gray-600">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mt-1 border px-3 py-2 rounded-lg"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">

          <button
            onClick={() => router.push("/profile")}
            className="px-4 py-2 rounded-lg border"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}