import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Search, ChevronLeft, ChevronRight, User } from 'lucide-react';

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

export default function PatientsPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [sortBy, setSortBy] = useState('dateOfBirth');
  const [sortDir, setSortDir] = useState('asc');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patients', page, size, sortBy, sortDir],
    queryFn: async () => {
      const res = await api.get('/api/patients', {
        params: { page, size, sortBy, sortDir }
      });
      return res.data.data as Page<PatientResponse>;
    }
  });

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (isError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
      Failed to load patients.
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.totalElements} total patients
          </p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex gap-4 items-center">
        <span className="text-sm text-gray-600 font-medium">Sort by:</span>
        <select
          value={sortBy}
          onChange={e => { setSortBy(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="dateOfBirth">Date of Birth</option>
          <option value="userId">ID</option>
          <option value="cnp">CNP</option>
        </select>
        <select
          value={sortDir}
          onChange={e => { setSortDir(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Date of Birth</th>
              <th className="text-left px-4 py-3">Blood Type</th>
              <th className="text-left px-4 py-3">Insurance</th>
            </tr>
          </thead>
          <tbody>
            {data?.content.map((patient, i) => (
              <tr key={patient.userId}
                className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-4 py-3 font-medium text-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-100 text-blue-700 rounded-full p-1">
                      <User className="h-4 w-4" />
                    </div>
                    {patient.user.firstName} {patient.user.lastName}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{patient.user.email}</td>
                <td className="px-4 py-3 text-gray-600">{patient.user.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{patient.dateOfBirth}</td>
                <td className="px-4 py-3">
                  {patient.bloodType ? (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {patient.bloodType.replace('_', ' ')}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {patient.insuranceProviderName || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Page {(data?.number ?? 0) + 1} of {data?.totalPages ?? 1}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={data?.first}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={data?.last}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}