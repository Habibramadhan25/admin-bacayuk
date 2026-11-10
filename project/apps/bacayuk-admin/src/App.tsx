import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Books from './pages/Books';
import AddBook from './pages/AddBook';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Ratings from './pages/Ratings';
import History from './pages/History';
import Settings from './pages/Settings';
import Activity from './pages/Activity';

// Siswa Pages
import SiswaLayout from './layouts/SiswaLayout';
import LoginSiswa from './pages/siswa/LoginSiswa';
import RegisterSiswa from './pages/siswa/RegisterSiswa';
import DashboardSiswa from './pages/siswa/DashboardSiswa';
import KatalogSiswa from './pages/siswa/KatalogSiswa';
import FavoritSiswa from './pages/siswa/FavoritSiswa';
import DetailBukuSiswa from './pages/siswa/DetailBukuSiswa';
import BacaBukuSiswa from './pages/siswa/BacaBukuSiswa';
import ProfilSiswa from './pages/siswa/ProfilSiswa';
import RiwayatSiswa from './pages/siswa/RiwayatSiswa';
import { initLocalStorage } from './lib/mockData';

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(localStorage.getItem('bacayuk_admin_auth') === 'true');
  const [isSiswaAuthenticated, setIsSiswaAuthenticated] = useState(localStorage.getItem('bacayuk_siswa_auth') === 'true');

  useEffect(() => {
    initLocalStorage();
    const handleAuthChange = () => {
      setIsAdminAuthenticated(localStorage.getItem('bacayuk_admin_auth') === 'true');
      setIsSiswaAuthenticated(localStorage.getItem('bacayuk_siswa_auth') === 'true');
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth_changed', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth_changed', handleAuthChange);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Siswa Routes */}
        <Route path="/siswa/login" element={!isSiswaAuthenticated ? <LoginSiswa /> : <Navigate to="/siswa" />} />
        <Route path="/siswa/register" element={!isSiswaAuthenticated ? <RegisterSiswa /> : <Navigate to="/siswa" />} />
        
        <Route path="/siswa" element={isSiswaAuthenticated ? <SiswaLayout /> : <Navigate to="/siswa/login" />}>
          <Route index element={<DashboardSiswa />} />
          <Route path="katalog" element={<KatalogSiswa />} />
          <Route path="favorit" element={<FavoritSiswa />} />
          <Route path="riwayat" element={<RiwayatSiswa />} />
          <Route path="buku/:id" element={<DetailBukuSiswa />} />
          <Route path="profil" element={<ProfilSiswa />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={!isAdminAuthenticated ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={isAdminAuthenticated ? <AdminLayout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="books" element={<Books />} />
          <Route path="books/add" element={<AddBook />} />
          <Route path="books/edit/:id" element={<AddBook />} />
          <Route path="categories" element={<Categories />} />
          <Route path="users" element={<Users />} />
          <Route path="ratings" element={<Ratings />} />
          <Route path="history" element={<History />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
