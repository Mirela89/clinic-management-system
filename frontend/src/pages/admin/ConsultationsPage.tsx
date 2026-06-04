import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";

interface ConsultationResponse {
  id: number;
  diagnosis: string;
  notes: string | null;
  consultationDate: string;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  prescriptionCount: number;
  analysisCount: number;
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConsultationsPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-consultations", page, size],
    queryFn: async () => {
      const res = await api.get("/api/consultations", {
        params: { page, size, sortBy: "consultationDate", sortDir: "desc" },
      });
      return res.data.data as Page<ConsultationResponse>;
    },
  });

  const consultations = data?.content ?? [];

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  if (isError)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        Failed to load consultations.
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Consultations
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {data?.totalElements} total consultations
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4 flex items-center justify-between">
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
              <th className="text-left px-4 py-3 font-medium">Patient</th>
              <th className="text-left px-4 py-3 font-medium">Doctor</th>
              <th className="text-left px-4 py-3 font-medium">Diagnosis</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Prescriptions</th>
              <th className="text-left px-4 py-3 font-medium">Analyses</th>
            </tr>
          </thead>
          <tbody>
            {consultations.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-400 text-sm"
                >
                  No consultations found.
                </td>
              </tr>
            ) : (
              consultations.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {c.patientName}
                    </p>
                    <p className="text-xs text-slate-400">ID #{c.patientId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-600">{c.doctorName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{c.diagnosis}</p>
                    {c.notes && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                        {c.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDateTime(c.consultationDate)}
                  </td>
                  <td className="px-4 py-3">
                    {c.prescriptionCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                        <i className="ti ti-pill text-xs" aria-hidden="true" />
                        {c.prescriptionCount}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.analysisCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        <i
                          className="ti ti-microscope text-xs"
                          aria-hidden="true"
                        />
                        {c.analysisCount}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
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
