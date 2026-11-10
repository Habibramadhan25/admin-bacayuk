const fs = require('fs');

const chapters = JSON.parse(fs.readFileSync('apps/server/data/bulan-chapters.json'));
const syncPath = 'apps/server/data/runtime-sync.json';
const syncData = JSON.parse(fs.readFileSync(syncPath, 'utf8'));

// Find "BULAN"
const bulan = syncData.books.find(b => b.title === 'BULAN' || b.title.toLowerCase().includes('bulan'));
if (bulan) {
  bulan.chapters = chapters;
  bulan.totalPages = 401;
  bulan.synopsis = 'Gerimis membungkus halaman sekolah. Langit mendung. Petualangan Raib, Seli, dan Ali berlanjut ke Klan Matahari dalam Turnamen Bunga Matahari yang legendaris.';
  bulan.description = 'Novel fiksi petualangan karya Tere Liye menceritakan Raib, Seli, dan Ali yang pergi ke Klan Matahari untuk mencari Bunga Matahari Pertama yang Mekar.';
  bulan.fileType = 'PDF';
  console.log('Updated BULAN in syncData with', chapters.length, 'chapters!');
} else {
  console.log('BULAN not found in syncData, adding it...');
  syncData.books.unshift({
    id: 'book_bulan_' + Date.now(),
    title: 'BULAN',
    author: 'Tere Liye',
    description: 'Novel fiksi petualangan karya Tere Liye menceritakan Raib, Seli, dan Ali yang pergi ke Klan Matahari.',
    category: 'Fiksi',
    year: '2015',
    publisher: 'PT Gramedia Pustaka Utama Jakarta',
    rating: 4.9,
    readers: 1420,
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
    fileUrl: 'https://drive.google.com/file/d/1Asc4x3ydaAE6YLNUiwsVbYHMMjYyk2W_/view?usp=sharing',
    fileName: 'Tere Liye - Bulan.pdf',
    fileType: 'PDF',
    fileSize: '5.4 MB',
    totalPages: 401,
    chapters: chapters,
    sourceName: 'Gramedia / Google Drive',
    sourceUrl: 'https://drive.google.com/file/d/1Asc4x3ydaAE6YLNUiwsVbYHMMjYyk2W_/view?usp=sharing',
    status: 'Published'
  });
}

syncData.lastUpdated = new Date().toISOString();
fs.writeFileSync(syncPath, JSON.stringify(syncData, null, 2));
console.log('Successfully saved to runtime-sync.json!');

