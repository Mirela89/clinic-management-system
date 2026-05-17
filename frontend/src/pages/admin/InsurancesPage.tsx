import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

interface InsuranceResponse {
  id: number;
  providerName: string;
  policyNumber: string;
  coveragePercentage: number;
  expiryDate: string;
}

const initialForm = {
  providerName: "",
  policyNumber: "",
  coveragePercentage: "",
  expiryDate: "",
};

export default function InsurancesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { data: insurances = [], isLoading } = useQuery({
    queryKey: ["insurances"],
    queryFn: async () => {
      const res = await api.get("/api/insurances");
      return res.data.data as InsuranceResponse[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/insurances", {
        providerName: form.providerName.trim(),
        policyNumber: form.policyNumber.trim(),
        coveragePercentage: Number(form.coveragePercentage),
        expiryDate: form.expiryDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurances"] });
      setSuccessMessage("Insurance provider added successfully.");
      setForm(initialForm);
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      setFormError(
        err.response?.data?.message || "Failed to create insurance.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/insurances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insurances"] });
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Insurance Providers
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage insurance providers available to patients
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreateOpen(true);
            setFormError("");
            setSuccessMessage("");
          }}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <i className="ti ti-plus text-base" aria-hidden="true" />
          Add provider
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <i className="ti ti-circle-check text-base" aria-hidden="true" />
          {successMessage}
        </div>
      )}

      {/* List */}
      {insurances.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i
              className="ti ti-shield-check text-slate-300 text-2xl"
              aria-hidden="true"
            />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            No insurance providers yet
          </h2>
          <p className="text-sm text-slate-400">
            Add the first provider from the button above.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Provider</th>
                <th className="text-left px-4 py-3 font-medium">
                  Policy Number
                </th>
                <th className="text-left px-4 py-3 font-medium">Coverage</th>
                <th className="text-left px-4 py-3 font-medium">Expiry Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {insurances.map((ins, i) => (
                <tr
                  key={ins.id}
                  className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i
                          className="ti ti-shield-check text-emerald-500 text-sm"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="font-medium text-slate-900">
                        {ins.providerName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {ins.policyNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium border border-blue-100">
                      {ins.coveragePercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{ins.expiryDate}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteMutation.mutate(ins.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                Add insurance provider
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setFormError("");
                  setForm(initialForm);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className="ti ti-x text-lg" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Provider name <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.providerName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, providerName: e.target.value }))
                  }
                  placeholder="Signal Iduna"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Policy number <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.policyNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, policyNumber: e.target.value }))
                  }
                  placeholder="POL-2026-001"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Coverage percentage <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.coveragePercentage}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        coveragePercentage: e.target.value,
                      }))
                    }
                    placeholder="80"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Expiry date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, expiryDate: e.target.value }))
                  }
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                  <i
                    className="ti ti-alert-circle text-base flex-shrink-0"
                    aria-hidden="true"
                  />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    setIsCreateOpen(false);
                    setFormError("");
                    setForm(initialForm);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={
                    createMutation.isPending ||
                    !form.providerName ||
                    !form.policyNumber ||
                    !form.coveragePercentage ||
                    !form.expiryDate
                  }
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add provider"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
