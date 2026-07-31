import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

export async function GET() {
  if (!redis) return NextResponse.json({ error: 'Redis is not configured' }, { status: 500 });

  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-07-30');
  
  const mockData: Record<string, string> = {};
  
  // Loop from Jan 1 to Jul 30
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateString = currentDate.toLocaleDateString('en-CA'); // Gets YYYY-MM-DD format
    const randomNumber = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    mockData[dateString] = randomNumber;
    
    // Increment by 1 day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  try {
    await redis.hset('tajmahal_records', mockData);
    return NextResponse.json({ success: true, message: 'Mock data from Jan 1 to Jul 30 added successfully!' });
  } catch (error) {
    console.error("Error seeding database", error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
