const cheerio = require('cheerio');
fetch('https://bhagirathsatta.com')
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    const records = { '2026-07-01': '55', '2026-07-02': '99' }; // dummy
    
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
            $('<td><strong style="color:red; font-size: 22px;">' + recordValue + '</strong></td>').insertAfter(dateTd);
          }
        });
        
        console.log('Modified Table Header & Row 1:');
        console.log($(el).html().substring(0, 1500));
      }
    });
  });
