import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Star, Bookmark, HeartCrack } from 'lucide-react';
import { Book, initialBooks } from '../../lib/mockData';

const FavoritSiswa = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load all books
    const savedBooks = localStorage.getItem('bacayuk_books');
    let allBooks: Book[] = [];
    if (savedBooks) {
      allBooks = JSON.parse(savedBooks).filter((b: Book) => b.status === 'Published');
    } else {
      allBooks = initialBooks.filter(b => b.status === 'Published');
    }
    
    // Load favorites
    const savedFavorites = localStorage.getItem('bacayuk_favorites');
    if (savedFavorites) {
      const favIds = JSON.parse(savedFavorites);
      setFavorites(favIds);
      setBooks(allBooks.filter(b => favIds.includes(b.id)));
    } else {
      setBooks([]);
    }
  }, []);

  const toggleFavorite = (bookId: string) => {
    let newFavorites;
    if (favorites.includes(bookId)) {
      newFavorites = favorites.filter(id => id !== bookId);
    } else {
      newFavorites = [...favorites, bookId];
    }
    setFavorites(newFavorites);
    localStorage.setItem('bacayuk_favorites', JSON.stringify(newFavorites));
    
    // Remove from current view
    setBooks(prev => prev.filter(b => b.id !== bookId));
  };

  const filteredBooks = books.filter(book => {
    return book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           book.author.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2a160b]">Buku Favorit</h1>
          <p className="text-[#8a6d1c] text-sm mt-1">Daftar buku yang telah kamu simpan untuk dibaca nanti.</p>
        </div>
      </div>

      {books.length > 0 && (
        <div className="bg-[#f9f6f0] p-4 rounded-2xl shadow-sm border border-[#d4c3a3]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#a49373]">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 border border-[#d4c3a3] rounded-xl bg-[#f0e6d2] focus:bg-white focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-all"
              placeholder="Cari buku favoritmu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Books Grid */}
      {books.length === 0 ? (
        <div className="bg-[#f9f6f0] rounded-2xl p-16 border border-[#d4c3a3] text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-[#ebdcb8] text-[#c2b192] rounded-full flex items-center justify-center mb-6">
            <HeartCrack className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-[#2a160b] mb-2">Belum Ada Favorit</h3>
          <p className="text-[#8a6d1c] max-w-sm mb-6">Kamu belum menambahkan buku apapun ke daftar favoritmu. Jelajahi katalog untuk menemukan buku menarik!</p>
          <a href="/siswa/katalog" className="px-6 py-3 bg-[#3a2012] text-[#f9f6f0] font-bold rounded-xl hover:bg-[#2a160b] transition-colors shadow-md shadow-[#3a2012]/30">
            Jelajahi Katalog
          </a>
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredBooks.map((book) => (
            <div 
              key={book.id} 
              onClick={() => navigate(`/siswa/buku/${book.id}`)}
              className="bg-[#f9f6f0] rounded-2xl p-4 shadow-sm border border-[#ebdcb8] hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden flex flex-col h-full"
            >
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(book.id); }}
                  className="w-8 h-8 bg-[#3a2012] rounded-full flex items-center justify-center text-[#f9f6f0] shadow-md hover:bg-red-500 transition-colors"
                  title="Hapus dari favorit"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>
              
              <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-xl">
                <img 
                  src={book.coverUrl} 
                  alt={book.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <button className="w-full py-2 bg-[#3a2012] text-[#f9f6f0] rounded-lg text-sm font-medium hover:bg-[#2a160b] transition-colors flex items-center justify-center gap-2">
                    <BookOpen className="w-4 h-4" /> Baca Sekarang
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-1 text-xs font-medium text-[#8a6d1c] mb-2">
                  <Star className="w-3.5 h-3.5 fill-[#8a6d1c]" />
                  <span>{book.rating}</span>
                </div>
                <h3 className="font-bold text-[#2a160b] line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">
                  {book.title}
                </h3>
                <p className="text-sm text-[#8a6d1c] line-clamp-1 mt-auto">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#f9f6f0] rounded-2xl p-12 border border-[#d4c3a3] text-center">
          <div className="w-16 h-16 bg-[#ebdcb8] text-[#a49373] rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#2a160b] mb-2">Buku tidak ditemukan</h3>
          <p className="text-[#8a6d1c]">Buku tersebut mungkin tidak ada di daftar favoritmu.</p>
        </div>
      )}
    </div>
  );
};

export default FavoritSiswa;
