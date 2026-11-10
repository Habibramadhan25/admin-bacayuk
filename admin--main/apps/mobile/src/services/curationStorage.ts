import { useState, useEffect } from 'react';
import { mobileRealtime } from './realtime';

export interface MobilePromoBanner {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  buttonText: string;
  targetType: 'explore' | 'book' | 'category' | 'url';
  targetValue?: string;
  imageUrl?: string;
  bgColor?: string;
  status: 'Active' | 'Inactive';
  order: number;
}

export interface MobileCuratedShelf {
  id: string;
  title: string;
  description: string;
  badge?: string;
  icon?: string;
  bookIds: string[];
  status: 'Active' | 'Inactive';
  order: number;
}

const DEFAULT_BANNERS: MobilePromoBanner[] = [
  {
    id: 'ban1',
    title: 'Jelajahi Dunia Literasi Bersama BacaYuk',
    subtitle: 'Baca kapan saja, di mana saja. Ribuan naskah digital membuka cakrawala pengetahuan.',
    badge: 'Unggulan',
    buttonText: 'Jelajahi Koleksi',
    targetType: 'explore',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    bgColor: '#3a2012',
    status: 'Active',
    order: 1
  },
  {
    id: 'ban2',
    title: 'Spesial Hari Pahlawan: Jejak Sejarah Bangsa',
    subtitle: 'Kisah perjuangan, keteguhan, dan kemerdekaan dalam lembaran naskah bersejarah.',
    badge: 'Spesial Hari Pahlawan',
    buttonText: 'Baca Sekarang',
    targetType: 'book',
    targetValue: 'b11',
    imageUrl: 'https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?auto=format&fit=crop&w=600&q=80',
    bgColor: '#8a6d1c',
    status: 'Active',
    order: 2
  },
  {
    id: 'ban3',
    title: 'Cerita Rakyat & Fabel Nusantara untuk Generasi Cerdas',
    subtitle: 'Koleksi dongeng kaya pesan moral dan budi pekerti luhur warisan leluhur Indonesia.',
    badge: 'Cerita Nusantara',
    buttonText: 'Lihat Buku',
    targetType: 'category',
    targetValue: 'Cerita Anak',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    bgColor: '#2d3748',
    status: 'Active',
    order: 3
  }
];

const DEFAULT_CURATIONS: MobileCuratedShelf[] = [
  {
    id: 'cur1',
    title: 'Pilihan Editor',
    description: 'Naskah pilihan kurator BacaYuk dengan kedalaman cerita, inspirasi, dan rating tertinggi.',
    badge: 'Rekomendasi Utama',
    icon: 'Sparkles',
    bookIds: ['b1', 'b4', 'b18', 'b2'],
    status: 'Active',
    order: 1
  },
  {
    id: 'cur2',
    title: 'Buku Cerita Rakyat & Nusantara',
    description: 'Kearifan lokal dan dongeng warisan nusantara yang mendidik serta memikat anak-anak.',
    badge: 'Warisan Budaya',
    icon: 'BookOpen',
    bookIds: ['b20', 'b12', 'b13', 'b8'],
    status: 'Active',
    order: 2
  },
  {
    id: 'cur3',
    title: 'Spesial Hari Pahlawan & Sejarah',
    description: 'Napak tilas perjuangan kemerdekaan, perlawanan, dan saksi sejarah bangsa Indonesia.',
    badge: 'Refleksi Sejarah',
    icon: 'Flame',
    bookIds: ['b11', 'b18', 'b1', 'b3'],
    status: 'Active',
    order: 3
  }
];

export const CurationStorage = {
  getBanners(): MobilePromoBanner[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('bacayuk_banners');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter(b => b.status === 'Active').sort((a, b) => a.order - b.order);
          }
        } else {
          localStorage.setItem('bacayuk_banners', JSON.stringify(DEFAULT_BANNERS));
        }
      } catch (e) {
        console.warn('Error reading banners:', e);
      }
    }
    return DEFAULT_BANNERS;
  },

  getCurations(): MobileCuratedShelf[] {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('bacayuk_curations');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter(s => s.status === 'Active').sort((a, b) => a.order - b.order);
          }
        } else {
          localStorage.setItem('bacayuk_curations', JSON.stringify(DEFAULT_CURATIONS));
        }
      } catch (e) {
        console.warn('Error reading curations:', e);
      }
    }
    return DEFAULT_CURATIONS;
  }
};

export function useCurations() {
  const [banners, setBanners] = useState<MobilePromoBanner[]>(() => CurationStorage.getBanners());
  const [shelves, setShelves] = useState<MobileCuratedShelf[]>(() => CurationStorage.getCurations());

  useEffect(() => {
    const refresh = () => {
      setBanners(CurationStorage.getBanners());
      setShelves(CurationStorage.getCurations());
    };

    const unsubscribe = mobileRealtime.subscribe((msg) => {
      if (msg.type === 'STATE_SYNCED' || msg.type.includes('CURATION') || msg.type.includes('BANNER')) {
        refresh();
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refresh);
      window.addEventListener('bacayuk_banners_updated', refresh);
      window.addEventListener('bacayuk_curations_updated', refresh);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', refresh);
        window.removeEventListener('bacayuk_banners_updated', refresh);
        window.removeEventListener('bacayuk_curations_updated', refresh);
      }
    };
  }, []);

  return { banners, shelves };
}

