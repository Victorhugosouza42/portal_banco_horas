// src/LoginScreen.jsx
import React, { useState, useEffect } from 'react';
import { Swords } from "lucide-react";
import { auth, setToken, getPublicRoles } from './api.js'; // Importar getPublicRoles

// UI simplificada
const Card = ({ children }) => <div className="theme-card max-w-md w-full">{children}</div>;
const Button = ({ children, onClick, disabled }) => <button onClick={onClick} disabled={disabled} className="btn-primary w-full mt-6">{children}</button>;
const Input = ({ label, value, onChange, type = "text", placeholder }) => (
  <div><label className="block text-sm font-medium text-slate-600 dark:text-neutral-300 mb-2">{label}</label><input type={type} value={value} onChange={onChange} placeholder={placeholder} required className="theme-input" /></div>
);

const LoginScreen = ({ Page, onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState(""); // Inicialmente vazio
  const [rolesList, setRolesList] = useState([]); // Lista dinâmica
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carrega os cargos assim que o componente monta
  useEffect(() => {
      getPublicRoles().then(res => {
          setRolesList(res.data);
          if (res.data.length > 0) setRole(res.data[0].name); // Define o primeiro como padrão
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
    } catch (err) { setError(err.response?.data?.detail || "Erro."); } 
    finally { setLoading(false); }
  };

  return (
    <Page>
      <div className="min-h-[80vh] grid place-items-center">
        <Card>
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 mb-3"><Swords className="text-emerald-600 dark:text-emerald-400" size={32} /></div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-emerald-100">14ª REGIONAL</h1>
            <p className="text-slate-500 dark:text-neutral-400 text-sm">Portal de Gestão</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border-red-200 text-red-600 rounded text-sm">{error}</div>}
            {!isLoginMode && (
              <>
                <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-neutral-300 mb-2">Função</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="theme-input">
                    {rolesList.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
              </>
            )}
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
            <Input label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" />
            <Button type="submit" disabled={loading}>{loading ? "..." : (isLoginMode ? "Entrar" : "Registar")}</Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-neutral-400">
            <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold ml-2">
              {isLoginMode ? "Criar conta" : "Fazer Login"}
            </button>
          </div>
        </Card>
      </div>
    </Page>
  );
};
export default LoginScreen;