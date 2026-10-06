import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { BookDetailScreen } from './src/screens/BookDetailScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { TopNavbar } from './src/components/TopNavbar';
import { BottomTabBar, TabKey } from './src/components/BottomTabBar';
import { BookItem, MOCK_BOOKS } from './src/data/mockData';
import { useResponsive } from './src/hooks/useResponsive';
import { AuthApi, UserProfile } from './src/services/api';
import { UserStorage } from './src/services/storage';

function AppContent() {
  const { colors, isDark } = useAppTheme();
  const { isDesktop, isMobile } = useResponsive();

  const [activeTab, setActiveTab] = useState<TabKey | 'sedang-dibaca'>('beranda');
  const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
  const [isReading, setIsReading] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Status autentikasi: Default adalah GUEST (belum login)
  // Pengguna bebas melihat-lihat web sebelum login tanpa di-block
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return UserStorage.getActiveSessionUser();
  });

  // State favorit terisolasi per akun: mulai kosong untuk guest atau ambil dari storage akun aktif
  const [favoritesList, setFavoritesList] = useState<string[]>(() => {
    const active = UserStorage.getActiveSessionUser();
    return active ? UserStorage.getFavorites(active.id) : [];
  });

  const handleSelectBook = (book: BookItem) => {
    setSelectedBook(book);
  };

  const handleStartReading = (book: BookItem) => {
    setSelectedBook(book);
    setIsReading(true);
    // Simpan progres baca ke akun aktif jika sudah login
    if (currentUser) {
      UserStorage.saveReadingProgress(currentUser.id, book.id, book.progressPercentage || 10);
    }
  };

  const handleToggleFavorite = (book: BookItem) => {
    // Jika belum login, buka modal login agar pengguna bisa menyimpan ke akunnya
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    // Toggle dan simpan terisolasi per akun aktif
    const updated = UserStorage.toggleFavorite(currentUser.id, book.id);
    setFavoritesList(updated);
  };

  const handleTabPress = (tab: TabKey | 'sedang-dibaca') => {
    setSelectedBook(null);
    setIsReading(false);
    setIsProfileOpen(false);
    setIsAuthOpen(false);
    setActiveTab(tab);
  };

  // Callback saat ada pengguna yang baru login / mendaftar:
  // Reset/clear data pengguna sebelumnya dan sediakan kanvas data khusus akun ini
  const handleLoginSuccess = (user: UserProfile) => {
    // 1. Simpan sesi aktif baru
    UserStorage.setActiveSessionUser(user);
    setCurrentUser(user);
    setIsAuthOpen(false);

    // 2. Reset/clear state pengguna sebelumnya & muat kanvas akun baru
    const userFavorites = UserStorage.getFavorites(user.id);
    setFavoritesList(userFavorites);
  };

  // Callback saat logout:
  // Reset seluruh sesi dan bersihkan state pengguna
  const handleLogout = () => {
    UserStorage.clearSession();
    AuthApi.logout();
    setCurrentUser(null);
    setFavoritesList([]); // Bersihkan kanvas kembali ke keadaan awal
    setIsProfileOpen(false);
  };

  const renderScreen = () => {
    // 1. Auth Screen Modal Pop-up
    if (isAuthOpen) {
      return (
        <AuthScreen
          onBack={() => setIsAuthOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      );
    }

    // 2. Reading Screen (Full reader canvas)
    if (isReading && selectedBook) {
      return (
        <ReaderScreen
          book={selectedBook}
          onBack={() => setIsReading(false)}
        />
      );
    }

    // 3. Profile Screen
    if (isProfileOpen) {
      return (
        <ProfileScreen
          user={currentUser}
          onBack={() => setIsProfileOpen(false)}
          onLogout={handleLogout}
        />
      );
    }

    // 4. Book Detail Screen
    if (selectedBook) {
      return (
        <BookDetailScreen
          book={selectedBook}
          onBack={() => setSelectedBook(null)}
          onStartReading={handleStartReading}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={favoritesList.includes(selectedBook.id)}
        />
      );
    }

    // 5. Main Screens by Tab
    switch (activeTab) {
      case 'beranda':
        return (
          <HomeScreen
            onSelectBook={handleSelectBook}
            onExploreCollection={(cat) => setActiveTab('koleksi')}
            onOpenProfile={() => {
              if (currentUser) {
                setIsProfileOpen(true);
              } else {
                setIsAuthOpen(true);
              }
            }}
            onLoginPress={() => setIsAuthOpen(true)}
          />
        );
      case 'koleksi':
        return (
          <CollectionScreen
            onSelectBook={handleSelectBook}
            onOpenProfile={() => {
              if (currentUser) {
                setIsProfileOpen(true);
              } else {
                setIsAuthOpen(true);
              }
            }}
          />
        );
      case 'favorit':
        return (
          <FavoritesScreen
            favoriteBookIds={favoritesList}
            onSelectBook={handleSelectBook}
            onToggleFavorite={handleToggleFavorite}
            onExploreCollection={() => setActiveTab('koleksi')}
            onOpenProfile={() => {
              if (currentUser) {
                setIsProfileOpen(true);
              } else {
                setIsAuthOpen(true);
              }
            }}
          />
        );
      case 'sedang-dibaca':
      case 'riwayat':
        return (
          <HistoryScreen
            onSelectBook={handleSelectBook}
            onOpenProfile={() => {
              if (currentUser) {
                setIsProfileOpen(true);
              } else {
                setIsAuthOpen(true);
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  const showNavbar = !isReading && !isAuthOpen;
  const showBottomNav =
    isMobile && !selectedBook && !isReading && !isProfileOpen && !isAuthOpen;

  return (
    <View
      style={[
        styles.rootContainer,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />

      {/* Top Navbar dengan Dark/Light Toggle + Tombol Masuk / Foto Profil Dropdown */}
      {showNavbar ? (
        <TopNavbar
          activeTab={activeTab}
          onTabPress={handleTabPress}
          currentUser={currentUser}
          onLoginPress={() => setIsAuthOpen(true)}
          onProfilePress={() => setIsProfileOpen(true)}
          onLogout={handleLogout}
        />
      ) : null}

      {/* Main Workspace Area */}
      <View style={styles.contentArea}>
        {renderScreen()}
      </View>

      {/* Mobile Bottom Navigation Bar */}
      {showBottomNav ? (
        <BottomTabBar
          activeTab={
            activeTab === 'sedang-dibaca' ? 'riwayat' : (activeTab as TabKey)
          }
          onTabPress={(tab) => handleTabPress(tab)}
        />
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    height: '100%',
    minHeight: '100vh' as any,
    width: '100%',
  },
  contentArea: {
    flex: 1,
    height: '100%',
    overflow: 'auto' as any,
  },
});
