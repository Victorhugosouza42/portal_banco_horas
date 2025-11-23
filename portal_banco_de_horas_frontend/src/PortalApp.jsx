// src/PortalApp.jsx
import React, { useState, useEffect } from 'react';
import { setToken, getToken, clearToken, user } from './api.js'; // <-- CORRIGIDO
import LoginScreen from './LoginScreen.jsx'; 
import Dashboard from './Dashboard.jsx'; 

function PortalApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const brandName = "14 REGIONAL EXTREMO SUL";

  // Função global para logout
  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsAdmin(false);
  };

  // Função para buscar o perfil do usuário (usado após login e no recarregamento)
  const fetchProfile = async () => {
    if (!getToken()) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      // Tenta buscar o perfil do usuário no nosso endpoint protegido /me
      const response = await user.getProfile();
      const profile = response.data;
      
      setCurrentUser(profile);
      setIsAdmin(profile.is_admin);
      setIsAuthenticated(true);
    } catch (error) {
      // Se a API retornar 401/403 (Token inválido/expirado), limpa o token
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        handleLogout(); 
      }
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Efeito para buscar o perfil quando o componente monta (para persistir a sessão)
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Componente de Layout Base (A Page) ---
  const Page = ({ children, className = "" }) => (
    <div className="min-h-screen w-full" style={{ background: "#0b1f17" }}>
      <div className={`max-w-7xl mx-auto px-4 py-6 ${className}`}>
        {children}
        <footer className="mt-10 text-center text-sm text-neutral-300 opacity-80">
          Desenvolvido por {brandName}
        </footer>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Page>
        <div className="min-h-[70vh] grid place-items-center text-emerald-400 text-xl">
          Carregando portal...
        </div>
      </Page>
    );
  }

  if (!isAuthenticated) {
    return (
      // Renderiza a tela de login se não estiver autenticado
      <LoginScreen 
        onLoginSuccess={fetchProfile}
        Page={Page}
      />
    );
  }

  // Renderiza o Dashboard se estiver autenticado
  return (
    <Dashboard 
      currentUser={currentUser}
      isAdmin={isAdmin}
      onLogout={handleLogout}
      Page={Page}
      fetchProfile={fetchProfile} // Permite atualizar o perfil após ações (conversão, etc.)
    />
  );
}

export default PortalApp;