import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, Save, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Book } from '../lib/mockData';

const AddBook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    author: '',
    description: '',
    category: 'Fiksi',
    year: new Date().getFullYear(),
    publisher: '',
    isbn: '',
    status: 'Draft',
    coverUrl: '',
  });

  useEffect(() => {
    if (isEditing) {
      const books: Book[] = JSON.parse(localStorage.getItem('bacayuk_books') || '[]');
      const book = books.find(b => b.id === id);
      if (book) {
        setFormData(book);
      }
    }
  }, [id, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent, status: 'Published' | 'Draft') => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const books: Book[] = JSON.parse(localStorage.getItem('bacayuk_books') || '[]');
      
      if (isEditing) {
        const updatedBooks = books.map(b => b.id === id ? { ...b, ...formData, status } as Book : b);
        localStorage.setItem('bacayuk_books', JSON.stringify(updatedBooks));
        setToastMessage('Data buku berhasil diperbarui.');
      } else {
        const newBook: Book = {
          ...formData,
          id: Date.now().toString(),
          rating: 0,
          readers: 0,
          dateAdded: new Date().toISOString().split('T')[0],
          status,
        } as Book;
        localStorage.setItem('bacayuk_books', JSON.stringify([newBook, ...books]));
        setToastMessage('Buku baru berhasil ditambahkan.');
      }
      
      setLoading(false);
      setShowToast(true);
      setTimeout(() => {
        navigate('/books');
      }, 1500);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/books')}
          className="p-2 hover:bg-[#d4c3a3] rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-[#5a3a22]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#2a160b]">{isEditing ? 'Edit Buku' : 'Tambah Buku Baru'}</h1>
          <p className="text-[#8a6d1c]">{isEditing ? 'Ubah informasi buku digital' : 'Masukkan informasi buku digital baru ke platform'}</p>
        </div>
      </div>

      <form className="bg-[#f9f6f0] rounded-xl shadow-sm border border-[#d4c3a3] p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cover & File Upload */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#3a2012] mb-2">Cover Buku</label>
              <div className="flex justify-center">
                <div className="w-40 h-56 border-2 border-dashed border-[#c2b192] rounded-xl p-2 text-center hover:bg-[#ebdcb8] transition-colors cursor-pointer group flex flex-col items-center justify-center relative overflow-hidden bg-[#ebdcb8]/50">
                  {formData.coverUrl ? (
                    <>
                      <img src={formData.coverUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg backdrop-blur-sm">
                        <span className="text-[#f9f6f0] font-medium text-sm">Ganti Cover</span>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, coverUrl: '' }));
                          }}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-[#f9f6f0] text-xs rounded-md font-medium transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-[#a49373] mb-2 group-hover:text-[#8a6d1c] transition-colors" />
                      <p className="text-xs font-medium text-[#5a3a22] px-2">Klik atau drag</p>
                      <p className="text-[10px] text-[#a49373] mt-1">Max 2MB</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setFormData(prev => ({ ...prev, coverUrl: ev.target?.result as string }));
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3a2012] mb-2">File Buku Digital (PDF/EPUB)</label>
              <div className="border border-[#c2b192] rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#3a2012] truncate">Pilih file...</p>
                  <p className="text-xs text-[#a49373]">Max 50MB</p>
                </div>
                <input type="file" accept=".pdf,.epub" className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="px-3 py-1.5 bg-[#ebdcb8] hover:bg-[#d4c3a3] text-sm font-medium rounded-md cursor-pointer transition-colors">
                  Browse
                </label>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="col-span-1 lg:col-span-2 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#3a2012] mb-1">Judul Buku *</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors"
                  placeholder="Contoh: Laskar Pelangi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3a2012] mb-1">Penulis *</label>
                <input 
                  type="text" 
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors"
                  placeholder="Contoh: Andrea Hirata"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3a2012] mb-1">Deskripsi / Sinopsis</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors"
                placeholder="Tuliskan sinopsis singkat buku ini..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#3a2012] mb-1">Kategori</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors bg-[#f9f6f0]"
                >
                  <option>Fiksi</option>
                  <option>Nonfiksi</option>
                  <option>Pendidikan</option>
                  <option>Teknologi</option>
                  <option>Sejarah</option>
                  <option>Agama</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3a2012] mb-1">Tahun Terbit</label>
                <input 
                  type="number" 
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors"
                  placeholder="Contoh: 2024"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-[#3a2012] mb-1">Penerbit</label>
                <input 
                  type="text" 
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors"
                  placeholder="Nama Penerbit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3a2012] mb-1">ISBN</label>
                <input 
                  type="text" 
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#c2b192] rounded-lg focus:ring-2 focus:ring-[#8a6d1c]/20 focus:border-[#8a6d1c] outline-none transition-colors"
                  placeholder="Nomor ISBN"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-[#d4c3a3]">
          <button 
            type="button"
            onClick={() => navigate('/books')}
            disabled={loading}
            className="px-5 py-2.5 border border-[#c2b192] text-[#3a2012] font-medium rounded-lg hover:bg-[#ebdcb8] transition-colors"
          >
            Batal
          </button>
          <button 
            type="button"
            onClick={(e) => handleSubmit(e, 'Draft')}
            disabled={loading}
            className="px-5 py-2.5 border border-[#c2b192] bg-[#ebdcb8] text-[#3a2012] font-medium rounded-lg hover:bg-[#d4c3a3] transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan Draft
          </button>
          <button 
            type="submit"
            onClick={(e) => handleSubmit(e, 'Published')}
            disabled={loading}
            className="px-5 py-2.5 bg-[#3a2012] text-[#f9f6f0] font-medium rounded-lg hover:bg-[#2a160b] transition-colors flex items-center gap-2 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isEditing ? 'Perbarui Buku' : 'Publikasikan'}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 right-6 bg-emerald-500 text-[#f9f6f0] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-5 fade-in z-50">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Save className="w-4 h-4" />
          </div>
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AddBook;
