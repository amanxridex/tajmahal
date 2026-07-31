'use client';
import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [records, setRecords] = useState<Record<string, string>>({});
  const [date, setDate] = useState('');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    const res = await fetch('/api/records');
    if (res.ok) {
      const data = await res.json();
      setRecords(data);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !number) return;
    setLoading(true);
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, number })
    });
    if (res.ok) {
      const data = await res.json();
      setRecords(data.records);
      setDate('');
      setNumber('');
    }
    setLoading(false);
  };

  const handleDelete = async (dateToDelete: string) => {
    const res = await fetch('/api/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateToDelete })
    });
    if (res.ok) {
        const data = await res.json();
        setRecords(data.records);
    }
  };

  // Sort dates
  const sortedDates = Object.keys(records).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Format YYYY-MM-DD to DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateStr;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">TAJ MAHAL - Admin Panel</h1>
        
        <form onSubmit={handleSave} className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold mb-4">Add or Update Record</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
              <input 
                type="number" 
                value={number} 
                onChange={e => setNumber(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g. 45"
                required
              />
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow transition"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>

        <h2 className="text-xl font-semibold mb-4">Existing Records ({sortedDates.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="p-3 text-left border">Date</th>
                <th className="p-3 text-center border">Number</th>
                <th className="p-3 text-center border">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedDates.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500 border">No records found.</td>
                </tr>
              )}
              {sortedDates.map((d) => (
                <tr key={d} className="hover:bg-gray-50">
                  <td className="p-3 border font-medium">{formatDate(d)}</td>
                  <td className="p-3 border text-center text-red-600 font-bold text-lg">{records[d]}</td>
                  <td className="p-3 border text-center">
                    <button 
                      onClick={() => handleDelete(d)}
                      className="text-red-500 hover:text-red-700 font-semibold text-sm underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
