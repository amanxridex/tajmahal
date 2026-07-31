import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params;
  const pathParam = resolvedParams.slug ? resolvedParams.slug.join('/') : '';
  const searchParams = request.nextUrl.search;
  const url = `https://bhagirathsatta.com/${pathParam}${searchParams}`;
  
  try {
    const res = await fetch(url);
    const contentType = res.headers.get('content-type') || '';
    
    if (contentType.includes('text/html')) {
      let html = await res.text();
      
      // Inject base tag to fix relative links and assets
      html = html.replace(/<head>/i, '<head><base href="https://bhagirathsatta.com/">');

      // Overwrite the specific DESAWER section with TAJ MAHAL 06 and inject a link to the records page below it
      html = html.replace(
        /<strong class="namelive">DESAWER<br>[\s\S]*?<\/strong>\s*<\/center>/g,
        `<strong class="namelive" style="color:#03F; font-size:25px;">TAJ MAHAL<br></strong>
         <strong style="font-size:36px;font-weight:bold;color:white;">
            <img src="https://bhagirathsatta.com/images/LIVE.gif" height="20" width="44">
            06 <img src="https://bhagirathsatta.com/images/LIVE.gif" height="20" width="44">
         </strong>
         </center>
         <a href="/tajmahal-records" style="display:block; text-decoration:none; background-image: linear-gradient(blue 50%, #000); font-weight: bold;color: #fff; font-size: 20px; border-style: outset; margin: 10px; padding: 5px; border-radius: 20px; text-align: center;text-transform: capitalize;">
            TAJ MAHAL RECORDS
         </a>`
      );

      // Also replace marquee texts
      html = html.replace(/DESAWER/g, 'TAJ MAHAL');
      
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
