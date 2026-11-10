const fs = require('fs');

const pages = JSON.parse(fs.readFileSync('apps/server/data/bulan-pages.json'));

const chapters = [];
let currentChapter = {
  id: 'c1',
  title: 'Bab 1: Gerimis Membungkus Sekolah',
  content: '',
  startPage: 5,
};

let babIndex = 1;

for (let i = 0; i < pages.length; i++) {
  const p = pages[i];
  if (p.pageNumber < 5) continue; // Skip title / copyright / dedication pages

  // Clean text: remove leading page number
  let cleaned = p.text.replace(/^\d+\s+/, '').trim();

  // Fix drop cap on first page of book: "ERIMIS" -> "GERIMIS"
  if (p.pageNumber === 5 && cleaned.startsWith('ERIMIS')) {
    cleaned = 'G' + cleaned;
  }

  // Detect new chapter: large gap or drop cap at start of page
  const isNewChapter = (
    (p.pageNumber === 13 && cleaned.startsWith('AMU')) ||
    (p.pageNumber === 23 && cleaned.startsWith('EL')) ||
    (p.pageNumber === 33 && cleaned.startsWith('APAT')) ||
    (p.pageNumber === 43 && cleaned.startsWith('ALAM')) ||
    (p.pageNumber === 53 && cleaned.startsWith('AK')) ||
    (p.pageNumber > 5 && /^[A-Z]{3,}\s+[a-z]/.test(cleaned) && p.pageNumber % 2 !== 0) ||
    /^(?:BAB|Bab)\s+\d+/.test(cleaned)
  );

  // Split into natural chapters roughly every 15-20 pages or on chapter markers
  if ((p.pageNumber > currentChapter.startPage + 14 && /^[A-Z]/.test(cleaned)) || (babIndex === 1 && p.pageNumber === 13)) {
    // End current chapter
    chapters.push({ ...currentChapter });
    babIndex++;
    
    // Fix drop caps
    if (cleaned.startsWith('AMU berani')) cleaned = 'K' + cleaned;
    
    const firstSentence = cleaned.split('.')[0];
    const shortTitle = firstSentence.length > 40 ? firstSentence.slice(0, 40) + '...' : firstSentence;

    currentChapter = {
      id: `c${babIndex}`,
      title: `Bab ${babIndex}: ${shortTitle.replace(/^[”"']/, '')}`,
      content: cleaned,
      startPage: p.pageNumber,
    };
  } else {
    currentChapter.content += (currentChapter.content ? '\n\n' : '') + cleaned;
  }
}

if (currentChapter.content) {
  chapters.push(currentChapter);
}

console.log('Total extracted chapters:', chapters.length);
chapters.forEach((ch, idx) => {
  console.log(`[${ch.id}] ${ch.title} (Hal ${ch.startPage}, chars: ${ch.content.length})`);
});

fs.writeFileSync('apps/server/data/bulan-chapters.json', JSON.stringify(chapters, null, 2));
console.log('Saved to apps/server/data/bulan-chapters.json');

