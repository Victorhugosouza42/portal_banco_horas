// src/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Clock, LogOut, Swords, Trophy, Hourglass, Users, FileText, Check, Settings, ShieldCheck, BarChart3 } from "lucide-react";
import { user, admin } from './api.js';

// Componentes
import ChallengesManager from './ChallengesManager.jsx'; 
import AdminValidation from './AdminValidation.jsx'; 
import AdminUsers from './AdminUsers.jsx';
import AdminChallenges from './AdminChallenges.jsx';
import AdminChallengeReport from './AdminChallengeReport.jsx';
import AdminSettings from './AdminSettings.jsx'; // <--- NOVO

// UI Components
const Card = ({ children, className="" }) => <div className={`theme-card ${className}`}>{children}</div>;
const Tag = ({ children, variant="default" }) => <span className={`tag tag-${variant}`}>{children}</span>;
const Button = ({ children, onClick, variant="primary", disabled, className="" }) => (
  <button onClick={onClick} disabled={disabled} className={`btn-${variant} ${className}`}>{children}</button>
);

const Stat = ({ icon: Icon, label, value, sub }) => (
  <Card className="!p-4 flex items-center gap-4">
    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
      <Icon size={24} />
    </div>
    <div>
      <div className="text-slate-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{sub}</div>}
    </div>
  </Card>
);

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
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-emerald-300 border border-slate-300 dark:border-emerald-800 hover:bg-slate-100 dark:hover:bg-emerald-900/30 transition-all duration-200">
          Sair <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

function UserDashboardContent({ currentUser, fetchProfile }) {
  // Estado agora usa 'amount' (quantidade) e 'unit' (unidade) em vez de 'hours' direto
  const [req, setReq] = useState({ type: "gozo", amount: 1, unit: "days", reason: "" });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState(10);
  const [convH, setConvH] = useState(1);

  const fetchRequests = async () => { try { const r = await user.getRequests(); setRequests(r.data); } catch (e) {} };
  useEffect(() => { 
      fetchRequests(); 
      admin.getSettings().then(r => setRate(r.data.points_per_hour)).catch(()=>{});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    
    // LÓGICA DE CONVERSÃO:
    // Se a unidade for 'days', multiplica por 8. Se for 'hours', mantém o valor.
    const finalHours = req.unit === 'days' ? req.amount * 8 : req.amount;

    try {
      // Envia sempre em horas para a API
      await user.createRequest(req.type, finalHours, req.reason);
      
      fetchRequests(); 
      setReq({ type: "gozo", amount: 1, unit: "days", reason: "" }); // Reset
      alert("Enviado com sucesso!"); 
    } catch (e) { 
      alert("Erro ao enviar."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleConvert = async () => { try { await user.convertPoints(convH); await fetchProfile(); alert("Convertido!"); } catch(e){alert("Erro");} };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {/* Widget Conversão */}
            <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30">
                <div className="flex justify-between mb-4">
                    <h2 className="text-emerald-900 dark:text-emerald-100 font-bold flex gap-2"><Hourglass size={20}/> Converter</h2>
                    <span className="text-xs font-bold bg-white dark:bg-black/20 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">1h = {rate}pts</span>
                </div>
                <div className="flex gap-3 items-end">
                    <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase">Horas</label><input type="number" min={1} value={convH} onChange={(e)=>setConvH(+e.target.value)} className="theme-input"/></div>
                    <div className="pb-3 text-sm font-bold text-slate-700 dark:text-emerald-200">Custo: {convH*rate} pts</div>
                    <Button onClick={handleConvert} disabled={currentUser.points < convH*rate} variant="success">Converter</Button>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-bold mb-4 flex gap-2 text-slate-800 dark:text-white"><FileText className="text-emerald-600"/> Novo Pedido</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Tipo</label>
                            <select value={req.type} onChange={(e)=>setReq({...req, type:e.target.value})} className="theme-input">
                                <option value="gozo">Folga</option>
                                <option value="concessao">Crédito</option>
                            </select>
                        </div>
                        
                        {/* SELEÇÃO DE QUANTIDADE E UNIDADE */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Qtd.</label>
                                <input 
                                    type="number" 
                                    min={0.5} 
                                    step={0.5} 
                                    value={req.amount} 
                                    onChange={(e)=>setReq({...req, amount:+e.target.value})} 
                                    className="theme-input"
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Unid.</label>
                                <select 
                                    value={req.unit} 
                                    onChange={(e)=>setReq({...req, unit:e.target.value})} 
                                    className="theme-input"
                                >
                                    <option value="days">Dias</option>
                                    <option value="hours">Horas</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Visual da Conversão */}
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded">
                        ℹ️ Você está solicitando: <b>{req.unit === 'days' ? req.amount * 8 : req.amount} horas</b> 
                        {req.unit === 'hours' && ` (${(req.amount / 8).toFixed(2)} dias)`}
                    </div>

                    <input value={req.reason} onChange={(e)=>setReq({...req, reason:e.target.value})} className="theme-input" placeholder="Motivo..." required/>
                    <Button type="submit" disabled={loading} className="w-full">Enviar Pedido</Button>
                </form>
            </Card>
        </div>
        <Card className="h-fit">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Histórico</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {requests.map(r => (
                    <div key={r.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50">
                        <div>
                            {/* Mostra Horas e Dias no Histórico */}
                            <div className="font-semibold text-sm text-slate-700 dark:text-emerald-200">
                                {r.type === 'gozo' ? 'Folga' : 'Crédito'} • {r.hours}h <span className="text-xs opacity-70">({(r.hours/8).toFixed(1)}d)</span>
                            </div>
                            <div className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                        <Tag variant={r.status === 'aprovado' ? 'success' : r.status === 'negado' ? 'danger' : 'pending'}>{r.status}</Tag>
                    </div>
                ))}
            </div>
        </Card>
      </div>
      <ChallengesManager currentUser={currentUser} />
    </div>
  );
}

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState([]);

  const fetchData = async () => { try { const r = await admin.getAllRequests(); setRequests(r.data); } catch (e) {} };
  useEffect(() => { fetchData(); }, []);

  const handleProcess = async (rid, status) => { try { await admin.processRequest(rid, status); fetchData(); } catch(e) { alert("Erro"); } };

  return (
    <>
      <div className="flex flex-wrap border-b border-slate-200 dark:border-emerald-900 mb-6 gap-1">
        {[
            {id: 'requests', label: 'Pedidos & Validação', icon: Clock},
            {id: 'users', label: 'Usuários', icon: Users},
            {id: 'challenges', label: 'Desafios', icon: Swords},
            {id: 'reports', label: 'Relatórios', icon: BarChart3},
            {id: 'config', label: 'Configurações', icon: Settings}, // <--- NOVA ABA
        ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-t-lg flex items-center gap-2 text-sm font-bold transition-all ${
                    activeTab === tab.id 
                    ? 'bg-white dark:bg-neutral-900 border-t border-x border-slate-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 shadow-sm -mb-px' 
                    : 'text-slate-500 dark:text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-300'
                }`}>
                <tab.icon size={16} /> {tab.label}
            </button>
        ))}
      </div>

      {activeTab === 'requests' && (
        <div className="space-y-6 animate-in fade-in">
            <Card>
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Pedidos de Horas</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr><th className="theme-table-head">Nome</th><th className="theme-table-head">Tipo</th><th className="theme-table-head">Horas</th><th className="theme-table-head">Status</th><th className="theme-table-head">Ação</th></tr>
                        </thead>
                        <tbody>
                            {requests.map(r => (
                                <tr key={r.id} className="theme-table-row">
                                    <td className="theme-table-cell font-medium">{r.profiles?.name}</td>
                                    <td className="theme-table-cell">{r.type}</td>
                                    <td className="theme-table-cell">{r.hours}h</td>
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
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'challenges' && <AdminChallenges />}
      {activeTab === 'reports' && <AdminChallengeReport />}
      {activeTab === 'config' && <AdminSettings />} {/* <--- NOVA TELA */}
    </>
  );
}

const Dashboard = ({ Page, currentUser, isAdmin, onLogout, fetchProfile }) => {
  if (!currentUser) return <Page><div className="text-center mt-20 animate-pulse">Carregando...</div></Page>;
  const days = (currentUser.hours / 8).toFixed(2);

  return (
    <Page>
      <Header user={currentUser} onLogout={onLogout} />
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Stat icon={Clock} label="Saldo de Horas" value={`${currentUser.hours} h`} sub={`${days} dias de folga`} />
        <Stat icon={Trophy} label="Meus Pontos" value={`${currentUser.points}`} sub="Disponíveis para troca" />
        {isAdmin 
            ? <Stat icon={ShieldCheck} label="Função" value="Administrador" sub="Acesso Total" />
            : <Stat icon={Users} label="Função" value={currentUser.role} sub="Colaborador" />
        }
      </div>
      {isAdmin ? <AdminDashboardContent /> : <UserDashboardContent currentUser={currentUser} fetchProfile={fetchProfile} />}
    </Page>
  );
};

export default Dashboard;