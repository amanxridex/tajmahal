import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import * as cheerio from 'cheerio';

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

      function formatDate(dateStr: string) {
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dateStr;
      }
      const todayFormatted = formatDate(todayStr);
      const yesterdayFormatted = formatDate(yesterdayStr);

      const marqueeText = `<span style="color: #03F; font-weight: bold;">TAJ MAHAL</span> <span style="color: #FF0000; font-weight: bold;">» YESTERDAY (${yesterdayFormatted}): ${yesterdayNumber} &nbsp;&nbsp;||&nbsp;&nbsp; TODAY (${todayFormatted}): ${todayNumber} (Result at 4:00 PM IST)</span>`;
      
      // Time logic for Main LIVE section
      const d = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(d.getTime() + istOffset);
      const hours = istTime.getUTCHours();
      const minutes = istTime.getUTCMinutes();
      const isAfter330PM = hours > 15 || (hours === 15 && minutes >= 30);

      let targetDateForLive = yesterdayFormatted;
      let targetNumberForLive = yesterdayNumber;

      if (todayNumber !== '--') {
        targetDateForLive = todayFormatted;
        targetNumberForLive = todayNumber;
      } else if (isAfter330PM) {
        targetDateForLive = todayFormatted;
        targetNumberForLive = '--';
      }
      
      // (Old DESAWER regex removed - replaced dynamically via Cheerio later)

      const tajMahalBox = `
<tr>
  <td colspan="2" valign="top" style="color:#000;">
      <div align="center">
          <div id="PanelRecord" style="margin-bottom: 20px;">
              <h5 style="color:green;">TAJ MAHAL</h5>
              <span style="font-size:17px;color:yellow;">
                  (<b>04:00 PM</b>)
              </span><br/>
              <strong style="font-size:18px;color:aqua;">
                  {${yesterdayNumber}} »
              </strong>
              <span style="color:yellow; font-size:18px;">
                  [<b>${todayNumber}</b>]
                  <br>
                  <img src="https://bhagirathsatta.com/images/LIVE.gif" height="20" width="34">
              </span>
          </div>
      </div>
  </td>
</tr>`;

      // Inject the TAJ MAHAL box at the top of the records table
      html = html.replace(
        /<table width="100%" border="0" style="border-color:red;">\s*<tr>\s*<td/i,
        `<table width="100%" border="0" style="border-color:red;">\n${tajMahalBox}\n<tr><td`
      );

      // Replace marquee contents
      html = html.replace(/<marquee(.*?)>([\s\S]*?)<\/marquee>/ig, `<marquee$1>${marqueeText}</marquee>`);

      // Add TAJ MAHAL column to the chart table using Cheerio
      const $ = cheerio.load(html);

      // Replace the very first live game with TAJ MAHAL
      const firstLiveGame = $('.namelive').first();
      if (firstLiveGame.length) {
        firstLiveGame.replaceWith(`
<strong class="namelive">TAJ MAHAL<br><span style="font-size: 16px; color: #ffeb3b;">(${targetDateForLive})</span><br>
  <strong style="font-size:36px;font-weight:bold;color:white;">
     <img src="https://bhagirathsatta.com/images/LIVE.gif" height="20" width="44">
     ${targetNumberForLive} <img src="https://bhagirathsatta.com/images/LIVE.gif" height="20" width="44">
  </strong>
</strong>
<a href="/tajmahal-records" style="display:block; text-decoration:none; background-image: linear-gradient(blue 50%, #000); font-weight: bold;color: #fff; font-size: 20px; border-style: outset; margin: 10px; padding: 5px; border-radius: 20px; text-align: center;text-transform: capitalize;">
   TAJ MAHAL RECORDS
</a>
        `);
      }

      $('table').each((i, el) => {
        const text = $(el).text();
        if (text.includes('DESAWER') && text.includes('DELHI BAZAR') && text.includes('Date')) {
          const rows = $(el).find('tr');
          rows.each((rowIndex, row) => {
            if (rowIndex === 0) {
              $('<td class="name" style="font-weight:bold;">TAJ MAHAL</td>').insertAfter($(row).find('td').first());
            } else {
              const dateTd = $(row).find('td').first();
              const dateText = dateTd.text().trim();
              const parts = dateText.split('-');
              let recordValue = '--';
              if (parts.length === 3) {
                const dbDateKey = `${parts[2]}-${parts[1]}-${parts[0]}`;
                recordValue = records[dbDateKey] || '--';
              }
              $('<td class="num" style="background:#ffffff; color:#000000; font-weight:bold; font-size:18px;">' + recordValue + '</td>').insertAfter(dateTd);
            }
          });
        }
      });
      html = $.html();
      
      // Auto-refresh script
      const autoRefreshScript = `
      <script>
        (function() {
          let displayedDate = "${targetDateForLive}";
          let currentTodayNumber = "${todayNumber}";
          setInterval(async function() {
            try {
              const d = new Date();
              const todayStrLoc = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
              const parts = todayStrLoc.split('-');
              const todayFormatted = parts[2] + '-' + parts[1] + '-' + parts[0];

              const istOffset = 5.5 * 60 * 60 * 1000;
              const istTime = new Date(d.getTime() + istOffset);
              const hours = istTime.getUTCHours();
              const minutes = istTime.getUTCMinutes();
              const isAfter330PM = hours > 15 || (hours === 15 && minutes >= 30);
              
              if (isAfter330PM && displayedDate !== todayFormatted) {
                 window.location.reload();
                 return;
              }

              const res = await fetch('/api/records');
              const data = await res.json();
              const newNumber = data[todayStrLoc] || '--';
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
