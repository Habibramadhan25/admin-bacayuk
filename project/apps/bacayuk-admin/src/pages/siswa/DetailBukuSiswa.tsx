import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Star, Bookmark, ArrowLeft, Clock, Info, MessageSquare } from 'lucide-react';
import { Book, initialBooks } from '../../lib/mockData';

const DetailBukuSiswa = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Load book data
    const savedBooks = localStorage.getItem('bacayuk_books');
    let allBooks = initialBooks;
    if (savedBooks) {
      allBooks = JSON.parse(savedBooks);
    }
    
    const foundBook = allBooks.find(b => b.id === id);
    if (foundBook) {
      setBook(foundBook);
    }

    // Check favorite status
    const savedFavorites = localStorage.getItem('bacayuk_favorites');
    if (savedFavorites && foundBook) {
      const favIds = JSON.parse(savedFavorites);
      setIsFavorite(favIds.includes(foundBook.id));
    }
  }, [id]);

  const toggleFavorite = () => {
    if (!book) return;
    
    const savedFavorites = localStorage.getItem('bacayuk_favorites');
    let favorites: string[] = savedFavorites ? JSON.parse(savedFavorites) : [];
    
    if (isFavorite) {
      favorites = favorites.filter(favId => favId !== book.id);
    } else {
      favorites.push(book.id);
    }
    
    localStorage.setItem('bacayuk_favorites', JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-[#3a2012] mb-2">Buku tidak ditemukan</h2>
        <button onClick={() => navigate(-1)} className="text-[#8a6d1c] font-bold hover:underline">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#8a6d1c] hover:text-[#8a6d1c] transition-colors font-bold"
      >
        <ArrowLeft className="w-5 h-5" /> Kembali
      </button>

      <div className="bg-[#f9f6f0] rounded-3xl p-6 sm:p-10 shadow-sm border border-[#ebdcb8] relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-[#ebdcb8] rounded-full blur-3xl opacity-60"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-12 items-center md:items-start">
          <div className="w-48 sm:w-64 shrink-0 relative group">
            <img 
              src={book.coverUrl} 
              alt={book.title} 
              className="w-full h-auto aspect-[2/3] object-cover rounded-2xl shadow-xl shadow-slate-200"
            />
            <button 
              onClick={toggleFavorite}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#a49373] hover:text-[#8a6d1c] hover:bg-white shadow-md transition-all z-10"
            >
              <Bookmark className={`w-5 h-5 ${isFavorite ? 'fill-[#8a6d1c] text-[#8a6d1c]' : ''}`} />
            </button>
          </div>

          <div className="flex-1 space-y-6 w-full text-center md:text-left">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-[#ebdcb8] text-[#8a6d1c] text-xs font-bold mb-4 uppercase tracking-wider">
                {book.category}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2a160b] mb-2 leading-tight">
                {book.title}
              </h1>
              <p className="text-lg text-[#8a6d1c] font-medium">Oleh <span className="text-[#8a6d1c]">{book.author}</span></p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 bg-[#f0e6d2] px-4 py-2 rounded-xl">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-[#2a160b]">{book.rating} <span className="text-[#a49373] font-normal text-sm">/ 5</span></span>
              </div>
              <div className="flex items-center gap-2 bg-[#f0e6d2] px-4 py-2 rounded-xl">
                <BookOpen className="w-5 h-5 text-[#8a6d1c]" />
                <span className="font-bold text-[#2a160b]">320 <span className="text-[#a49373] font-normal text-sm">Halaman</span></span>
              </div>
              <div className="flex items-center gap-2 bg-[#f0e6d2] px-4 py-2 rounded-xl">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-[#2a160b]">Tersedia</span>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <h3 className="text-lg font-bold text-[#2a160b] flex items-center gap-2 justify-center md:justify-start">
                <Info className="w-5 h-5 text-[#a49373]" /> Sinopsis
              </h3>
              <p className="text-[#5a3a22] leading-relaxed">
                Buku "{book.title}" adalah sebuah karya luar biasa dari {book.author}. Buku ini membawa pembaca ke dalam sebuah petualangan mendalam yang mengeksplorasi tema-tema tentang kehidupan, cinta, dan tantangan. Dengan gaya bahasa yang mengalir dan karakter yang kuat, karya ini telah menjadi bacaan wajib bagi para pecinta buku {book.category}.
                <br/><br/>
                *(Ini adalah sinopsis otomatis karena data asli sinopsis belum tersedia di sistem. Namun, kamu sudah bisa mulai membaca buku ini sekarang juga!)*
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <a 
                href={`/books/${book.id}.pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-8 py-4 bg-[#3a2012] text-[#f9f6f0] font-bold rounded-xl hover:bg-[#2a160b] transition-colors shadow-lg shadow-[#3a2012]/30 flex items-center justify-center gap-2 text-lg hover:-translate-y-1 active:translate-y-0"
              >
                <BookOpen className="w-6 h-6" /> Baca / Unduh PDF
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-[#f9f6f0] rounded-3xl p-6 sm:p-10 shadow-sm border border-[#ebdcb8] mt-8">
        <h3 className="text-xl font-bold text-[#2a160b] mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#8a6d1c]" /> Ulasan Pembaca
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: 'Siti Nurhaliza', avatar: 'SN', rating: 5, text: 'Buku yang sangat menginspirasi! Saya tidak bisa berhenti membacanya sampai halaman terakhir.', time: '2 hari lalu' },
            { name: 'Budi Santoso', avatar: 'BS', rating: 4, text: 'Bagus untuk mengisi waktu luang. Bahasanya mudah dipahami walaupun ceritanya lumayan berat.', time: '1 minggu lalu' },
          ].map((review, i) => (
            <div key={i} className="bg-[#f0e6d2] p-5 rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#d4c3a3] text-[#8a6d1c] font-bold rounded-full flex items-center justify-center">
                    {review.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-[#2a160b] text-sm">{review.name}</p>
                    <p className="text-xs text-[#a49373]">{review.time}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`w-3.5 h-3.5 ${j < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-[#ebdcb8]'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-[#5a3a22] italic">"{review.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailBukuSiswa;
