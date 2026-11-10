import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  ExternalLink,
  Globe,
  Link2,
  MessageSquare,
  CheckCircle2,
  Send,
  Download,
  Upload,
  X
} from 'lucide-react';
import { Book, BookChapter, BookReview, initialBooks } from '../lib/mockData';
import { getBookFile } from '../lib/fileStorage';
import { realtime } from '../lib/realtime';
import { ReviewStorage } from '../lib/reviewStorage';

const AdminPdfPageCanvas: React.FC<{
  pdfDoc: any;
  pageNumber: number;
  zoom: number;
}> = ({ pdfDoc, pageNumber, zoom }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    let renderTask: any = null;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current || !containerRef.current) return;
      try {
        setLoading(true);
        const page = await pdfDoc.getPage(pageNumber);
        if (cancel) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const availWidth = Math.max(container.clientWidth - 40, 320);
        const availHeight = Math.max(container.clientHeight - 40, 420);

        const widthScale = availWidth / unscaledViewport.width;
        const heightScale = availHeight / unscaledViewport.height;
        const baseScale = Math.min(widthScale, heightScale);
        const finalScale = Math.max(baseScale * zoom, 0.45);

        const viewport = page.getViewport({ scale: finalScale });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
        if (!cancel) setLoading(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !cancel) {
          console.warn('Admin PDF Render error:', err);
          setLoading(false);
        }
      }
    }

    renderPage();

    return () => {
      cancel = true;
      if (renderTask && renderTask.cancel) {
        try { renderTask.cancel(); } catch {}
      }
    };
  }, [pdfDoc, pageNumber, zoom]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative p-4 select-none overflow-hidden"
    >
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-xs flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8a6d1c]"></div>
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain rounded-lg shadow-xl border border-[#d4c3a3] bg-white transition-transform duration-150"
      />
    </div>
  );
};

const Books = () => {
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('bacayuk_books');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return initialBooks;
    } catch {
      return initialBooks;
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [deleteId, setDeleteId] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  // State Ulasan Buku
  const [allReviews, setAllReviews] = useState<BookReview[]>(() => ReviewStorage.getReviews());
  const [reviewModalBook, setReviewModalBook] = useState<Book | null>(null);
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewerName, setNewReviewerName] = useState<string>('Admin Kurator');
  const [newReviewComment, setNewReviewComment] = useState<string>('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>('');
  
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [readPage, setReadPage] = useState<number>(1);
  const [adminPdfDoc, setAdminPdfDoc] = useState<any>(null);
  const [adminPdfTotalPages, setAdminPdfTotalPages] = useState<number>(0);
  const [adminPdfZoom, setAdminPdfZoom] = useState<number>(1.0);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const refreshReviews = () => {
    try {
      setAllReviews(ReviewStorage.getReviews());
    } catch {}
  };

  useEffect(() => {
    // Pastikan jika belum tersimpan di localStorage, sinkronkan initialBooks
    try {
      const saved = localStorage.getItem('bacayuk_books');
      if (!saved) {
        localStorage.setItem('bacayuk_books', JSON.stringify(initialBooks));
      }
    } catch {}

    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('bacayuk_books');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBooks(parsed);
          } else {
            setBooks(initialBooks);
          }
        } else {
          setBooks(initialBooks);
        }
      } catch {
        setBooks(initialBooks);
      }
    };

    const handleReviewUpdate = () => {
      refreshReviews();
    };

    const unsubscribeRealtime = realtime.subscribe((msg) => {
      if (msg.type.includes('BOOK') || msg.type === 'STATE_SYNCED') {
        handleUpdate();
      }
      if (msg.type.includes('REVIEW') || msg.type === 'STATE_SYNCED') {
        refreshReviews();
      }
    });

    window.addEventListener('bacayuk_books_updated', handleUpdate);
    window.addEventListener('bacayuk_reviews_updated', handleReviewUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('storage', handleReviewUpdate);
    return () => {
      unsubscribeRealtime();
      window.removeEventListener('bacayuk_books_updated', handleUpdate);
      window.removeEventListener('bacayuk_reviews_updated', handleReviewUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('storage', handleReviewUpdate);
    };
  }, []);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalBook || !newReviewComment.trim()) return;

    ReviewStorage.addReview({
      bookId: reviewModalBook.id,
      userName: newReviewerName.trim() || 'Admin Kurator',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      rating: newReviewRating,
      comment: newReviewComment.trim(),
    });

    setNewReviewComment('');
    setReviewSuccessMsg('Ulasan berhasil ditambahkan!');
    setTimeout(() => setReviewSuccessMsg(''), 3000);
    refreshReviews();
  };

  const handleDeleteReview = (reviewId: string) => {
    ReviewStorage.deleteReview(reviewId);
    refreshReviews();
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = () => {
    if (deleteId) {
      const updatedBooks = books.filter(b => b.id !== deleteId);
      setBooks(updatedBooks);
      localStorage.setItem('bacayuk_books', JSON.stringify(updatedBooks));

      // Publikasi ke seluruh tab dan aplikasi siswa
      realtime.publish('BOOKS_UPDATED', {
        action: 'deleted',
        bookId: deleteId,
        books: updatedBooks,
      });

      try {
        fetch('/api/realtime/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ books: updatedBooks }),
        }).catch(() => {});
      } catch {}

      window.dispatchEvent(new Event('bacayuk_books_updated'));
      window.dispatchEvent(new Event('storage'));
      setDeleteId('');
      
      const maxPageAfterDelete = Math.ceil((updatedBooks.length || 1) / itemsPerPage);
      if (currentPage > maxPageAfterDelete) {
        setCurrentPage(maxPageAfterDelete);
      }
    }
  };

  const filteredBooks = (books || []).filter(b => {
    if (!b) return false;
    const title = (b.title || '').toLowerCase();
    const author = (b.author || '').toLowerCase();
    const term = (searchTerm || '').toLowerCase();
    return title.includes(term) || author.includes(term);
  });

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBooks = filteredBooks.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (!readingBook) return;

    let active = true;
    const isPdf = readingBook.fileType === 'PDF' || readingBook.fileName?.toLowerCase().endsWith('.pdf');

    if (!isPdf && !readingBook.fileUrl?.toLowerCase().includes('.pdf')) {
      return;
    }

    async function loadPdf() {
      if (active) setIsLoadingPdf(true);
      try {
        const fileData = await getBookFile(readingBook!.id);
        const pdfSource = fileData || readingBook!.fileUrl;
        if (!pdfSource) {
          if (active) setIsLoadingPdf(false);
          return;
        }

        const pdfjsLib = await import('pdfjs-dist');
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        }

        let loadingTask;
        if (typeof pdfSource === 'object' && 'blob' in pdfSource && pdfSource.blob) {
          const buffer = await (pdfSource.blob as Blob).arrayBuffer();
          loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        } else if (typeof pdfSource === 'object' && 'dataUrl' in pdfSource && pdfSource.dataUrl) {
          loadingTask = pdfjsLib.getDocument(pdfSource.dataUrl);
        } else if (typeof pdfSource === 'string') {
          loadingTask = pdfjsLib.getDocument(pdfSource);
        }

        if (loadingTask) {
          const doc = await loadingTask.promise;
          if (active) {
            setAdminPdfDoc(doc);
            setAdminPdfTotalPages(doc.numPages);
            setIsLoadingPdf(false);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat PDF di admin reader:', err);
        if (active) setIsLoadingPdf(false);
      }
    }

    loadPdf();

    return () => {
      active = false;
      setAdminPdfDoc(null);
      setAdminPdfTotalPages(0);
    };
  }, [readingBook]);

  const textPages = React.useMemo(() => {
    if (!readingBook) return [];
    const chapters: BookChapter[] = readingBook.chapters && readingBook.chapters.length > 0 
      ? readingBook.chapters 
      : [
          {
            id: 'c1',
            title: `1. ${readingBook.title}`,
            content: (readingBook.description || 'Selamat membaca buku digital ini.') + '\n\nBuku ini telah siap di platform BacaYuk. Lembaran demi lembaran membuka cakrawala pengetahuan baru.',
          },
          {
            id: 'c2',
            title: '2. Jejak Langkah',
            content: 'Setiap perjalanan dimulai dengan langkah pertama yang berani. Di balik tantangan yang menghadang, tersimpan tekad kuat yang tak tergoyahkan untuk terus maju menggapai impian.',
          },
          {
            id: 'c3',
            title: '3. Cakrawala Baru',
            content: 'Dunia terbentang luas di hadapan mereka yang gemar membaca dan merenungi ilmu pengetahuan. Buku adalah sahabat setia dalam setiap lika-liku kehidupan.',
          }
        ];

    const pages: { chapterTitle: string; paragraphs: string[] }[] = [];
    chapters.forEach((ch) => {
      const pars = ch.content.split(/\n\s*\n/).filter(p => p.trim());
      for (let i = 0; i < pars.length; i += 2) {
        pages.push({
          chapterTitle: ch.title,
          paragraphs: pars.slice(i, i + 2),
        });
      }
    });

    return pages.length > 0 ? pages : [{ chapterTitle: readingBook.title, paragraphs: [readingBook.description || 'Selamat membaca.'] }];
  }, [readingBook]);

  const totalBookPages = adminPdfDoc ? adminPdfTotalPages : Math.max(textPages.length, 1);

  const handleOpenReader = (book: Book) => {
    setReadingBook(book);
    setReadPage(1);
    setAdminPdfZoom(1.0);
    setSelectedBook(null);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2a160b]">Kelola Buku Digital</h1>
          <p className="text-[#8a6d1c]">Manajemen koleksi buku di platform BacaYuk</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => navigate('/reports?tab=export&type=books')}
            className="flex items-center gap-2 bg-[#ebdcb8] text-[#3a2012] border border-[#d4c3a3] px-3.5 py-2 rounded-lg font-medium hover:bg-[#d4c3a3] transition-colors shadow-sm text-sm"
            title="Ekspor buku pertanggal, perbulan, pertahun ke Excel/CSV"
          >
            <Download className="w-4 h-4 text-[#8a6d1c]" />
            Ekspor Buku
          </button>
          <button 
            onClick={() => navigate('/reports?tab=import&type=books')}
            className="flex items-center gap-2 bg-[#ebdcb8] text-[#3a2012] border border-[#d4c3a3] px-3.5 py-2 rounded-lg font-medium hover:bg-[#d4c3a3] transition-colors shadow-sm text-sm"
            title="Impor katalog buku dari Excel (.xlsx) / CSV"
          >
            <Upload className="w-4 h-4 text-[#8a6d1c]" />
            Impor Excel
          </button>
          <button 
            onClick={() => navigate('/books/add')}
            className="flex items-center gap-2 bg-[#3a2012] text-[#f9f6f0] px-4 py-2 rounded-lg font-medium hover:bg-[#2a160b] transition-colors shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Buku
          </button>
        </div>
      </div>

      <div className="bg-[#f9f6f0] rounded-xl shadow-sm border border-[#d4c3a3] overflow-hidden">
        <div className="p-4 border-b border-[#d4c3a3] flex flex-col md:flex-row gap-4 justify-between bg-[#ebdcb8]/50">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a49373]" />
            <input 
              type="text" 
              placeholder="Cari judul buku atau penulis..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-[#c2b192] rounded-lg text-sm focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f0e6d2] border-b border-[#d4c3a3] text-[#8a6d1c] text-sm">
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
                        {book.fileUrl && (book.fileType === 'LINK' || !book.fileName) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono mt-1 border border-blue-200">
                            <Globe className="w-3 h-3 text-blue-600" /> Tautan Online
                          </span>
                        ) : book.fileName ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-[#ebdcb8] text-[#5a3a22] px-2 py-0.5 rounded font-mono mt-1 border border-[#d4c3a3]">
                            {book.fileType === 'LINK' ? (
                              <Globe className="w-3 h-3 text-[#8a6d1c]" />
                            ) : (
                              <FileText className="w-3 h-3 text-[#8a6d1c]" />
                            )}{' '}
                            {book.fileType || 'PDF'}
                          </span>
                        ) : null}
                        {book.sourceName && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-900 px-2 py-0.5 rounded font-medium mt-1 ml-1.5 border border-amber-200">
                            <Link2 className="w-2.5 h-2.5 text-amber-700" /> Sumber: {book.sourceName}
                          </span>
                        )}
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
                    {(book.readers || 0).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        title="Baca Buku Sekarang"
                        onClick={() => handleOpenReader(book)}
                        className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/70 rounded-lg transition-colors flex items-center gap-1 font-semibold text-xs border border-emerald-300/60 bg-emerald-50"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Baca</span>
                      </button>
                      <button 
                        title="Kelola & Lihat Ulasan Buku"
                        onClick={() => setReviewModalBook(book)}
                        className="p-1.5 text-amber-800 hover:text-amber-900 hover:bg-amber-100/70 rounded-lg transition-colors flex items-center gap-1 font-semibold text-xs border border-amber-300/60 bg-amber-50"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>Ulasan ({allReviews.filter(r => r.bookId === book.id).length})</span>
                      </button>
                      <button 
                        title="Lihat Detail Naskah"
                        onClick={() => setSelectedBook(book)}
                        className="p-1.5 text-[#a49373] hover:text-[#8a6d1c] hover:bg-[#ebdcb8] rounded-lg transition-colors"
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

      {selectedBook && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#ebdcb8] flex items-center justify-between bg-[#ebdcb8]/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3a2012] rounded-full flex items-center justify-center text-[#f9f6f0]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2a160b] leading-tight">Detail Naskah Buku</h3>
                  <p className="text-sm text-[#8a6d1c]">{selectedBook.title}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBook(null)} className="p-2 text-[#a49373] hover:bg-[#e6ddc5] rounded-full transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <img src={selectedBook.coverUrl} alt={selectedBook.title} className="w-32 h-48 object-cover rounded-xl shadow-md border border-[#d4c3a3] shrink-0" />
                <div className="space-y-4 flex-1">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#ebdcb8] text-[#3a2012] border border-[#d4c3a3]">{selectedBook.category}</span>
                    <h4 className="text-2xl font-bold text-[#2a160b] mt-1.5 leading-tight">{selectedBook.title}</h4>
                    <p className="text-[#8a6d1c] font-medium">Penulis: {selectedBook.author}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-[#f0e6d2] p-3 rounded-xl border border-[#ebdcb8]">
                      <p className="text-xs text-[#8a6d1c] mb-1 font-medium">Tahun Terbit</p>
                      <p className="font-bold text-[#2a160b] text-sm">{selectedBook.year}</p>
                    </div>
                    <div className="bg-[#f0e6d2] p-3 rounded-xl border border-[#ebdcb8]">
                      <p className="text-xs text-[#8a6d1c] mb-1 font-medium">Rating</p>
                      <p className="font-bold text-[#2a160b] text-sm flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {selectedBook.rating ?? 5.0}
                      </p>
                    </div>
                    <div className="bg-[#f0e6d2] p-3 rounded-xl border border-[#ebdcb8]">
                      <p className="text-xs text-[#8a6d1c] mb-1 font-medium">Total Pembaca</p>
                      <p className="font-bold text-[#2a160b] text-sm">{(selectedBook.readers || 0).toLocaleString()} orang</p>
                    </div>
                    <div className="bg-[#f0e6d2] p-3 rounded-xl border border-[#ebdcb8]">
                      <p className="text-xs text-[#8a6d1c] mb-1 font-medium">Format Naskah</p>
                      <p className="font-bold text-[#2a160b] text-sm uppercase">{selectedBook.fileType || 'Buku Digital'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-[#ebdcb8] pt-6">
                <h5 className="font-bold text-[#2a160b] mb-3">Sinopsis / Deskripsi</h5>
                <p className="text-[#5a3a22] text-sm leading-relaxed">
                  {selectedBook.description || 'Sinopsis naskah buku digital platform BacaYuk.'}
                </p>
              </div>

              {/* Sumber Asal Naskah & Tautan Sumber */}
              {(selectedBook.sourceName || selectedBook.sourceUrl) && (
                <div className="border-t border-[#ebdcb8] pt-6">
                  <div className="bg-[#f0e6d2] p-4 rounded-xl border border-[#ebdcb8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#ebdcb8] text-[#8a6d1c] flex items-center justify-center border border-[#d4c3a3] shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] text-[#8a6d1c] font-semibold">Sumber / Asal Naskah Buku</p>
                        <p className="text-sm font-bold text-[#2a160b]">{selectedBook.sourceName || 'Tautan Sumber Daring'}</p>
                      </div>
                    </div>
                    {selectedBook.sourceUrl && (
                      <a
                        href={selectedBook.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-white text-[#8a6d1c] border border-[#c2b192] rounded-lg text-xs font-bold hover:bg-[#ebdcb8] transition-colors flex items-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Kunjungi Link Sumber
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Ulasan Buku di Detail Modal */}
              <div className="border-t border-[#ebdcb8] pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-[#2a160b] flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    Ulasan Pembaca & Kurator ({allReviews.filter(r => r.bookId === selectedBook.id).length})
                  </h5>
                  <button
                    onClick={() => {
                      const target = selectedBook;
                      setSelectedBook(null);
                      setReviewModalBook(target);
                    }}
                    className="text-xs font-semibold text-[#8a6d1c] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    + Tulis / Kelola Ulasan
                  </button>
                </div>
                {allReviews.filter(r => r.bookId === selectedBook.id).length === 0 ? (
                  <p className="text-xs text-[#8a6d1c] italic bg-[#f0e6d2] p-3 rounded-xl border border-[#ebdcb8]">
                    Belum ada ulasan untuk buku ini. Anda dapat menambahkan ulasan atau kurasi pertama.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {allReviews.filter(r => r.bookId === selectedBook.id).map(rev => (
                      <div key={rev.id} className="p-3 bg-[#f0e6d2] rounded-xl border border-[#ebdcb8] text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#2a160b]">{rev.userName}</span>
                          <span className="flex items-center text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                            {rev.rating}.0
                          </span>
                        </div>
                        <p className="text-[#5a3a22] leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-[#ebdcb8] bg-[#f0e6d2] flex justify-end gap-3 flex-wrap">
              {selectedBook.fileUrl && (
                <a 
                  href={selectedBook.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 font-medium hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" /> Buka Naskah Asli
                </a>
              )}
              {selectedBook.sourceUrl && (
                <a 
                  href={selectedBook.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-amber-50 text-amber-900 border border-amber-300 font-medium hover:bg-amber-100 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Globe className="w-4 h-4 text-amber-700" /> Sumber: {selectedBook.sourceName || 'Web'}
                </a>
              )}
              <button 
                onClick={() => {
                  const target = selectedBook;
                  setSelectedBook(null);
                  setReviewModalBook(target);
                }} 
                className="px-4 py-2.5 bg-amber-50 text-amber-800 border border-amber-200 font-medium hover:bg-amber-100 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Kelola Ulasan
              </button>
              <button 
                onClick={() => handleOpenReader(selectedBook)} 
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

      {/* Modal Kelola Ulasan Buku */}
      {reviewModalBook && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#f9f6f0] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#d4c3a3]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#ebdcb8] flex items-center justify-between bg-[#ebdcb8]/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 border border-amber-300">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2a160b] leading-tight">Ulasan & Rating Buku</h3>
                  <p className="text-xs text-[#8a6d1c] line-clamp-1">{reviewModalBook.title}</p>
                </div>
              </div>
              <button 
                onClick={() => setReviewModalBook(null)} 
                className="p-2 text-[#a49373] hover:bg-[#e6ddc5] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {reviewSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {reviewSuccessMsg}
                </div>
              )}

              {/* Form Tambah Ulasan Baru */}
              <div className="bg-[#f0e6d2] p-4 rounded-xl border border-[#ebdcb8]">
                <h4 className="text-sm font-bold text-[#2a160b] mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#8a6d1c]" />
                  Tulis Ulasan / Rekomendasi Kurator
                </h4>
                <form onSubmit={handleAddReview} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 p-3 rounded-lg border border-[#d4c3a3]/50">
                    <div>
                      <span className="text-xs text-[#8a6d1c] font-medium block">Rating Bintang:</span>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewReviewRating(star)}
                            className="p-1 text-amber-400 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= newReviewRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-[#3a2012] ml-2">
                          {newReviewRating}.0 / 5.0
                        </span>
                      </div>
                    </div>

                    <div className="sm:w-1/2">
                      <label className="text-xs text-[#8a6d1c] font-medium block mb-1">Nama Pengulas:</label>
                      <input
                        type="text"
                        value={newReviewerName}
                        onChange={(e) => setNewReviewerName(e.target.value)}
                        placeholder="Contoh: Kurator Perpustakaan"
                        className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-[#c2b192] text-[#3a2012] focus:outline-hidden focus:border-[#8a6d1c]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#8a6d1c] font-medium block mb-1">Ulasan / Komentar:</label>
                    <textarea
                      rows={3}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Tulis ulasan, ringkasan apresiasi, atau rekomendasi buku ini..."
                      className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-[#c2b192] text-[#3a2012] focus:outline-hidden focus:border-[#8a6d1c]"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#3a2012] text-[#f9f6f0] text-xs font-bold rounded-lg hover:bg-[#2a160b] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Kirim Ulasan
                    </button>
                  </div>
                </form>
              </div>

              {/* Daftar Semua Ulasan untuk Buku Ini */}
              <div>
                <h4 className="text-sm font-bold text-[#2a160b] mb-3">
                  Daftar Ulasan Masuk ({allReviews.filter(r => r.bookId === reviewModalBook.id).length})
                </h4>
                {allReviews.filter(r => r.bookId === reviewModalBook.id).length === 0 ? (
                  <div className="text-center py-8 bg-[#f0e6d2]/50 rounded-xl border border-dashed border-[#c2b192]">
                    <MessageSquare className="w-8 h-8 text-[#8a6d1c]/40 mx-auto mb-2" />
                    <p className="text-xs text-[#8a6d1c] font-medium">Belum ada ulasan untuk buku ini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allReviews
                      .filter(r => r.bookId === reviewModalBook.id)
                      .map((rev) => (
                        <div
                          key={rev.id}
                          className="p-4 bg-white rounded-xl border border-[#ebdcb8] shadow-xs flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#ebdcb8] text-[#3a2012] font-bold text-xs flex items-center justify-center shrink-0">
                              {(rev.userName || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#2a160b]">{rev.userName}</span>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < rev.rating
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-[#5a3a22] mt-1 leading-relaxed">{rev.comment}</p>
                              {rev.createdAt && (
                                <span className="text-[10px] text-[#8a6d1c] mt-1 block">
                                  {new Date(rev.createdAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            title="Hapus Ulasan Ini"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#ebdcb8] bg-[#f0e6d2] flex justify-end">
              <button
                onClick={() => setReviewModalBook(null)}
                className="px-5 py-2.5 bg-[#3a2012] text-[#f9f6f0] text-xs font-bold rounded-xl hover:bg-[#2a160b] transition-colors cursor-pointer shadow-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {readingBook && (
        <div className="fixed inset-0 bg-[#1e1b18] z-50 flex flex-col animate-in fade-in duration-200">
          <div className="h-14 bg-[#f9f6f0] border-b border-[#d4c3a3] flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setReadingBook(null)}
                className="p-2 -ml-2 text-[#8a6d1c] hover:bg-[#e6ddc5] rounded-full transition-colors"
                title="Tutup Pembaca"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <div>
                <h3 className="font-bold text-[#2a160b] text-base leading-none">{readingBook.title}</h3>
                <p className="text-xs text-[#8a6d1c] mt-0.5">{readingBook.author}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {adminPdfDoc && (
                <div className="flex items-center border border-[#d4c3a3] rounded-lg bg-white overflow-hidden text-xs">
                  <button 
                    onClick={() => setAdminPdfZoom(z => Math.max(0.6, z - 0.15))}
                    className="p-1.5 hover:bg-[#ebdcb8] text-[#5a3a22]"
                    title="Perkecil"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-bold text-[#3a2012]">{Math.round(adminPdfZoom * 100)}%</span>
                  <button 
                    onClick={() => setAdminPdfZoom(z => Math.min(2.0, z + 0.15))}
                    className="p-1.5 hover:bg-[#ebdcb8] text-[#5a3a22]"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setAdminPdfZoom(1.0)}
                    className="p-1.5 hover:bg-[#ebdcb8] text-[#5a3a22] border-l border-[#d4c3a3]"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {!adminPdfDoc && (
                <div className="flex items-center gap-1 bg-[#ebdcb8] px-2 py-1 rounded-lg text-xs font-bold text-[#3a2012]">
                  <button onClick={() => setFontSizeOffset(o => Math.max(-4, o - 2))} className="px-1.5 py-0.5 hover:bg-[#d4c3a3] rounded">A-</button>
                  <span>Aa</span>
                  <button onClick={() => setFontSizeOffset(o => Math.min(6, o + 2))} className="px-1.5 py-0.5 hover:bg-[#d4c3a3] rounded">A+</button>
                </div>
              )}

              <button 
                onClick={() => setReadingBook(null)} 
                className="px-4 py-1.5 bg-[#3a2012] text-[#f9f6f0] text-xs font-bold rounded-lg hover:bg-[#2a160b] transition-colors shadow-sm"
              >
                Selesai
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-[#25211d] flex items-center justify-center p-3 md:p-6 relative overflow-hidden select-none">
            <button
              onClick={() => setReadPage(p => Math.max(1, p - 1))}
              disabled={readPage === 1}
              className={`absolute left-4 md:left-8 z-20 w-11 h-11 rounded-full bg-[#f9f6f0] border border-[#d4c3a3] shadow-lg flex items-center justify-center text-[#3a2012] transition-opacity ${
                readPage === 1 ? 'opacity-25 cursor-not-allowed' : 'opacity-90 hover:opacity-100 hover:scale-105'
              }`}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="w-full max-w-prose sm:max-w-2xl mx-auto h-full max-h-[86vh] bg-[#FAF7F2] rounded-2xl shadow-2xl border border-[#d4c3a3] flex flex-col justify-between p-5 sm:p-8 relative overflow-hidden transition-all">
              <div className="flex justify-between items-center pb-3 border-b border-[#ded5c4] text-xs text-[#8a7056] font-medium shrink-0">
                <span className="italic truncate max-w-[45%] font-serif">{readingBook.title}</span>
                <span className="font-semibold truncate max-w-[45%] tracking-wide uppercase text-[11px] text-[#8a6d1c]">
                  {adminPdfDoc ? 'Dokumen PDF Asli' : textPages[readPage - 1]?.chapterTitle || 'Bab 1'}
                </span>
              </div>

              <div className="flex-1 w-full overflow-y-auto py-4 sm:py-6 px-1 sm:px-4">
                {adminPdfDoc ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <AdminPdfPageCanvas 
                      pdfDoc={adminPdfDoc}
                      pageNumber={readPage}
                      zoom={adminPdfZoom}
                    />
                  </div>
                ) : isLoadingPdf ? (
                  <div className="text-center space-y-3 py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8a6d1c] mx-auto"></div>
                    <p className="text-xs text-[#8a7056] font-medium">Memuat lembaran naskah...</p>
                  </div>
                ) : (
                  <div className="w-full flex flex-col justify-start text-[#2C241E] font-serif space-y-5 selection:bg-[#E3CE9E] selection:text-[#2C241E]">
                    <div className="text-left border-b border-[#ebdcb8] pb-3 mb-3">
                      <span className="text-[10px] tracking-wider uppercase font-sans font-bold text-[#8a6d1c]">
                        LEMBARAN HALAMAN {readPage}
                      </span>
                      <h3 className="text-xl font-bold text-[#2a160b] font-sans mt-0.5">
                        {textPages[readPage - 1]?.chapterTitle || `Halaman ${readPage}`}
                      </h3>
                    </div>
                    {textPages[readPage - 1]?.paragraphs.map((par, pIdx) => (
                      <p 
                        key={pIdx} 
                        style={{ fontSize: 17 + fontSizeOffset }}
                        className="text-justify leading-relaxed sm:leading-loose indent-6 sm:indent-8 first:indent-0 text-[#2C241E]"
                      >
                        {par}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#ded5c4] text-center text-xs text-[#8a7056] font-serif shrink-0">
                — Halaman {readPage} dari {totalBookPages} —
              </div>
            </div>

            <button
              onClick={() => setReadPage(p => Math.min(totalBookPages, p + 1))}
              disabled={readPage >= totalBookPages}
              className={`absolute right-4 md:right-8 z-20 w-11 h-11 rounded-full bg-[#f9f6f0] border border-[#d4c3a3] shadow-lg flex items-center justify-center text-[#3a2012] transition-opacity ${
                readPage >= totalBookPages ? 'opacity-25 cursor-not-allowed' : 'opacity-90 hover:opacity-100 hover:scale-105'
              }`}
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="h-16 bg-[#f9f6f0] border-t border-[#d4c3a3] flex items-center justify-between px-6 shrink-0 shadow-xs z-20">
            <button
              onClick={() => setReadPage(p => Math.max(1, p - 1))}
              disabled={readPage === 1}
              className={`px-4 py-2 border border-[#c2b192] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                readPage === 1 ? 'opacity-40 cursor-not-allowed text-[#a49373]' : 'text-[#3a2012] bg-[#f9f6f0] hover:bg-[#ebdcb8]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-2 bg-[#FAF6EE] px-4 py-1.5 rounded-full border border-[#d4c3a3] text-xs font-semibold text-[#3a2012]">
              <span>Halaman <strong className="text-[#8a6d1c] font-black">{readPage}</strong> dari {totalBookPages}</span>
              <span className="text-[#8a7056] font-normal">
                ({Math.min(100, Math.round((readPage / (totalBookPages || 1)) * 100))}%)
              </span>
            </div>

            <button
              onClick={() => setReadPage(p => Math.min(totalBookPages, p + 1))}
              disabled={readPage >= totalBookPages}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm ${
                readPage >= totalBookPages 
                  ? 'opacity-40 cursor-not-allowed bg-slate-200 text-[#a49373]' 
                  : 'bg-[#3a2012] text-[#f9f6f0] hover:bg-[#2a160b]'
              }`}
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
