import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

function getISTDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params;
  const pathParam = resolvedParams.slug ? resolvedParams.slug.join('/') : '';
  const searchParams = request.nextUrl.search;
  const urlPath = `https://bhagirathsatta.com/${pathParam}${searchParams}`;
  
  try {
    const res = await fetch(urlPath);
    const contentType = res.headers.get('content-type') || '';
    
    if (contentType.includes('text/html')) {
      let html = await res.text();
      
      // Inject base tag to fix relative links and assets
      html = html.replace(/<head>/i, '<head><base href="https://bhagirathsatta.com/">');

      // Fetch dynamic records
      let records: Record<string, string> = {};
      if (redis) {
        try {
          records = await redis.hgetall('tajmahal_records') || {};
        } catch (e) {
          console.error("Failed to load records from Redis", e);
        }
      }

      const todayStr = getISTDateString(0);
      const yesterdayStr = getISTDateString(-1);

      const todayNumber = records[todayStr] || '--';
      const yesterdayNumber = records[yesterdayStr] || '--';

      const marqueeText = `TAJ MAHAL » YESTERDAY (${yesterdayStr}): ${yesterdayNumber} || TODAY (${todayStr}): ${todayNumber} (Result at 4:00 PM IST)`;
      
      // Overwrite the specific DESAWER section with TAJ MAHAL and TODAY'S NUMBER
      html = html.replace(
        /<strong class="namelive">DESAWER<br>[\s\S]*?<\/strong>\s*<\/center>/g,
        `<strong class="namelive" style="color:#03F; font-size:25px;">TAJ MAHAL<br></strong>
         <strong style="font-size:36px;font-weight:bold;color:white;">
            <img src="https://bhagirathsatta.com/images/LIVE.gif" height="20" width="44">
            ${todayNumber} <img src="https://bhagirathsatta.com/images/LIVE.gif" height="20" width="44">
         </strong>
         </center>
         <a href="/tajmahal-records" style="display:block; text-decoration:none; background-image: linear-gradient(blue 50%, #000); font-weight: bold;color: #fff; font-size: 20px; border-style: outset; margin: 10px; padding: 5px; border-radius: 20px; text-align: center;text-transform: capitalize;">
            TAJ MAHAL RECORDS
         </a>`
      );

      // Replace marquee contents
      html = html.replace(/<marquee(.*?)>([\s\S]*?)<\/marquee>/ig, `<marquee$1>${marqueeText}</marquee>`);
      
      // Auto-refresh script
      const autoRefreshScript = `
      <script>
        (function() {
          let currentTodayNumber = "${todayNumber}";
          setInterval(async function() {
            try {
              const res = await fetch('/api/records');
              const data = await res.json();
              const d = new Date();
              const todayStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
              const newNumber = data[todayStr] || '--';
              if (newNumber !== '--' && newNumber !== currentTodayNumber) {
                // Number got updated today! Reload!
                window.location.reload();
              }
            } catch(e) {}
          }, 60000);
        })();
      </script>
      `;
      html = html.replace(/<\/body>/i, `${autoRefreshScript}</body>`);
      
      // 1. Convert absolute links to relative so navigation stays inside the proxy
      html = html.replace(/href=["']https?:\/\/(www\.)?bhagirathsatta\.com\/?(.*?)["']/gi, 'href="/$2"');
      
      // 2. Protect any image/script source URLs that have the domain
      html = html.replace(/src=["'](.*?)bhagirathsatta\.com(.*?)["']/gi, 'src="PROTECTED_SRC_$1_$2"');
      
      // 3. Replace the domain names in the text
      html = html.replace(/www\.bhagirathsatta\.com/gi, 'www.superd.com');
      html = html.replace(/bhagirathsatta\.com/gi, 'superd.com');
      
      // 4. Replace all other text occurrences of bhagirathsatta with superd
      html = html.replace(/bhagirathsatta/gi, 'superd');
      html = html.replace(/Bhagirath Satta/gi, 'Superd');
      
      // 5. Restore the protected src URLs
      html = html.replace(/src="PROTECTED_SRC_(.*?)_(.*?)"/g, 'src="$1bhagirathsatta.com$2"');
      
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    
    // For other assets, just proxy
    return new NextResponse(res.body, {
      headers: {
        'Content-Type': contentType,
      }
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Error proxying request", { status: 500 });
  }
}
