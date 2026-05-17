import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

interface PatientResponse {
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  cnp: string;
  dateOfBirth: string;
  address: string;
  bloodType: string;
  insuranceId: number;
  insuranceProviderName: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

const bloodTypeLabels: Record<string, string> = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
};

export default function PatientsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("dateOfBirth");
  const [sortDir, setSortDir] = useState("asc");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patients", page, size, sortBy, sortDir],
    queryFn: async () => {
      const res = await api.get("/api/patients", {
        params: { page, size, sortBy, sortDir },
      });
      return res.data.data as Page<PatientResponse>;
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  if (isError)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
        Failed to load patients.
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Patients
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {data?.totalElements} total patients
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(0);
            }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="dateOfBirth">Date of Birth</option>
            <option value="userId">ID</option>
            <option value="cnp">CNP</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => {
              setSortDir(e.target.value);
              setPage(0);
            }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Rows:</span>
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Date of Birth</th>
              <th className="text-left px-4 py-3 font-medium">Blood Type</th>
              <th className="text-left px-4 py-3 font-medium">Insurance</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data?.content.map((patient, i) => {
              const initials =
                `${patient.user.firstName[0]}${patient.user.lastName[0]}`.toUpperCase();
              return (
                <tr
                  key={patient.userId}
                  className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {patient.user.firstName} {patient.user.lastName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {patient.user.phone || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {patient.user.email}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {patient.dateOfBirth}
                  </td>
                  <td className="px-4 py-3">
                    {patient.bloodType ? (
                      <span className="bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full font-medium border border-red-100">
                        {bloodTypeLabels[patient.bloodType] ||
                          patient.bloodType}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {patient.insuranceProviderName || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/patients/${patient.userId}`)}
                      className="text-xs text-blue-500 hover:text-blue-700 border border-blue-100 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-sm text-slate-400">
            Page {(data?.number ?? 0) + 1} of {data?.totalPages ?? 1}
            <span className="ml-2 text-slate-300">·</span>
            <span className="ml-2">{data?.totalElements} total</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={data?.first}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <i className="ti ti-chevron-left text-sm" aria-hidden="true" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data?.last}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <i className="ti ti-chevron-right text-sm" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
