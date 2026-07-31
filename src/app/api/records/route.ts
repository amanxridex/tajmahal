import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Only initialize Redis if environment variables are set
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export async function GET() {
  if (!redis) {
    console.warn("Redis is not configured. Returning empty records.");
    return NextResponse.json({});
  }

  try {
    const records = await redis.hgetall('tajmahal_records') || {};
    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching records", error);
    return NextResponse.json({}, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!redis) return NextResponse.json({ error: 'Redis is not configured' }, { status: 500 });

  try {
    const { date, number } = await request.json();
    
    if (!date || !number) {
      return NextResponse.json({ error: 'Date and Number are required' }, { status: 400 });
    }

    await redis.hset('tajmahal_records', { [date]: number });
    
    const records = await redis.hgetall('tajmahal_records') || {};
    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error("Error saving record", error);
    return NextResponse.json({ error: 'Failed to save record' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!redis) return NextResponse.json({ error: 'Redis is not configured' }, { status: 500 });

  try {
    const { date } = await request.json();
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    await redis.hdel('tajmahal_records', date);
    
    const records = await redis.hgetall('tajmahal_records') || {};
    return NextResponse.json({ success: true, records });
  } catch (error) {
    console.error("Error deleting record", error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
