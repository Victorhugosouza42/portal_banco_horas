// src/PortalApp.jsx
import React, { useState, useEffect } from 'react';
import { setToken, getToken, clearToken, user } from './api.js';
import LoginScreen from './LoginScreen.jsx'; 
import Dashboard from './Dashboard.jsx'; 
import { Moon, Sun } from "lucide-react";

function PortalApp() {
  // Lógica do Tema: Lê do localStorage ou usa 'dark' por padrão
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const brandName = "14 REGIONAL EXTREMO SUL";

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
    if (!getToken()) { setIsAuthenticated(false); setIsLoading(false); return; }
    try {
      const response = await user.getProfile();
      setCurrentUser(response.data);
      setIsAdmin(response.data.is_admin);
      setIsAuthenticated(true);
    } catch (error) {
      if (error.response?.status === 401) handleLogout(); 
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  // Componente de Página usando a classe .theme-page do CSS
  const Page = ({ children }) => (
    <div className="theme-page">
      {/* Botão Flutuante de Tema */}
      <button 
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-lg text-slate-600 dark:text-yellow-400 hover:scale-110 transition-transform"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
        <footer className="mt-10 text-center text-xs text-subtitle opacity-70">
          Desenvolvido por {brandName}
        </footer>
      </div>
    </div>
  );

  if (isLoading) return <Page><div className="min-h-[70vh] grid place-items-center animate-pulse">Carregando...</div></Page>;

  if (!isAuthenticated) return <LoginScreen onLoginSuccess={fetchProfile} Page={Page} />;

  return <Dashboard currentUser={currentUser} isAdmin={isAdmin} onLogout={handleLogout} Page={Page} fetchProfile={fetchProfile} />;
}

export default PortalApp;