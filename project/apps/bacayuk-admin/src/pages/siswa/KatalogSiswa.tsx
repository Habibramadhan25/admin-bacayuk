import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Bookmark } from 'lucide-react';
import { Book, initialBooks } from '../../lib/mockData';

const KatalogSiswa = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // Coba ambil dari Backend
    fetch('http://localhost:5000/api/books')
      .then(res => {
        if (!res.ok) throw new Error('API down');
        return res.json();
      })
      .then(data => {
        setBooks(data);
      })
      .catch(err => {
        // Fallback ke data lokal jika server backend belum hidup
        const savedBooks = localStorage.getItem('bacayuk_books');
        if (savedBooks) {
          setBooks(JSON.parse(savedBooks).filter((b: Book) => b.status === 'Published'));
        } else {
          setBooks(initialBooks.filter(b => b.status === 'Published'));
        }
      });

    const savedFavorites = localStorage.getItem('bacayuk_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
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
  };

  const categories = ['Semua', 'Novel', 'Pengembangan Diri', 'Sejarah', 'Motivasi', 'Romance', 'Sains'];

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || book.category === selectedCategory || 
                            (selectedCategory === 'Novel' && book.category === 'Fiksi') || 
                            (selectedCategory === 'Pengembangan Diri' && book.category === 'Nonfiksi'); // Mapping dummy to design categories
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black font-serif text-[#2a160b] mb-1">Koleksi Buku</h1>
          <p className="text-[#5a3a22] text-sm">Temukan berbagai buku menarik untuk dibaca.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Cari buku, penulis, atau kategori..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#f4f0e6] border-none rounded-full text-[#2a160b] placeholder-[#a49373] focus:outline-none focus:ring-2 focus:ring-[#d4c3a3] transition-shadow text-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a49373]" />
        </div>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
              selectedCategory === category
                ? 'bg-[#ebdcb8] text-[#2a160b] border-[#ebdcb8] shadow-sm'
                : 'bg-transparent text-[#5a3a22] hover:bg-[#f4f0e6] border-transparent'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Pilihan Minggu Ini */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-serif text-[#2a160b]">
            Pilihan Minggu Ini
          </h2>
          <button className="text-sm font-medium text-[#5a3a22] hover:text-[#2a160b] transition-colors">
            Lihat semua
          </button>
        </div>
        
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filteredBooks.map((book) => (
              <div 
                key={book.id} 
                onClick={() => navigate(`/siswa/buku/${book.id}`)}
                className="group cursor-pointer bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-[#ebdcb8]"
              >
                <div className="relative overflow-hidden rounded-xl mb-3 aspect-[2/3] border border-gray-50">
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold text-[#3a2012] shadow-sm z-10">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {book.rating}
                  </div>
                  {/* Hover Overlay Button Placeholder */}
                  <div className="absolute inset-0 bg-[#2a160b]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                    <div className="bg-white/90 backdrop-blur-sm text-[#2a160b] text-[10px] font-bold py-1.5 px-3 rounded-full flex items-center gap-1 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75 shadow-sm">
                      Baca Sekarang
                    </div>
                  </div>
                </div>
                <div className="px-1">
                  <h3 className="font-bold text-[#2a160b] text-sm leading-tight group-hover:text-[#8a6d1c] transition-colors line-clamp-1">{book.title}</h3>
                  <p className="text-xs text-[#5a3a22] mt-1 mb-2 truncate">{book.author}</p>
                  <span className="text-[10px] font-bold text-[#5a3a22] bg-[#f4f0e6] px-2 py-1 rounded-md uppercase tracking-wider">
                    {book.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Search className="w-12 h-12 text-[#d4c3a3] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#2a160b] mb-2 font-serif">Buku tidak ditemukan</h3>
            <p className="text-[#5a3a22]">Coba ubah kata kunci pencarian atau pilih kategori lain.</p>
          </div>
        )}
      </section>

    </div>
  );
};

export default KatalogSiswa;
