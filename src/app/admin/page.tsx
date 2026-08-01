'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [records, setRecords] = useState<Record<string, string>>({});
  const [date, setDate] = useState('');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Credentials state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [credLoading, setCredLoading] = useState(false);
  const [credMessage, setCredMessage] = useState('');
  
  const router = useRouter();

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

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setCredLoading(true);
    setCredMessage('');
    
    const res = await fetch('/api/auth/change-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: newPassword })
    });
    
    if (res.ok) {
      setCredMessage('Credentials updated successfully!');
      setNewUsername('');
      setNewPassword('');
    } else {
      setCredMessage('Failed to update credentials.');
    }
    setCredLoading(false);
  };
  
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 text-black">
      <div className="max-w-2xl mx-auto bg-white p-4 sm:p-8 rounded-lg shadow relative">
        
        <button 
          onClick={handleLogout}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded text-sm font-semibold transition"
        >
          Logout
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-blue-700 mt-8 sm:mt-0">TAJ MAHAL - Admin Panel</h1>
        
        <form onSubmit={handleSave} className="mb-8 p-4 sm:p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Add or Update Record</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full p-3 sm:p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
              <input 
                type="number" 
                value={number} 
                onChange={e => setNumber(e.target.value)}
                className="w-full p-3 sm:p-2 border border-gray-300 rounded"
                placeholder="e.g. 45"
                required
              />
            </div>
            <div className="flex sm:items-end">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-2 px-6 rounded shadow transition"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>

        <h2 className="text-xl font-semibold mb-4">Existing Records ({sortedDates.length})</h2>
        <div className="overflow-x-auto mb-12">
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

        <div className="border-t pt-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Change Login Credentials</h2>
          <form onSubmit={handleChangeCredentials} className="p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200">
            {credMessage && (
              <div className={`mb-4 p-3 rounded text-sm font-semibold ${credMessage.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {credMessage}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Username</label>
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full p-3 sm:p-2 border border-gray-300 rounded"
                  placeholder="e.g. admin"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="text" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full p-3 sm:p-2 border border-gray-300 rounded"
                  placeholder="e.g. secret123"
                  required
                />
              </div>
              <div className="flex sm:items-end">
                <button 
                  type="submit" 
                  disabled={credLoading}
                  className="w-full sm:w-auto bg-gray-800 hover:bg-black text-white font-bold py-3 sm:py-2 px-6 rounded shadow transition disabled:opacity-70"
                >
                  {credLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
