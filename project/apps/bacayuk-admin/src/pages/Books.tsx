import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  BookOpen
} from 'lucide-react';
import { Book } from '../lib/mockData';

const Books = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [deleteId, setDeleteId] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const totalChapters = 12;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const saved = localStorage.getItem('bacayuk_books');
    if (saved) {
      setBooks(JSON.parse(saved));
    }
  }, []);

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = () => {
    if (deleteId) {
      const updatedBooks = books.filter(b => b.id !== deleteId);
      setBooks(updatedBooks);
      localStorage.setItem('bacayuk_books', JSON.stringify(updatedBooks));
      setDeleteId('');
      
      // Handle pagination empty page bug
      const maxPageAfterDelete = Math.ceil((updatedBooks.length || 1) / itemsPerPage);
      if (currentPage > maxPageAfterDelete) {
        setCurrentPage(maxPageAfterDelete);
      }
    }
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBooks = filteredBooks.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2a160b]">Kelola Buku Digital</h1>
          <p className="text-[#8a6d1c]">Manajemen koleksi buku di platform BacaYuk</p>
        </div>
        <button 
          onClick={() => navigate('/books/add')}
          className="flex items-center gap-2 bg-[#3a2012] text-[#f9f6f0] px-4 py-2 rounded-lg font-medium hover:bg-[#2a160b] transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Tambah Buku
        </button>
      </div>

      <div className="bg-[#f9f6f0] rounded-xl shadow-sm border border-[#d4c3a3] overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-[#d4c3a3] flex flex-col md:flex-row gap-4 justify-between bg-[#ebdcb8]/50">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a49373]" />
            <input 
              type="text" 
              placeholder="Cari judul buku atau penulis..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#c2b192] rounded-lg text-sm focus:border-[#8a6d1c] focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#c2b192] rounded-lg text-sm font-medium text-[#3a2012] bg-[#f9f6f0] hover:bg-[#ebdcb8] transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0e6d2] text-[#8a6d1c] text-sm border-b border-[#d4c3a3]">
                <th className="p-4 font-medium">Buku</th>
                <th className="p-4 font-medium">Kategori</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Rating</th>
                <th className="p-4 font-medium">Pembaca</th>
                <th className="p-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4c3a3] text-sm">
              {currentBooks.map((book) => (
                <tr key={book.id} className="hover:bg-[#ebdcb8]/80 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={book.coverUrl} 
                        alt={book.title} 
                        className="w-16 h-24 object-cover rounded-md shadow-sm border border-[#d4c3a3]"
                      />
                      <div>
                        <h4 className="font-bold text-[#2a160b] group-hover:text-[#8a6d1c] transition-colors">{book.title}</h4>
                        <p className="text-[#8a6d1c] mt-0.5">{book.author} • {book.year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#ebdcb8] text-[#3a2012] border border-[#d4c3a3]">
                      {book.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      book.status === 'Published' ? 'bg-emerald-100/50 text-emerald-800 border-emerald-300' : 'bg-amber-100/50 text-amber-800 border-amber-300'
                    }`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 font-bold text-[#3a2012]">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      {book.rating}
                    </div>
                  </td>
                  <td className="p-4 text-[#5a3a22] font-medium">
                    {book.readers.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        title="Lihat Detail"
                        onClick={() => setSelectedBook(book)}
                        className="p-1.5 text-[#a49373] hover:text-[#8a6d1c] hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        title="Edit Buku"
                        onClick={() => navigate(`/books/edit/${book.id}`)}
                        className="p-1.5 text-[#a49373] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        title="Hapus Buku"
                        onClick={() => confirmDelete(book.id)}
                        className="p-1.5 text-[#a49373] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {currentBooks.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#8a6d1c]">
                    Tidak ada buku yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-[#d4c3a3] flex items-center justify-between text-sm text-[#5a3a22] bg-[#f0e6d2]">
          <div>Menampilkan {filteredBooks.length === 0 ? 0 : startIndex + 1} hingga {Math.min(startIndex + itemsPerPage, filteredBooks.length)} dari {filteredBooks.length} buku</div>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-[#c2b192] rounded-md hover:bg-[#e6ddc5] disabled:opacity-50 disabled:hover:bg-transparent font-medium transition-colors"
            >
              Sebelumnya
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 border rounded-md font-medium transition-colors ${
                  currentPage === page 
                    ? 'bg-[#3a2012] border-primary text-[#f9f6f0] shadow-sm' 
                    : 'border-[#c2b192] hover:bg-[#e6ddc5]'
                }`}
              >
                {page}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-[#c2b192] rounded-md hover:bg-[#e6ddc5] disabled:opacity-50 disabled:hover:bg-transparent font-medium transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#2a160b] mb-2">Hapus Buku?</h3>
              <p className="text-[#8a6d1c] text-sm">Tindakan ini tidak dapat dibatalkan. Buku yang dihapus akan hilang dari sistem secara permanen.</p>
            </div>
            <div className="p-4 border-t border-[#ebdcb8] flex justify-center gap-3 bg-[#f0e6d2]">
              <button onClick={() => setDeleteId('')} className="flex-1 py-2.5 text-[#5a3a22] font-medium hover:bg-[#d4c3a3] rounded-xl transition-colors">Batal</button>
              <button onClick={executeDelete} className="flex-1 py-2.5 bg-red-500 text-[#f9f6f0] font-medium hover:bg-red-600 rounded-xl shadow-sm transition-colors">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Buku Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#ebdcb8] flex items-center justify-between bg-[#f0e6d2] relative">
              <h3 className="text-lg font-bold text-[#2a160b] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#8a6d1c]" />
                Detail Buku
              </h3>
              <button onClick={() => setSelectedBook(null)} className="p-2 text-[#a49373] hover:bg-[#d4c3a3] rounded-full transition-colors absolute right-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-32 h-48 md:w-40 md:h-60 object-cover rounded-xl shadow-md border border-[#d4c3a3] shrink-0" />
                <div className="flex-1">
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#ebdcb8] text-[#3a2012] border border-[#d4c3a3] mb-3">
                    {selectedBook.category}
                  </div>
                  <h4 className="text-2xl font-bold text-[#2a160b] leading-tight mb-2">{selectedBook.title}</h4>
                  <p className="text-lg text-[#5a3a22] mb-4">{selectedBook.author} • {selectedBook.year}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f0e6d2] p-3 rounded-xl border border-[#ebdcb8]">
                      <p className="text-xs text-[#8a6d1c] mb-1 font-medium">Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        selectedBook.status === 'Published' ? 'bg-emerald-100/50 text-emerald-800 border-emerald-300' : 'bg-amber-100/50 text-amber-800 border-amber-300'
                      }`}>
                        {selectedBook.status}
                      </span>
                    </div>
                    <div className="bg-[#f0e6d2] p-3 rounded-xl border border-[#ebdcb8]">
                      <p className="text-xs text-[#8a6d1c] mb-1 font-medium">Rating</p>
                      <div className="flex items-center gap-1 font-bold text-[#2a160b] text-sm">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        {selectedBook.rating}
                      </div>
                    </div>
                    <div className="bg-[#f0e6d2] p-3 rounded-xl border border-[#ebdcb8]">
                      <p className="text-xs text-[#8a6d1c] mb-1 font-medium">Pembaca</p>
                      <p className="font-bold text-[#2a160b] text-sm">{selectedBook.readers.toLocaleString()} orang</p>
                    </div>
                    <div className="bg-[#f0e6d2] p-3 rounded-xl border border-[#ebdcb8]">
                      <p className="text-xs text-[#8a6d1c] mb-1 font-medium">Halaman</p>
                      <p className="font-bold text-[#2a160b] text-sm">~350 hal</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-[#ebdcb8] pt-6">
                <h5 className="font-bold text-[#2a160b] mb-3">Sinopsis / Deskripsi</h5>
                <p className="text-[#5a3a22] text-sm leading-relaxed">
                  Buku ini adalah salah satu karya terbaik dari {selectedBook.author} yang diterbitkan pada tahun {selectedBook.year}. Membahas berbagai topik menarik di dalam genre {selectedBook.category}, buku ini telah berhasil menarik perhatian {selectedBook.readers.toLocaleString()} pembaca di platform BacaYuk dan mendapatkan rating yang sangat baik ({selectedBook.rating}/5.0).
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#ebdcb8] bg-[#f0e6d2] flex justify-end gap-3">
              <button 
                onClick={() => {
                  setReadingBook(selectedBook);
                  setCurrentChapter(1);
                  setSelectedBook(null);
                }} 
                className="px-5 py-2.5 bg-emerald-600 text-[#f9f6f0] font-medium hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
              >
                <BookOpen className="w-4 h-4" /> Baca Buku
              </button>
              <button onClick={() => navigate(`/books/edit/${selectedBook.id}`)} className="px-5 py-2.5 bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 rounded-xl transition-colors">Edit Buku</button>
              <button onClick={() => setSelectedBook(null)} className="px-5 py-2.5 bg-[#2a160b] text-[#f9f6f0] font-medium hover:bg-slate-800 rounded-xl transition-colors">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Modal */}
      {readingBook && (
        <div className="fixed inset-0 bg-[#2a160b] z-50 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="h-16 bg-[#f9f6f0] border-b border-[#d4c3a3] flex items-center justify-between px-6 shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setReadingBook(null)}
                className="p-2 -ml-2 text-[#8a6d1c] hover:bg-[#e6ddc5] rounded-full transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <div>
                <h3 className="font-bold text-[#2a160b] text-lg leading-none">{readingBook.title}</h3>
                <p className="text-sm text-[#8a6d1c] mt-1">{readingBook.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-sm text-[#8a6d1c] mr-4">
                <span>Bab {currentChapter} dari {totalChapters}</span>
                <div className="w-32 h-2 bg-[#d4c3a3] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#3a2012] rounded-full transition-all duration-500" 
                    style={{ width: `${(currentChapter / totalChapters) * 100}%` }}
                  ></div>
                </div>
              </div>
              <button className="px-4 py-2 bg-[#ebdcb8] hover:bg-[#d4c3a3] text-[#3a2012] text-sm font-medium rounded-lg transition-colors">
                Aa
              </button>
              <button onClick={() => setReadingBook(null)} className="px-4 py-2 bg-[#3a2012] text-[#f9f6f0] text-sm font-medium rounded-lg hover:bg-[#2a160b] transition-colors shadow-sm">
                Selesai Membaca
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-[#fdfcf8] overflow-y-auto px-4 py-12 md:py-16 overflow-x-hidden">
            <div key={currentChapter} className={`max-w-2xl mx-auto ${isTransitioning ? 'opacity-0 translate-x-8' : 'animate-in fade-in slide-in-from-right-8 duration-500'}`}>
              <div className="space-y-8 text-[#3a2012] text-lg leading-relaxed font-serif">
                <h1 className="text-4xl font-bold text-center mb-12 text-[#2a160b] font-sans">
                  {currentChapter === 1 ? 'Bab 1: Awal Mula' : `Bab ${currentChapter}: Perjalanan Berlanjut`}
                </h1>
                
                {currentChapter === 1 ? (
                  <>
                    <p>Angin berhembus perlahan menyibak dedaunan yang mulai menguning di musim gugur ini. Dari kejauhan, sayup-sayup terdengar suara burung gereja yang saling bersahutan. Ini adalah hari di mana segalanya dimulai.</p>
                    <p>Karakter utama kita, dalam buku <strong>{readingBook.title}</strong> karya <em>{readingBook.author}</em>, sedang berdiri mematung menatap langit jingga di ufuk barat. Ada banyak hal yang berkecamuk di dalam pikirannya. Terlalu banyak memori yang memaksanya untuk kembali ke masa lalu.</p>
                    <p>"Apakah ini jalan yang benar?" tanyanya dalam hati. Pertanyaan yang tak pernah menemukan jawaban pasti. Tapi ia tahu, satu-satunya cara untuk mengetahui jawabannya adalah dengan melangkah maju, menembus batas ketakutannya sendiri.</p>
                  </>
                ) : (
                  <>
                    <p>Setelah melewati berbagai rintangan di bab sebelumnya, perjalanan di buku <strong>{readingBook.title}</strong> semakin menegangkan. Setiap langkah yang diambil membawa konsekuensi baru yang tak pernah terbayangkan.</p>
                    <p>Langit malam semakin pekat, namun semangat yang ada di dalam dada tak kunjung padam. Ia menyadari bahwa pencarian ini bukan hanya tentang masa lalu, tetapi tentang membangun masa depan yang lebih baik.</p>
                    <p>"Aku tidak akan menyerah sekarang," gumamnya dengan penuh keyakinan. Pandangannya lurus ke depan, menembus kegelapan malam yang perlahan mulai memudar tergantikan oleh fajar.</p>
                  </>
                )}

                <div className="flex justify-center py-12">
                  <span className="w-2 h-2 rounded-full bg-slate-300 mx-1"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300 mx-1"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300 mx-1"></span>
                </div>
                
                <p>Malam pun tiba, menyelimuti kota dengan keheningannya. Di bawah cahaya lampu jalan yang remang-remang, ia terus melangkah. Langkahnya kini terasa lebih ringan. Beban yang selama ini mengganjal perlahan sirna seiring keyakinan yang mulai tumbuh.</p>
                <p>Inilah awal dari sebuah perjalanan panjang. Sebuah kisah tentang keberanian, pengorbanan, dan pencarian jati diri yang tak akan pernah dilupakan oleh siapa pun yang membacanya.</p>
              </div>
              
              <div className="mt-20 pt-10 border-t border-[#d4c3a3] flex justify-between items-center pb-20 font-sans">
                <button 
                  onClick={() => {
                    if (currentChapter > 1) {
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setCurrentChapter(prev => prev - 1);
                        setIsTransitioning(false);
                      }, 150);
                    }
                  }}
                  disabled={currentChapter === 1}
                  className={`px-6 py-3 border border-[#c2b192] font-medium rounded-xl transition-colors ${currentChapter === 1 ? 'text-[#a49373] cursor-not-allowed' : 'text-[#3a2012] hover:bg-[#ebdcb8] bg-[#f9f6f0] shadow-sm'}`}
                >
                  Bab Sebelumnya
                </button>
                <button 
                  onClick={() => {
                    if (currentChapter < totalChapters) {
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setCurrentChapter(prev => prev + 1);
                        setIsTransitioning(false);
                      }, 150);
                    }
                  }}
                  disabled={currentChapter === totalChapters}
                  className={`px-6 py-3 font-medium rounded-xl transition-colors shadow-sm ${currentChapter === totalChapters ? 'border border-[#c2b192] text-[#a49373] cursor-not-allowed' : 'bg-[#3a2012] text-[#f9f6f0] hover:bg-[#2a160b]'}`}
                >
                  Bab Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
