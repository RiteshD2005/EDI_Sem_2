// components/TnpCard.tsx
"use client";

import { Calendar, Clock, Users, Building2 } from "lucide-react";

interface TnpRequest {
  id: number;
  companyName: string;
  driveType: string;
  startTime: string;
  endTime: string;
  expectedStudents: number;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy: string;
  email: string;
  halls: string[];
}

export default function TnpCard({ request }: { request: TnpRequest }) {
  const statusConfig = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
    APPROVED: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
    REJECTED: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
  };
  const config = statusConfig[request.status];

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{request.companyName}</h3>
          <p className="text-sm text-gray-500">{request.driveType}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formatTime(request.startTime)} → {formatTime(request.endTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Expected: {request.expectedStudents} students</span>
        </div>
        {request.halls && request.halls.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Halls: {request.halls.join(", ")}</span>
          </div>
        )}
        {request.description && (
          <p className="text-gray-500 text-xs mt-2 border-t pt-2">{request.description}</p>
        )}
      </div>
    </div>
  );
}