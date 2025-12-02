// src/PortalApp.jsx
import React, { useState, useEffect } from 'react';
import { setToken, getToken, clearToken, user } from './api.js';
import LoginScreen from './LoginScreen.jsx'; 
import Dashboard from './Dashboard.jsx'; 
import Layout from './Layout.jsx'; // <--- Importar o novo Layout

function PortalApp() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Aplica o tema ao HTML
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsAdmin(false);
  };

  const fetchProfile = async () => {
    const token = getToken();
    if (!token) {
      handleLogout();
      setIsLoading(false);
      return;
    }
    try {
      const response = await user.getProfile();
      setCurrentUser(response.data);
      setIsAdmin(response.data.is_admin);
      setIsAuthenticated(true);
    } catch (error) {
      if (error.response && [401, 403, 500].includes(error.response.status)) {
        handleLogout(); 
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // Renderização Condicional dentro do Layout Estável
  return (
    <Layout theme={theme} toggleTheme={toggleTheme}>
      {isLoading ? (
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-emerald-600 dark:text-emerald-400 text-lg font-semibold animate-pulse">
            A carregar sistema...
          </div>
        </div>
      ) : !isAuthenticated ? (
        <LoginScreen onLoginSuccess={fetchProfile} />
      ) : (
        <Dashboard 
          currentUser={currentUser} 
          isAdmin={isAdmin} 
          onLogout={handleLogout} 
          fetchProfile={fetchProfile} 
        />
      )}
    </Layout>
  );
}

export default PortalApp;