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
import Curations from './pages/Curations';
import Reports from './pages/Reports';
import Circulation from './pages/Circulation';
import { initLocalStorage } from './lib/mockData';

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => sessionStorage.getItem('bacayuk_admin_auth') === 'true'
  );

  useEffect(() => {
    initLocalStorage();
    // Bersihkan sesi persisten lama di localStorage agar saat buka web selalu mulai dari login
    try {
      localStorage.removeItem('bacayuk_admin_auth');
      localStorage.removeItem('bacayuk_admin_user');
    } catch {}

    const handleAuthChange = () => {
      setIsAdminAuthenticated(sessionStorage.getItem('bacayuk_admin_auth') === 'true');
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth_changed', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth_changed', handleAuthChange);
    };
  }, []);

  return (
    <Router basename="/admin">
      <Routes>
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
          <Route path="curations" element={<Curations />} />
          <Route path="circulation" element={<Circulation />} />
          <Route path="reports" element={<Reports />} />
          <Route path="ratings" element={<Ratings />} />
          <Route path="history" element={<History />} />
          <Route path="activity" element={<Activity />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
