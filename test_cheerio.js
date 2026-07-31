const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('../temp2.html', 'utf8');
const $ = cheerio.load(html);

$('head').prepend('<base href="https://bhagirathsatta.com/">');

$('strong.namelive').each((i, el) => {
  const text = $(el).text();
  if (text.includes('DESAWER')) {
      $(el).html(`
        <span style="color: #03F; font-size: 30px;">OVERWRITTEN TEXT 99</span><br>
      `);
  }
});

const out = $.html();
console.log("Original length:", html.length);
console.log("Output length:", out.length);
console.log("Output line count:", out.split('\n').length);
