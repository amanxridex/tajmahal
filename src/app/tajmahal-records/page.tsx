import { Redis } from '@upstash/redis';

// Force dynamic rendering since records change over time
export const dynamic = 'force-dynamic';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = url && token
  ? new Redis({ url, token })
  : null;

import RecordsClient from './RecordsClient';

export default async function RecordsPage() {
  let records: Record<string, string> = {};
  
  if (redis) {
    try {
      records = await redis.hgetall('tajmahal_records') || {};
    } catch (e) {
      console.error("Failed to load records from Redis", e);
    }
  }

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#0f0', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
          &larr; Back to Home
        </a>
        
        <div style={{ backgroundImage: 'linear-gradient(blue 50%, #000)', fontWeight: 'bold', color: '#fff', fontSize: '24px', borderStyle: 'outset', margin: '20px 0', padding: '10px', borderRadius: '20px', textAlign: 'center', textTransform: 'capitalize' }}>
          TAJ MAHAL RECORDS
        </div>

        <RecordsClient records={records} hasRedis={!!redis} />
      </div>
    </div>
  );
}
