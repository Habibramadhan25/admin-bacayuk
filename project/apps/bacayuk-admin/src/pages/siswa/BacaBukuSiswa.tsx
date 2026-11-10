import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Moon, Sun, Search, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Book, initialBooks } from '../../lib/mockData';

const BacaBukuSiswa = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  
  // Reader Settings State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [showMenu, setShowMenu] = useState(false);
  const [page, setPage] = useState(1);

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
  }, [id]);

  if (!book) return <div className="p-10 text-center">Loading...</div>;

  const totalPages = 15; // Mock total pages

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Content styles based on settings
  const readerBg = isDarkMode ? 'bg-[#121212]' : 'bg-[#F9F7F1]';
  const readerText = isDarkMode ? 'text-gray-300' : 'text-gray-800';
  const navBg = isDarkMode ? 'bg-[#1E1E1E] border-gray-800' : 'bg-[#f9f6f0] border-gray-200';
  const iconColor = isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-[#8a6d1c]';

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col font-serif ${readerBg}`}>
      {/* Top Navbar (Reading Menu) */}
      <div className={`fixed top-0 left-0 right-0 z-50 border-b shadow-sm transition-all duration-300 ${navBg} ${showMenu ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/siswa/buku/${book.id}`)} className={`p-2 rounded-full ${iconColor}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className={`font-sans font-bold truncate max-w-[150px] sm:max-w-xs ${isDarkMode ? 'text-gray-200' : 'text-[#3a2012]'}`}>
              {book.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full ${iconColor}`} title="Toggle Dark Mode">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 hidden sm:flex">
              <button 
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="w-8 h-8 flex items-center justify-center font-sans font-bold text-gray-500 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                A-
              </button>
              <button 
                onClick={() => setFontSize(Math.min(30, fontSize + 2))}
                className="w-8 h-8 flex items-center justify-center font-sans font-bold text-gray-500 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                A+
              </button>
            </div>
            
            <button className={`p-2 rounded-full ${iconColor}`}>
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Invisible overlay to toggle menu when clicking top of screen */}
      <div 
        className="fixed top-0 left-0 right-0 h-24 z-40" 
        onClick={() => setShowMenu(!showMenu)} 
      />

      {/* Main Reading Content */}
      <main 
        className={`flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-20 transition-all duration-300 ${readerText} leading-relaxed`}
        style={{ fontSize: `${fontSize}px` }}
        onClick={() => showMenu && setShowMenu(false)}
      >
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-sans">{book.title}</h2>
          <p className="text-lg opacity-70 italic">
            Bab {page}: {
              ["Awal dari Segalanya", "Pertemuan Tak Terduga", "Bayangan Masa Lalu", "Perjalanan Dimulai", "Sebuah Rahasia", 
               "Kawan atau Lawan?", "Menembus Badai", "Titik Terang", "Pengkhianatan", "Jalan Buntu", 
               "Secercah Harapan", "Pengorbanan", "Pertempuran Akhir", "Matahari Terbit", "Akhir Perjalanan"][page - 1] || "Misteri Berlanjut"
            }
          </p>
        </div>

        <div className="space-y-6 text-justify">
          <p>
            [Halaman {page}] Mentari belum sepenuhnya menampakkan diri, namun desa kecil itu sudah mulai menggeliat. Asap tipis mengepul dari cerobong-cerobong dapur, membawa aroma kayu bakar dan singkong rebus yang khas. Kejadian di hari ke-{page} ini terasa sangat berbeda dari hari-hari sebelumnya.
          </p>
          <p>
            "Tunggu aku di persimpangan itu!" teriaknya memecah keheningan pagi. Sosok yang berjalan di depannya hanya menoleh sekilas lalu mempercepat langkahnya. Di saku bajunya, ia membawa pesan rahasia yang baru saja ditemukan pada bab {page} ini.
          </p>
          <p>
            Buku ini mengajarkan kita bahwa setiap langkah yang kita ambil, sekecil apapun, akan membawa kita menuju suatu tempat. Tidak ada perjalanan yang sia-sia, begitulah petuah lama mengatakan. Terlebih lagi ketika mereka menyadari fakta mengejutkan yang tertulis di halaman {page}.
          </p>
          <p>
            Di tengah perjalanan mereka, langit perlahan berubah warna. Dari ungu kelam, beralih ke jingga kemerahan, hingga akhirnya biru cerah mendominasi cakrawala. Burung-burung mulai bersahutan, seolah menyanyikan melodi tentang rahasia yang terungkap di bagian {page} cerita ini.
          </p>
          <p className="italic opacity-80 mt-10 p-4 border-l-4 border-[#8a6d1c] bg-[#8a6d1c]/10 rounded-r-lg">
            (Kamu sedang berada di Halaman {page}. Teks sengaja dibuat dinamis agar kamu bisa melihat efek pergantian halamannya bekerja dengan baik. Teruskan membaca ke halaman {Math.min(page + 1, 15)} untuk melihat perubahan selanjutnya!)
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className={`sticky bottom-0 left-0 right-0 z-40 border-t ${navBg} px-4 py-3 flex items-center justify-between font-sans`}>
        <button 
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${page === 1 ? 'opacity-50 cursor-not-allowed text-gray-400' : isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <ChevronLeft className="w-5 h-5" /> Sebelumnya
        </button>
        
        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Halaman {page} dari {totalPages}
        </div>
        
        <button 
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${page === totalPages ? 'opacity-50 cursor-not-allowed text-gray-400' : isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          Selanjutnya <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Helper text for desktop */}
      <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 text-xs opacity-50 px-3 py-1 rounded-full ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'} transition-opacity duration-1000 ${showMenu ? 'opacity-0' : 'opacity-50'}`}>
        Klik bagian atas layar untuk memunculkan menu
      </div>
    </div>
  );
};

export default BacaBukuSiswa;
