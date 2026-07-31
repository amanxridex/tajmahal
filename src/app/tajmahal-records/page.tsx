import { Redis } from '@upstash/redis';

// Force dynamic rendering since records change over time
export const dynamic = 'force-dynamic';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = url && token
  ? new Redis({ url, token })
  : null;

export default async function RecordsPage() {
  let records: Record<string, string> = {};
  
  if (redis) {
    try {
      records = await redis.hgetall('tajmahal_records') || {};
    } catch (e) {
      console.error("Failed to load records from Redis", e);
    }
  }

  const sortedDates = Object.keys(records).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#0f0', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
          &larr; Back to Home
        </a>
        
        <div style={{ backgroundImage: 'linear-gradient(blue 50%, #000)', fontWeight: 'bold', color: '#fff', fontSize: '24px', borderStyle: 'outset', margin: '20px 0', padding: '10px', borderRadius: '20px', textAlign: 'center', textTransform: 'capitalize' }}>
          TAJ MAHAL RECORDS
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>
          <thead>
            <tr style={{ background: '#333', color: '#fff' }}>
              <th style={{ padding: '12px', border: '1px solid #555' }}>Date</th>
              <th style={{ padding: '12px', border: '1px solid #555' }}>Taj Mahal</th>
            </tr>
          </thead>
          <tbody style={{ background: '#fff', color: '#000' }}>
            {sortedDates.length > 0 ? (
              sortedDates.map((date) => (
                <tr key={date} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '12px', border: '1px solid #ccc' }}>{date}</td>
                  <td style={{ padding: '12px', border: '1px solid #ccc', color: 'red', fontSize: '20px' }}>
                    {records[date]}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{ padding: '12px', textAlign: 'center', border: '1px solid #ccc' }}>
                  {redis ? "No records available. Add some in the admin panel." : "Database not connected. Please configure Vercel KV."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
