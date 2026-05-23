import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

interface MedicationResponse {
  id: number;
  name: string;
  activeSubstance: string | null;
  dosage: string;
  manufacturer: string | null;
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

const initialForm = {
  name: '',
  activeSubstance: '',
  dosage: '',
  manufacturer: '',
};

export default function MedicationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['medications', page, size, search],
    queryFn: async () => {
      if (search.trim()) {
        const res = await api.get(`/api/medications/search?q=${search}`);
        return { content: res.data.data, totalElements: res.data.data.length, totalPages: 1, number: 0, size: res.data.data.length, first: true, last: true } as Page<MedicationResponse>;
      }
      const res = await api.get('/api/medications', {
        params: { page, size, sortBy: 'name', sortDir: 'asc' }
      });
      return res.data.data as Page<MedicationResponse>;
    },
    staleTime: 2 * 60 * 1000,
  });

  const medications = data?.content ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/medications', {
        name: form.name.trim(),
        activeSubstance: form.activeSubstance.trim() || null,
        dosage: form.dosage.trim(),
        manufacturer: form.manufacturer.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setSuccessMessage('Medication added successfully.');
      setForm(initialForm);
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create medication.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/api/medications/${editId}`, {
        name: form.name.trim(),
        activeSubstance: form.activeSubstance.trim() || null,
        dosage: form.dosage.trim(),
        manufacturer: form.manufacturer.trim() || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setSuccessMessage('Medication updated successfully.');
      setForm(initialForm);
      setIsModalOpen(false);
      setEditId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to update medication.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/medications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      setDeleteId(null);
      setFormError(err.response?.data?.message || 'Failed to delete medication.');
    }
  });

  const openCreate = () => {
    setEditId(null);
    setForm(initialForm);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (med: MedicationResponse) => {
    setEditId(med.id);
    setForm({
      name: med.name,
      activeSubstance: med.activeSubstance || '',
      dosage: med.dosage,
      manufacturer: med.manufacturer || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  };

  const clearSearch = () => {
    setSearch('');
    setSearchInput('');
    setPage(0);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Medications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {data?.totalElements} medication{data?.totalElements !== 1 ? 's' : ''} in catalog
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <i className="ti ti-plus text-base" aria-hidden="true" />
          Add medication
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <i className="ti ti-circle-check text-base" aria-hidden="true" />
          {successMessage}
        </div>
      )}

      {/* Search + Controls */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4 flex flex-wrap gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden="true" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name..."
              className="border border-slate-200 rounded-lg pl-8 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="text-sm text-slate-400 hover:text-slate-700 flex items-center gap-1"
            >
              <i className="ti ti-x text-xs" aria-hidden="true" />
              Clear
            </button>
          )}
        </form>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Rows:</span>
          <select
            value={size}
            onChange={e => { setSize(Number(e.target.value)); setPage(0); }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
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
              <th className="text-left px-4 py-3 font-medium">Active Substance</th>
              <th className="text-left px-4 py-3 font-medium">Dosage</th>
              <th className="text-left px-4 py-3 font-medium">Manufacturer</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {medications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                  {search ? `No medications found for "${search}".` : 'No medications yet. Add the first one from the button above.'}
                </td>
              </tr>
            ) : medications.map((med, i) => (
              <tr
                key={med.id}
                className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="ti ti-pill text-blue-500 text-sm" aria-hidden="true" />
                    </div>
                    <p className="font-medium text-slate-900">{med.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{med.activeSubstance || '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                    {med.dosage}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{med.manufacturer || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => openEdit(med)}
                      className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <i className="ti ti-pencil text-xs mr-1" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(med.id)}
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

        {/* Pagination */}
        {!search && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-sm text-slate-400">
              Page {(data?.number ?? 0) + 1} of {data?.totalPages ?? 1}
              <span className="ml-2 text-slate-300">·</span>
              <span className="ml-2">{data?.totalElements} total</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={data?.first}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <i className="ti ti-chevron-left text-sm" aria-hidden="true" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={data?.last}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <i className="ti ti-chevron-right text-sm" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-900">
                {editId !== null ? 'Edit medication' : 'Add medication'}
              </h2>
              <button
                onClick={() => { setIsModalOpen(false); setEditId(null); setFormError(''); setForm(initialForm); }}
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
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Paracetamol"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Active substance
                </label>
                <input
                  value={form.activeSubstance}
                  onChange={e => setForm(p => ({ ...p, activeSubstance: e.target.value }))}
                  placeholder="Acetaminophen"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Dosage <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.dosage}
                  onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))}
                  placeholder="500mg"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Manufacturer
                </label>
                <input
                  value={form.manufacturer}
                  onChange={e => setForm(p => ({ ...p, manufacturer: e.target.value }))}
                  placeholder="Teva"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                  <i className="ti ti-alert-circle text-base flex-shrink-0" aria-hidden="true" />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => { setIsModalOpen(false); setEditId(null); setFormError(''); setForm(initialForm); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => editId !== null ? updateMutation.mutate() : createMutation.mutate()}
                  disabled={
                    (editId !== null ? updateMutation.isPending : createMutation.isPending) ||
                    !form.name || !form.dosage
                  }
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(editId !== null ? updateMutation.isPending : createMutation.isPending) ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : editId !== null ? 'Save changes' : 'Add medication'}
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
              <i className="ti ti-pill text-red-400 text-xl" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 text-center mb-1">
              Delete medication
            </h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Are you sure? This medication will be removed from the catalog.
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
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}