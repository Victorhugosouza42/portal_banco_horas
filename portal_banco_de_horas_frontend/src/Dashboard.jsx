// src/Dashboard.jsx
// (Versão Final Completa com Todas as Abas Administrativas)

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Clock, LogOut, Swords, Trophy, Hourglass, Users, FileText, Check, Download, Upload, Settings, ShieldCheck, BarChart3 } from "lucide-react";
import { user, challenge, admin } from './api.js';

// Importação dos Componentes Específicos
import ChallengesManager from './ChallengesManager.jsx'; 
import AdminValidation from './AdminValidation.jsx'; 
import AdminUsers from './AdminUsers.jsx';
import AdminChallenges from './AdminChallenges.jsx';
import AdminChallengeReport from './AdminChallengeReport.jsx'; // O novo relatório

// --- Paleta e Branding ---
const brand = {
  name: "14 REGIONAL EXTREMO SUL",
  primary: "#0ea567", // verde principal
  primaryDark: "#0b7d4f",
};

// --- Utilidades ---
const toDays = (hours) => (hours / 8).toFixed(2); // 8 horas = 1 dia

// --- Componentes UI (Reutilizados) ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-neutral-900/50 border border-emerald-900/40 rounded-2xl shadow-xl p-5 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", disabled, type = "button", className = "" }) => {
  const base = "px-4 py-2 rounded-xl font-medium transition transform active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm";
  const variants = {
    primary: `bg-[#0ea567] hover:bg-[#0b7d4f] text-white`,
    ghost: "bg-transparent border border-emerald-700 text-emerald-300 hover:bg-emerald-900/30",
    subtle: "bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/50",
    danger: "bg-red-600/90 text-white hover:bg-red-600",
    success: "bg-green-700/90 text-white hover:bg-green-600",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Tag = ({ children, variant="default" }) => {
  const variants = {
    default: "bg-emerald-800/50 text-emerald-200 border border-emerald-700",
    danger: "bg-red-800/50 text-red-200 border border-red-700",
    success: "bg-green-800/50 text-green-200 border border-green-700",
    pending: "bg-neutral-800/50 text-neutral-300 border border-neutral-700",
  }
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

const Stat = ({ icon: Icon, label, value, sub }) => (
  <Card>
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-xl bg-emerald-900/40 border border-emerald-800"><Icon className="text-emerald-300" size={24} /></div>
      <div>
        <div className="text-neutral-300 text-sm">{label}</div>
        <div className="text-2xl font-bold text-emerald-100">{value}</div>
        {sub && <div className="text-xs text-neutral-400">{sub}</div>}
      </div>
    </div>
  </Card>
);

// --- Componentes de Dashboard Específicos ---

function Header({ user, onLogout }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-2 rounded-xl bg-emerald-900/50 border border-emerald-800">
          <Trophy className="text-emerald-400" />
        </motion.div>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: brand.primary }}>{brand.name}</h1>
          <p className="text-neutral-300 text-sm">Portal Banco de Horas & Gamificação - Bem-vindo, {user.name || 'Servidor'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Tag>{user.role}{user.is_admin ? " • Admin" : ""}</Tag>
        <Button variant="ghost" onClick={onLogout}><LogOut size={16} className="inline mr-2"/> Sair</Button>
      </div>
    </div>
  );
}

// --- Lógica de Negócio (Conversão de Pontos) ---

function ConversionWidget({ currentUser, fetchProfile }) {
  const [hoursToConvert, setHoursToConvert] = useState(1);
  const [conversionRate, setConversionRate] = useState(10); 
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await admin.getSettings();
        setConversionRate(response.data.points_per_hour);
      } catch (e) {
        // Ignora
      }
    };
    fetchRate(); 
  }, []);


  const cost = hoursToConvert * conversionRate;
  const canConvert = currentUser.points >= cost && hoursToConvert > 0 && !loading;

  const handleConvert = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await user.convertPoints(hoursToConvert);
      await fetchProfile(); 
      setMessage({ type: 'success', text: `Conversão de ${hoursToConvert}h realizada com sucesso!` });
    } catch (e) {
      const detail = e.response?.data?.detail || "Erro desconhecido na conversão.";
      setMessage({ type: 'error', text: detail.replace("Exception: ", "") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <h2 className="text-emerald-100 font-semibold mb-3">Converter Pontos em Horas</h2>
      {message && (
        <div className={`p-3 rounded-lg mb-3 text-sm ${message.type === 'success' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
          {message.text}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div>
          <label className="text-sm text-neutral-300">Horas a adquirir</label>
          <input type="number" min={1} value={hoursToConvert}
                 onChange={(e)=>setHoursToConvert(Math.max(1, +e.target.value))}
                 className="w-full bg-neutral-900 border border-emerald-800 text-emerald-100 p-3 rounded-xl" />
        </div>
        <div className="text-neutral-300">
          Custo: <span className="font-semibold text-emerald-200">{cost} pts</span>
          <span className="text-xs text-neutral-400 block">({conversionRate} pts = 1h)</span>
        </div>
        <Button 
          onClick={handleConvert} 
          disabled={!canConvert} 
          className="w-full md:w-auto"
          variant="success"
        >
          <Hourglass size={16} className="inline mr-2"/> {loading ? "Processando..." : "Converter"}
        </Button>
      </div>
    </Card>
  );
}

// --- Dashboard de Usuário (Não Admin) ---

function UserDashboardContent({ currentUser, fetchProfile }) {
  const [req, setReq] = useState({ type: "gozo", hours: 4, reason: "" });
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await user.getRequests();
      setRequests(response.data);
    } catch (e) {
      console.error("Erro ao buscar pedidos:", e);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await user.createRequest(req.type, req.hours, req.reason);
      fetchRequests(); 
      setReq({ type: "gozo", hours: 4, reason: "" }); 
      setMessage({ type: 'success', text: "Solicitação enviada para aprovação!" });
    } catch (e) {
      const detail = e.response?.data?.detail || "Erro ao enviar solicitação.";
      setMessage({ type: 'error', text: detail.replace("Exception: ", "") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ConversionWidget currentUser={currentUser} fetchProfile={fetchProfile} />
      
      {/* Solicitação de Folga / Concessão */}
      <Card className="mt-4">
        <h2 className="text-emerald-100 font-semibold mb-3">Solicitar Folga / Concessão</h2>
        {message && (
          <div className={`p-3 rounded-lg mb-3 text-sm ${message.type === 'success' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm text-neutral-300">Tipo</label>
              <select value={req.type} onChange={(e)=>setReq((r)=>({...r, type:e.target.value}))}
                      className="w-full bg-neutral-900 border border-emerald-800 text-emerald-100 p-3 rounded-xl">
                <option value="gozo">Gozo (gastar horas)</option>
                <option value="concessao">Concessão (acrescentar horas)</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-300">Horas</label>
              <input type="number" min={1} value={req.hours}
                     onChange={(e)=>setReq((r)=>({...r, hours: Math.max(1, +e.target.value)}))}
                     className="w-full bg-neutral-900 border border-emerald-800 text-emerald-100 p-3 rounded-xl" required />
              <div className="text-xs text-neutral-400 mt-1">Equivale a {toDays(req.hours)} dia(s)</div>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-neutral-300">Motivo</label>
              <input value={req.reason} onChange={(e)=>setReq((r)=>({...r, reason:e.target.value}))}
                     className="w-full bg-neutral-900 border border-emerald-800 text-emerald-100 p-3 rounded-xl" placeholder="Descreva o motivo" required/>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="mt-3">
            <FileText size={16} className="inline mr-2"/> {loading ? "Enviando..." : "Enviar Solicitação"}
          </Button>
        </form>
      </Card>

      {/* Minhas Solicitações */}
      <Card className="mt-4">
        <h2 className="text-emerald-100 font-semibold mb-3">Minhas Solicitações</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-emerald-200 text-left border-b border-emerald-700/50">
                <th className="py-2 px-2">Data</th>
                <th className="py-2 px-2">Tipo</th>
                <th className="py-2 px-2">Horas</th>
                <th className="py-2 px-2">Motivo</th>
                <th className="py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr><td colSpan="5" className="py-4 text-center text-neutral-400">Nenhum pedido encontrado.</td></tr>
              )}
              {requests.map((r)=> (
                <tr key={r.id} className="border-t border-emerald-900/40 text-neutral-300 hover:bg-neutral-800/30">
                  <td className="py-2 px-2 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-2">{r.type}</td>
                  <td className="py-2 px-2">{r.hours} h ({toDays(r.hours)} d)</td>
                  <td className="py-2 px-2 max-w-xs truncate">{r.reason}</td>
                  <td className="py-2 px-2">
                    <Tag variant={r.status === 'aprovado' ? 'success' : r.status === 'negado' ? 'danger' : 'pending'}>
                      {r.status}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Gamificação */}
      <ChallengesManager currentUser={currentUser} />
    </>
  );
}

// --- Dashboard de Admin ---

function AdminDashboardContent({ currentUser }) {
  const [activeTab, setActiveTab] = useState("requests"); // Abas de navegação
  const [settings, setSettings] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Função auxiliar para buscar dados gerais
  const fetchAdminData = async () => {
    try {
      const [settingsRes, requestsRes] = await Promise.all([
        admin.getSettings(),
        admin.getAllRequests(),
      ]);
      setSettings(settingsRes.data);
      setRequests(requestsRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchAdminData(); }, []);

  // Lógica de processar pedido
  const handleProcessRequest = async (requestId, status) => {
    try {
        await admin.processRequest(requestId, status);
        fetchAdminData();
    } catch(e) { alert("Erro ao processar pedido."); }
  };

  // Lógica de atualizar settings
  const handleUpdateSettings = async () => {
      const novoValor = prompt("Nova taxa (pts por hora):", settings?.points_per_hour);
      if(novoValor) {
          await admin.updateSettings(parseInt(novoValor));
          fetchAdminData();
      }
  };

  return (
    <>
      {/* --- Navegação por Abas --- */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-emerald-900/50 pb-1">
        {[
            {id: 'requests', label: 'Visão Geral & Pedidos', icon: Clock},
            {id: 'users', label: 'Gestão de Usuários', icon: Users},
            {id: 'challenges', label: 'Criar Desafios', icon: Swords},
            {id: 'reports', label: 'Relatórios & Entregas', icon: BarChart3}, // Nova Aba
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg flex items-center gap-2 transition-colors text-sm font-medium ${
                    activeTab === tab.id 
                    ? 'bg-emerald-900/40 text-emerald-100 border-b-2 border-emerald-500' 
                    : 'text-neutral-400 hover:text-emerald-200 hover:bg-emerald-900/20'
                }`}
            >
                <tab.icon size={16} /> {tab.label}
            </button>
        ))}
      </div>

      {/* --- Conteúdo das Abas --- */}

      {/* ABA 1: PEDIDOS & VALIDAÇÃO */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
             <div className="grid md:grid-cols-3 gap-4">
                <div onClick={handleUpdateSettings} className="cursor-pointer hover:opacity-80 transition">
                    <Stat icon={Settings} label="Taxa de Conversão (Clique p/ Editar)" value={`${settings?.points_per_hour || 10} pts = 1h`} />
                </div>
                <Stat icon={Users} label="Total Pedidos" value={requests.length} />
                <Stat icon={ShieldCheck} label="Modo Admin" value="Ativo" />
            </div>

            {/* Tabela de Pedidos */}
            <Card>
                <h2 className="text-emerald-100 font-semibold mb-3">Solicitações Recentes</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-neutral-300">
                        <thead>
                            <tr className="text-emerald-200 border-b border-emerald-800">
                                <th className="p-2">Servidor</th>
                                <th>Tipo</th>
                                <th>Horas</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length === 0 && (
                                <tr><td colSpan="5" className="py-4 text-center text-neutral-400">Sem solicitações.</td></tr>
                            )}
                            {requests.map(r => (
                                <tr key={r.id} className="border-b border-emerald-900/20">
                                    <td className="p-2">{r.profiles?.name}</td>
                                    <td>{r.type}</td>
                                    <td>{r.hours}</td>
                                    <td><Tag variant={r.status === 'aprovado' ? 'success' : r.status === 'negado' ? 'danger' : 'pending'}>{r.status}</Tag></td>
                                    <td className="flex gap-1 py-1">
                                        {r.status === 'pendente' && (
                                            <>
                                                <Button variant="success" onClick={()=>handleProcessRequest(r.id, 'aprovado')}><Check size={12}/></Button>
                                                <Button variant="danger" onClick={()=>handleProcessRequest(r.id, 'negado')}><LogOut size={12}/></Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            {/* Validação de Provas (Fica aqui também, pois é uma tarefa diária) */}
            <AdminValidation />
        </div>
      )}

      {/* ABA 2: GESTÃO DE USUÁRIOS */}
      {activeTab === 'users' && <AdminUsers />}
      
      {/* ABA 3: CRIAR DESAFIOS */}
      {activeTab === 'challenges' && <AdminChallenges />}

      {/* ABA 4: RELATÓRIOS */}
      {activeTab === 'reports' && <AdminChallengeReport />}

    </>
  );
}

// --- Componente de Switch Principal ---

const Dashboard = ({ Page, currentUser, isAdmin, onLogout, fetchProfile }) => {
  const [conversionRate, setConversionRate] = useState(10); 

  // Proteção contra tela branca
  if (!currentUser) {
    return (
      <Page>
        <div className="min-h-[70vh] grid place-items-center text-neutral-400">
          <div className="text-center">
            <p className="mb-4">A carregar dados do perfil...</p>
            <button onClick={onLogout} className="text-emerald-400 hover:underline">
              (Clique aqui se demorar muito para Sair)
            </button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Header user={currentUser} onLogout={onLogout} />
      
      <div className="grid md:grid-cols-3 gap-4">
        <Stat icon={Clock} label="Saldo de Horas" value={`${currentUser.hours} h`} sub={`${toDays(currentUser.hours)} dia(s)`} />
        <Stat icon={Trophy} label="Pontos" value={`${currentUser.points}`} sub={`${conversionRate} pts = 1h`} />
        
        {isAdmin ? (
          <Stat icon={ShieldCheck} label="Função" value="Administrador" sub="Acesso total às operações." />
        ) : (
          <Stat icon={Users} label="Função" value={currentUser.role} />
        )}
      </div>

      {isAdmin ? (
        <AdminDashboardContent currentUser={currentUser} />
      ) : (
        <UserDashboardContent currentUser={currentUser} fetchProfile={fetchProfile} />
      )}
    </Page>
  );
};

export default Dashboard;