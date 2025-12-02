// src/LoginScreen.jsx
import React, { useState, useEffect } from 'react';
import { Swords } from "lucide-react";
import { auth, setToken, getPublicRoles } from './api.js';

// VOLTÁMOS para max-w-md (Tamanho Original Compacto)
const Card = ({ children }) => (
    <div className="theme-card max-w-md w-full shadow-xl dark:shadow-emerald-900/20">
        {children}
    </div>
);

const Button = ({ children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="btn-primary w-full mt-6">
        {children}
    </button>
);

const Input = ({ label, value, onChange, type = "text", placeholder }) => (
  <div>
    <label className="block text-sm font-bold text-slate-600 dark:text-neutral-300 mb-2 ml-1">{label}</label>
    <input 
        type={type} value={value} onChange={onChange} placeholder={placeholder} required 
        className="theme-input" 
    />
  </div>
);

const LoginScreen = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(""); 
  const [rolesList, setRolesList] = useState([]); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      getPublicRoles().then(res => {
          setRolesList(res.data);
          if (res.data.length > 0) setRole(res.data[0].name);
      }).catch(() => {});
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      if (isLoginMode) {
        const res = await auth.login(email, password);
        if (res.data.access_token) { setToken(res.data.access_token); await onLoginSuccess(); }
      } else {
        await auth.signup(name, role, email, password);
        alert("Registo concluído!"); setIsLoginMode(true);
      }
    } catch (err) { setError(err.response?.data?.detail || "Erro de conexão."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[85vh] grid place-items-center p-4">
      <Card>
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 mb-4 ring-1 ring-emerald-100 dark:ring-emerald-800">
            <Swords className="text-emerald-600 dark:text-emerald-400" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-emerald-100 tracking-tight">14ª REGIONAL</h1>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1 font-medium">Portal de Gestão & Gamificação</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-lg text-sm font-semibold text-center animate-pulse">
                {error}
            </div>
          )}
          
          {!isLoginMode && (
            <>
              <Input label="Nome Completo" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" />
              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-neutral-300 mb-2 ml-1">Função</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="theme-input cursor-pointer">
                  {rolesList.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </>
          )}
          
          <Input label="Email Institucional" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@defensoria.ba.def.br" />
          <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          
          <Button type="submit" disabled={loading}>{loading ? "A processar..." : (isLoginMode ? "Entrar na Plataforma" : "Criar Nova Conta")}</Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-neutral-400">
          <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline font-bold transition-colors">
            {isLoginMode ? "Não tem conta? Registe-se" : "Já tem conta? Faça Login"}
          </button>
        </div>
      </Card>
    </div>
  );
};
export default LoginScreen;