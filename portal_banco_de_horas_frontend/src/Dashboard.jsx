// src/Dashboard.jsx

import React, { useState, useEffect } from 'react';
// 1. Adicionámos o ícone Plane (Avião) aqui:
import { Clock, LogOut, Swords, Trophy, Hourglass, Users, FileText, Check, Settings, ShieldCheck, BarChart3, User, Lock, Plane, UserPlus } from "lucide-react";
import { user, admin } from './api.js';

// Componentes Filhos Existentes
import ChallengesManager from './ChallengesManager.jsx'; 
import AdminValidation from './AdminValidation.jsx'; 
import AdminUsers from './AdminUsers.jsx';
import AdminChallenges from './AdminChallenges.jsx';
import AdminChallengeReport from './AdminChallengeReport.jsx';
import AdminSettings from './AdminSettings.jsx';
import AdminUserCreate from './AdminUserCreate.jsx';

// 2. Importamos os nossos novos componentes de Férias
import FeriasCard from './FeriasCard.jsx'; // Verifique se a pasta está correta
import AdminFerias from './AdminFerias.jsx';

// --- UI Components ---
const Card = ({ children, className="" }) => <div className={`theme-card ${className}`}>{children}</div>;
const Tag = ({ children, variant="default" }) => <span className={`tag tag-${variant}`}>{children}</span>;
const Button = ({ children, onClick, variant="primary", disabled, className="" }) => (
  <button onClick={onClick} disabled={disabled} className={`btn-${variant} ${className}`}>{children}</button>
);

const Stat = ({ icon: Icon, label, value, sub }) => (
  <Card className="!p-4 flex items-center gap-4">
    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 transition-colors duration-300">
      <Icon size={24} />
    </div>
    <div>
      <div className="text-slate-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{sub}</div>}
    </div>
  </Card>
);

// --- Header ---
function Header({ user, onLogout }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-white dark:bg-emerald-900/50 border border-slate-200 dark:border-emerald-800 shadow-sm transition-colors duration-300">
          <Trophy className="text-emerald-600 dark:text-emerald-400" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">
            14ª REGIONAL <span className="font-normal text-slate-600 dark:text-emerald-200/80">- Teixeira de Freitas</span>
          </h1>
          <p className="text-slate-500 dark:text-neutral-400 text-sm transition-colors duration-300">
            Portal Banco de Horas & Gamificação - Bem-vindo, <span className="font-semibold text-emerald-700 dark:text-emerald-300">{user.name || 'Servidor'}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Tag variant={user.is_admin ? "success" : "default"}>{user.role}{user.is_admin ? " • Admin" : ""}</Tag>
        <button 
          onClick={onLogout} 
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-emerald-300 border border-slate-300 dark:border-emerald-800 hover:bg-slate-100 dark:hover:bg-emerald-900/30 transition-all duration-200"
        >
          Sair <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

// --- User Profile Card ---
function UserProfileCard({ currentUser }) {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");
    
    setLoading(true);
    try {
      await user.updatePassword(newPassword); 
      alert("Senha atualizada com sucesso!");
      setNewPassword("");
    } catch (e) {
      alert("Erro ao atualizar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-fit">
      <h2 className="text-lg font-bold mb-4 flex gap-2 text-slate-800 dark:text-white border-b border-slate-100 dark:border-emerald-900/30 pb-2">
        <User className="text-emerald-600"/> Minha Conta
      </h2>
      <div className="flex flex-col gap-4">
        <div className="text-sm">
          <p className="text-slate-500 dark:text-neutral-400 text-xs uppercase font-bold mb-1">Email Cadastrado</p>
          <div className="font-medium text-slate-800 dark:text-emerald-100 bg-slate-50 dark:bg-neutral-950 p-2 rounded border border-slate-200 dark:border-emerald-900/30">
             {currentUser.email}
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="pt-2">
           <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Alterar Senha</label>
           <div className="flex gap-2">
             <input 
               type="password" 
               className="theme-input" 
               placeholder="Nova senha..."
               value={newPassword}
               onChange={(e) => setNewPassword(e.target.value)}
             />
             <Button type="submit" disabled={loading || !newPassword} variant="primary" className="!px-3">
               <Lock size={16}/>
             </Button>
           </div>
        </form>
      </div>
    </Card>
  );
}

// --- User Dashboard ---
function UserDashboardContent({ currentUser, fetchProfile }) {
  const [req, setReq] = useState({ type: "gozo", amount: 1, unit: "days", reason: "" });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState(10);
  const [convH, setConvH] = useState(1);

  const fetchRequests = async () => { try { const r = await user.getRequests(); setRequests(r.data); } catch (e) {} };
  
  useEffect(() => { 
      fetchRequests(); 
      const getSet = user.getSettings || admin.getSettings;
      if(getSet) getSet().then(r => setRate(r.data.points_per_hour)).catch(()=>{});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    const finalHours = req.unit === 'days' ? req.amount * 8 : req.amount;
    try { await user.createRequest(req.type, finalHours, req.reason); fetchRequests(); setReq({ type: "gozo", amount: 1, unit: "days", reason: "" }); alert("Enviado!"); }
    catch (e) { alert("Erro."); } finally { setLoading(false); }
  };

  const handleConvert = async () => { try { await user.convertPoints(convH); await fetchProfile(); alert("Convertido!"); } catch(e){alert("Erro");} };

  const cost = convH * rate;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {/* Conversão */}
            <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
                <div className="flex justify-between mb-4">
                    <h2 className="text-emerald-900 dark:text-emerald-100 font-bold flex gap-2"><Hourglass size={20}/> Converter Pontos</h2>
                    <span className="text-xs font-bold bg-white dark:bg-black/20 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">1h = {rate}pts</span>
                </div>
                <div className="flex gap-3 items-end">
                    <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">Horas</label><input type="number" min={1} value={convH} onChange={(e)=>setConvH(+e.target.value)} className="theme-input"/></div>
                    <div className="pb-3 text-sm font-bold text-slate-700 dark:text-emerald-200">Custo: {cost} pts</div>
                    <Button onClick={handleConvert} disabled={currentUser.points < cost} variant="success">Converter</Button>
                </div>
            </Card>
            
            {/* Pedido */}
            <Card>
                <h2 className="text-lg font-bold mb-4 flex gap-2 text-slate-800 dark:text-white"><FileText className="text-emerald-600"/> Novo Pedido</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Tipo</label>
                            <select value={req.type} onChange={(e)=>setReq({...req, type:e.target.value})} className="theme-input"><option value="gozo">Folga</option><option value="concessao">Crédito</option></select>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1"><label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Qtd.</label><input type="number" min={0.5} step={0.5} value={req.amount} onChange={(e)=>setReq({...req, amount:+e.target.value})} className="theme-input"/></div>
                            <div className="w-1/3"><label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Unid.</label><select value={req.unit} onChange={(e)=>setReq({...req, unit:e.target.value})} className="theme-input"><option value="days">Dias</option><option value="hours">Horas</option></select></div>
                        </div>
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded transition-colors border border-emerald-100 dark:border-emerald-900/30">
                        Resumo: <b>{req.unit === 'days' ? req.amount * 8 : req.amount} horas</b>
                    </div>
                    <input value={req.reason} onChange={(e)=>setReq({...req, reason:e.target.value})} className="theme-input" placeholder="Motivo (Ex: Atestado...)" required/>
                    <Button type="submit" disabled={loading} className="w-full">Enviar Pedido</Button>
                </form>
            </Card>
        </div>

        <div className="flex flex-col gap-6">
            {/* 3. Aqui está o nosso novo Card de Férias! */}
            <FeriasCard userId={currentUser.id} />

            <UserProfileCard currentUser={currentUser} />

            <Card className="h-fit">
                <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Histórico</h2>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {requests.length === 0 && <p className="text-slate-400 text-center text-sm py-4">Nenhum pedido.</p>}
                    {requests.map(r => (
                        <div key={r.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors">
                            <div>
                                <div className="font-semibold text-sm text-slate-700 dark:text-emerald-200">
                                    {r.type === 'gozo' ? 'Folga' : 'Crédito'} • {r.hours}h <span className="text-[10px] opacity-70">({(r.hours/8).toFixed(1)}d)</span>
                                </div>
                                <div className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</div>
                            </div>
                            <Tag variant={r.status === 'aprovado' ? 'success' : r.status === 'negado' ? 'danger' : 'pending'}>{r.status}</Tag>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
      </div>
      <ChallengesManager currentUser={currentUser} />
    </div>
  );
}

// --- Admin Content ---
function AdminDashboardContent({ currentUser, fetchProfile }) {
  const [activeTab, setActiveTab] = useState(localStorage.getItem('adminTab') || "requests");
  const [requests, setRequests] = useState([]);

  useEffect(() => { localStorage.setItem('adminTab', activeTab); }, [activeTab]);

  const fetchData = async () => { try { const r = await admin.getAllRequests(); setRequests(r.data); } catch (e) {} };
  useEffect(() => { fetchData(); }, []);

  const handleProcess = async (rid, status) => { try { await admin.processRequest(rid, status); fetchData(); } catch(e) { alert("Erro"); } };

  return (
    <>
      <div className="flex flex-wrap border-b border-slate-200 dark:border-emerald-900 mb-6 gap-1">
        {[
            {id: 'requests', label: 'Pedidos & Validação', icon: Clock},
            {id: 'users', label: 'Usuários', icon: Users},
            {id: 'ferias', label: 'Férias', icon: Plane},
            {id: 'config', label: 'Configurações', icon: Settings},
            {id: 'meu_painel', label: 'Meu Painel', icon: User},
            {id: 'create_user', label: 'Cadastrar Usuários', icon: UserPlus},
            {id: 'reports', label: 'Relatórios', icon: BarChart3},
            {id: 'challenges', label: 'Desafios', icon: Swords},
        ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-t-lg flex items-center gap-2 text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id 
                    ? 'bg-white dark:bg-neutral-900 border-t border-x border-slate-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 shadow-sm -mb-px' 
                    : 'text-slate-500 dark:text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-300'
                }`}>
                <tab.icon size={16} /> {tab.label}
            </button>
        ))}
      </div>

      {activeTab === 'requests' && (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Card>
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Pedidos de Horas</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="theme-table-head w-1/4">Nome</th>
                                <th className="theme-table-head">Tipo</th>
                                <th className="theme-table-head">Horas</th>
                                <th className="theme-table-head w-1/3">Motivo</th>
                                <th className="theme-table-head">Status</th>
                                <th className="theme-table-head w-20">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(r => (
                                <tr key={r.id} className="theme-table-row transition-colors">
                                    <td className="theme-table-cell font-medium truncate max-w-[150px]" title={r.profiles?.name}>{r.profiles?.name}</td>
                                    <td className="theme-table-cell">{r.type}</td>
                                    <td className="theme-table-cell font-bold">{r.hours}h</td>
                                    <td className="theme-table-cell truncate max-w-[250px] text-slate-500 dark:text-slate-400 italic" title={r.reason}>{r.reason || '-'}</td>
                                    <td className="theme-table-cell"><Tag variant={r.status==='aprovado'?'success':r.status==='negado'?'danger':'pending'}>{r.status}</Tag></td>
                                    <td className="theme-table-cell">
                                        {r.status === 'pendente' && (
                                            <div className="flex gap-2">
                                                <Button variant="success" className="!px-2 !py-1" onClick={()=>handleProcess(r.id, 'aprovado')}><Check size={14}/></Button>
                                                <Button variant="danger" className="!px-2 !py-1" onClick={()=>handleProcess(r.id, 'negado')}>X</Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            <AdminValidation />
        </div>
      )}
      {activeTab === 'create_user' && <AdminUserCreate />}
      {activeTab === 'meu_painel' && <UserDashboardContent currentUser={currentUser} fetchProfile={fetchProfile} />}
      {activeTab === 'ferias' && <AdminFerias />}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'challenges' && <AdminChallenges />}
      {activeTab === 'reports' && <AdminChallengeReport />}
      {activeTab === 'config' && <AdminSettings />}
    </>
  );
}

// --- APP CONTAINER ---
const Dashboard = ({ currentUser, isAdmin, onLogout, fetchProfile }) => {
  if (!currentUser) {
    return (
      <div className="min-h-screen grid place-items-center bg-emerald-50 dark:bg-[#0b1f17] text-slate-500">
        <div className="text-center animate-pulse"><p className="mb-2">A carregar dados...</p></div>
      </div>
    );
  }

  const days = (currentUser.hours / 8).toFixed(2);

  return (
    <>
      <Header user={currentUser} onLogout={onLogout} />
      
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Stat icon={Clock} label="Saldo de Horas" value={`${currentUser.hours} h`} sub={`${days} dias de folga`} />
        <Stat icon={Trophy} label="Meus Pontos" value={`${currentUser.points}`} sub="Disponíveis para troca" />
        {isAdmin 
            ? <Stat icon={ShieldCheck} label="Função" value="Administrador" sub="Acesso Total" />
            : <Stat icon={Users} label="Função" value={currentUser.role} sub="Colaborador" />
        }
      </div>

      {isAdmin ? <AdminDashboardContent currentUser={currentUser} fetchProfile={fetchProfile} /> : <UserDashboardContent currentUser={currentUser} fetchProfile={fetchProfile} />}
    </>
  );
};

export default Dashboard;