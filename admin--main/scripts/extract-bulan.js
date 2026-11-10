const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extract() {
  const filePath = 'C:/Users/Admin/Downloads/Tere Liye - Bulan.pdf';
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log('Total pages:', doc.numPages);

  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const str = content.items
      .map(it => ('str' in it ? it.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (str) {
      pages.push({ pageNumber: p, text: str });
    }
    if (p % 50 === 0 || p === doc.numPages) {
      console.log(`Processed ${p}/${doc.numPages} pages...`);
    }
  }

  // Find chapter markers
  console.log('Sample Page 5:', pages.find(p => p.pageNumber === 5)?.text?.slice(0, 300));

  // Save extracted text
  fs.writeFileSync('apps/server/data/bulan-pages.json', JSON.stringify(pages, null, 2));
  console.log('Saved to apps/server/data/bulan-pages.json');
}

extract().catch(console.error);

