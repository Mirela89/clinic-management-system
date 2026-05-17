import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

interface DepartmentResponse {
  id: number;
  name: string;
  description: string | null;
  floor: number | null;
  doctorCount: number;
}

const initialForm = {
  name: "",
  description: "",
  floor: "",
};

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments-admin"],
    queryFn: async () => {
      const res = await api.get("/api/departments");
      return res.data.data as DepartmentResponse[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/departments", {
        name: form.name.trim(),
        description: form.description.trim() || null,
        floor: form.floor ? Number(form.floor) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-admin"] });
      setSuccessMessage("Department created successfully.");
      setForm(initialForm);
      setIsCreateOpen(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: any) => {
      setFormError(
        err.response?.data?.message || "Failed to create department.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/api/departments/${editId}`, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        floor: form.floor ? Number(form.floor) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-admin"] });
      setSuccessMessage("Department updated successfully.");
      setForm(initialForm);
      setEditId(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    },
    onError: (err: any) => {
      setFormError(
        err.response?.data?.message || "Failed to update department.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments-admin"] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      setDeleteId(null);
      setFormError(
        err.response?.data?.message || "Failed to delete department.",
      );
    },
  });

  const openCreate = () => {
    setForm(initialForm);
    setFormError("");
    setIsCreateOpen(true);
  };

  const openEdit = (dept: DepartmentResponse) => {
    setForm({
      name: dept.name,
      description: dept.description || "",
      floor: dept.floor?.toString() || "",
    });
    setFormError("");
    setEditId(dept.id);
  };

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
            Departments
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {departments.length} department{departments.length !== 1 ? "s" : ""}{" "}
            total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <i className="ti ti-plus text-base" aria-hidden="true" />
          Add department
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <i className="ti ti-circle-check text-base" aria-hidden="true" />
          {successMessage}
        </div>
      )}

      {/* List */}
      {departments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i
              className="ti ti-building-hospital text-slate-300 text-2xl"
              aria-hidden="true"
            />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            No departments yet
          </h2>
          <p className="text-sm text-slate-400">
            Add the first department from the button above.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Department</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Floor</th>
                <th className="text-left px-4 py-3 font-medium">Doctors</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, i) => (
                <tr
                  key={dept.id}
                  className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i
                          className="ti ti-building-hospital text-blue-500 text-sm"
                          aria-hidden="true"
                        />
                      </div>
                      <p className="font-medium text-slate-900">{dept.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {dept.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {dept.floor != null ? `Floor ${dept.floor}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                      {dept.doctorCount} doctor
                      {dept.doctorCount !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(dept)}
                        className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <i
                          className="ti ti-pencil text-xs mr-1"
                          aria-hidden="true"
                        />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteId(dept.id)}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreateOpen || editId !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                {editId !== null ? "Edit department" : "Add department"}
              </h2>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditId(null);
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
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Cardiology"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Heart and cardiovascular care"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Floor
                </label>
                <input
                  type="number"
                  value={form.floor}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, floor: e.target.value }))
                  }
                  placeholder="1"
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
                    setEditId(null);
                    setFormError("");
                    setForm(initialForm);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    editId !== null
                      ? updateMutation.mutate()
                      : createMutation.mutate()
                  }
                  disabled={
                    (editId !== null
                      ? updateMutation.isPending
                      : createMutation.isPending) || !form.name
                  }
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(
                    editId !== null
                      ? updateMutation.isPending
                      : createMutation.isPending
                  ) ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : editId !== null ? (
                    "Save changes"
                  ) : (
                    "Add department"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <i
                className="ti ti-building-hospital text-red-400 text-xl"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-base font-semibold text-slate-900 text-center mb-1">
              Delete department
            </h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Are you sure you want to delete this department? Doctors assigned
              to it will become unassigned.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
