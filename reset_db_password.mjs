import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

// Load .env or .env.local if present
for (const file of ['.env.local', '.env']) {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        value = value.trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function reset() {
  if (!url || !token) {
    console.log('No UPSTASH_REDIS_REST_URL / KV_REST_API_URL found in environment.');
    console.log('Admin password default in code has been set to: 09876kamal');
    return;
  }

  try {
    const redis = new Redis({ url, token });
    await redis.set('admin_username', 'admin');
    await redis.set('admin_password', '09876kamal');
    console.log('SUCCESS: Admin credentials in Redis DB updated to:');
    console.log('  Username: admin');
    console.log('  Password: 09876kamal');
  } catch (err) {
    console.error('Failed to update Redis DB:', err);
  }
}

reset();
