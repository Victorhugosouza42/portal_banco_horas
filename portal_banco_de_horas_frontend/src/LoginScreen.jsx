// src/LoginScreen.jsx
import React, { useState } from 'react';
import { motion } from "framer-motion";
import { LogIn, Swords } from "lucide-react";
import { auth, setToken } from './api.js'; // <-- CORRIGIDO

// --- Paleta e Branding (Manter a consistência do backend) ---
const brand = {
  name: "14 REGIONAL EXTREMO SUL",
  primary: "#0ea567", // verde principal
  primaryDark: "#0b7d4f",
  bg: "#0b1f17", // verde-escuro profundo para fundo
};

// --- Componentes UI ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-neutral-900/50 border border-emerald-900/40 rounded-2xl shadow-xl p-5 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, disabled, type = "button", className = "" }) => {
  const base = "px-4 py-2 rounded-xl font-medium transition transform active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed";
  const variant = `bg-[${brand.primary}] hover:bg-[${brand.primaryDark}] text-white`;
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variant} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder = "", required = true, className = "" }) => (
  <div>
    <label className="block text-sm text-neutral-300 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full bg-neutral-900 border border-emerald-800 text-emerald-100 p-3 rounded-xl ${className}`}
    />
  </div>
);

// --- Componente Principal ---

const LoginScreen = ({ Page, onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Analista");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const roles = ["Analista", "Técnico", "Assistente", "Coordenação"]; // Roles permitidos no seed original

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let response;
      if (isLoginMode) {
        response = await auth.login(email, password);
        
        // Se a API retornar um token, salvamos e disparamos o carregamento do perfil
        const token = response.data.access_token;
        if (token) {
          setToken(token);
          await onLoginSuccess(); // Dispara o fetchProfile em PortalApp
        }
      } else {
        // Modo de Registo (Signup)
        await auth.signup(name, role, email, password);
        alert("Registo concluído! Por favor, faça login.");
        setIsLoginMode(true);
      }
    } catch (err) {
      // Captura a mensagem de erro da API Python
      const detail = err.response?.data?.detail || "Erro desconhecido. Verifique o servidor.";
      setError(detail);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
  };

  return (
    <Page>
      <div className="min-h-[70vh] grid place-items-center">
        <Card className="max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-2 rounded-xl bg-emerald-900/50 border border-emerald-800">
              <Swords className="text-emerald-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-emerald-100">{brand.name}</h1>
          </div>
          <p className="text-neutral-300 mb-6">
            {isLoginMode ? "Acesso ao Portal Banco de Horas" : "Registo de Novo Usuário"}
          </p>

          <form onSubmit={handleAuth}>
            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            
            {/* Campos de Registo (Aparecem apenas em modo Signup) */}
            {!isLoginMode && (
              <>
                <Input 
                  label="Nome Completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
                <div className="mt-4">
                  <label className="block text-sm text-neutral-300 mb-2">Função/Cargo</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-neutral-900 border border-emerald-800 text-emerald-100 p-3 rounded-xl mb-4"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Campos Comuns */}
            <Input 
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@14regional.gov"
              className={!isLoginMode ? "mt-2" : ""}
              required
            />
            <Input 
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="mt-4"
              required
            />

            <Button type="submit" disabled={loading} className="w-full mt-6">
              {loading ? "Processando..." : (
                <>
                  <LogIn className="inline mr-2" size={18} /> 
                  {isLoginMode ? "Entrar" : "Registar"}
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-neutral-400">
            {isLoginMode ? "Não tem conta?" : "Já tem conta?"}
            <button 
              onClick={toggleMode}
              className="text-emerald-400 hover:text-emerald-300 font-medium ml-2"
              disabled={loading}
            >
              {isLoginMode ? "Registe-se agora" : "Fazer Login"}
            </button>
          </div>
        </Card>
      </div>
    </Page>
  );
};

export default LoginScreen;