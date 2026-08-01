const https = require('https');
https.get('https://bhagirathsatta.com/', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const cheerio = require('cheerio');
    const $ = cheerio.load(data);
    console.log('First Live Game HTML:');
    console.log($('.namelive').first().parent().html());
  });
});
