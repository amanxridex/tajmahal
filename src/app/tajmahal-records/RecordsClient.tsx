'use client';
import { useState, useMemo } from 'react';

// Format YYYY-MM-DD to DD-MM-YYYY
function formatDate(dateStr: string) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

export default function RecordsClient({ records, hasRedis }: { records: Record<string, string>, hasRedis: boolean }) {
  const sortedDates = Object.keys(records).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  // Extract all unique months from the records
  const months = useMemo(() => {
    const mSet = new Set<string>();
    sortedDates.forEach(date => {
      // date is YYYY-MM-DD
      const monthPrefix = date.substring(0, 7); // YYYY-MM
      mSet.add(monthPrefix);
    });
    // Add current month just in case
    const currentMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).substring(0, 7);
    mSet.add(currentMonth);
    return Array.from(mSet).sort().reverse(); // newest first
  }, [sortedDates]);

  // Default to current month
  const currentMonthPrefix = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthPrefix);

  const filteredDates = sortedDates.filter(date => date.startsWith(selectedMonth));

  return (
    <>
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label style={{ marginRight: '10px', fontSize: '18px', fontWeight: 'bold' }}>Select Month: </label>
        <select 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ padding: '8px', fontSize: '16px', borderRadius: '5px', color: '#000', backgroundColor: '#fff', border: '2px solid #ccc', cursor: 'pointer' }}
        >
          {months.map(m => {
            const date = new Date(`${m}-01T00:00:00Z`);
            const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            return <option key={m} value={m}>{monthName}</option>;
          })}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>
        <thead>
          <tr style={{ background: '#333', color: '#fff' }}>
            <th style={{ padding: '12px', border: '1px solid #555' }}>Date</th>
            <th style={{ padding: '12px', border: '1px solid #555' }}>Taj Mahal</th>
          </tr>
        </thead>
        <tbody style={{ background: '#fff', color: '#000' }}>
          {filteredDates.length > 0 ? (
            filteredDates.map((date) => (
              <tr key={date} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '12px', border: '1px solid #ccc' }}>{formatDate(date)}</td>
                <td style={{ padding: '12px', border: '1px solid #ccc', color: 'red', fontSize: '20px' }}>
                  {records[date]}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} style={{ padding: '12px', textAlign: 'center', border: '1px solid #ccc' }}>
                {hasRedis ? "No records available for this month." : "Database not connected. Please configure Vercel KV."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
