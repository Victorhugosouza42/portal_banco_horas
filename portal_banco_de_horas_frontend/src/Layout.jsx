// src/Layout.jsx
import React from 'react';
import { Moon, Sun } from "lucide-react";

const Layout = ({ children, theme, toggleTheme }) => {
  return (
    <div className="theme-page">
      {/* Botão Flutuante de Tema */}
      <button 
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 shadow-lg text-slate-600 dark:text-yellow-400 hover:scale-110 transition-transform"
        title="Mudar Tema"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
        <footer className="mt-10 text-center text-xs text-slate-500 dark:text-neutral-400 opacity-70">
          Desenvolvido por 14 REGIONAL EXTREMO SUL
        </footer>
      </div>
    </div>
  );
};

export default Layout;