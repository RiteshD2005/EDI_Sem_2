"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string }>({});

  const validatePhone = (phoneNumber: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneNumber) return "Phone number is required";
    if (!phoneRegex.test(phoneNumber)) return "Enter a valid 10-digit mobile number (starts with 6-9)";
    return null;
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    setFieldErrors({});

    // Frontend validation
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setFieldErrors({ phone: phoneError });
      setMessage(phoneError);
      setSuccess(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role, password, phone }),
      });

      const responseText = await response.text();
      let errorMessage = "";

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          // Handle Spring validation errors
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((err: any) => err.defaultMessage).join(", ");
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else {
            errorMessage = responseText || "Registration failed";
          }
        } catch {
          errorMessage = responseText || "Registration failed";
        }
        throw new Error(errorMessage);
      }

      setSuccess(true);
      setMessage("Registration successful. Redirecting to sign in...");
      setTimeout(() => router.push("/login"), 1200);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Something went wrong";
      setMessage(errMsg);
      setSuccess(false);
      // If the error is about phone, set field error
      if (errMsg.toLowerCase().includes("phone") || errMsg.includes("10-digit")) {
        setFieldErrors({ phone: errMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center sm:text-left">
          Create your account
        </h1>

        <form onSubmit={handleRegister} className="mt-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Enter your email"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhone(raw);
                if (fieldErrors.phone) setFieldErrors({});
              }}
              required
              className={`w-full rounded-xl border ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'} px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200`}
              placeholder="10-digit mobile number (e.g., 9876543210)"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              title="Enter a valid 10-digit mobile number starting with 6-9"
            />
            {fieldErrors.phone && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">Must be a 10-digit number starting with 6-9</p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white"
            >
              <option value="">Select role</option>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="TNP">TNP</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-500">min. 6 characters</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Create a password"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {loading ? "Registering..." : "Register"}
          </button>

          {/* Global message */}
          {message && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${success
                ? "border border-green-200 bg-green-50 text-green-700"
                : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {/* Login link */}
          <p className="text-sm text-gray-600 text-center pt-2">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}