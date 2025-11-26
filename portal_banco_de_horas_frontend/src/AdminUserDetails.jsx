// src/AdminUserDetails.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, PlusCircle, History } from "lucide-react";
import { admin } from './api';

const Tag = ({ children, variant="default" }) => {
    const v = {
      success: "bg-emerald-100 text-emerald-700 border-emerald-200",
      pending: "bg-amber-50 text-amber-600 border-amber-200",
      danger: "bg-red-50 text-red-600 border-red-200",
      default: "bg-slate-100 text-slate-600 border-slate-200"
    }
    return <span className={`px-2 py-0.5 rounded text-xs border font-bold ${v[variant]||v.default}`}>{children}</span>;
};

const AdminUserDetails = ({ user, onBack }) => {
    const [history, setHistory] = useState([]);
    
    // Novo estado para controlar valor e unidade
    const [amount, setAmount] = useState(0);
    const [unit, setUnit] = useState("hours"); // 'hours' ou 'days'
    
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const loadHistory = async () => {
        try {
            const res = await admin.getUserRequests(user.id);
            setHistory(res.data);
        } catch(e) { console.error(e); }
    };

    useEffect(() => { loadHistory(); }, [user]);

    const handleAdjust = async (e) => {
        e.preventDefault();
        if (amount === 0) return alert("Digite um valor.");
        if (!reason) return alert("Motivo é obrigatório para auditoria.");
        
        setLoading(true);
        
        // LÓGICA DE CONVERSÃO
        // Se selecionou dias, multiplica por 8. Se for horas, mantém.
        const hoursToSend = unit === 'days' ? amount * 8 : amount;

        try {
            await admin.adjustUserHours(user.id, parseInt(hoursToSend), reason);
            alert(`Ajuste realizado! (${hoursToSend} horas registadas)`);
            setAmount(0);
            setReason("");
            loadHistory();
        } catch (e) {
            alert("Erro ao ajustar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition">
                    <ArrowLeft className="text-slate-600 dark:text-slate-300" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
                    <p className="text-slate-500 dark:text-neutral-400 text-sm">{user.role} • {user.email}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                
                {/* Painel de Ajuste Manual */}
                <div className="theme-card h-fit">
                    <h3 className="font-bold text-lg mb-4 flex gap-2 text-slate-800 dark:text-white">
                        <PlusCircle className="text-emerald-600"/> Ajuste Manual
                    </h3>
                    <form onSubmit={handleAdjust} className="space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Quantidade</label>
                                <input 
                                    type="number" 
                                    step="0.5"
                                    className="theme-input" 
                                    placeholder="Ex: 1 ou -1"
                                    value={amount} onChange={e=>setAmount(e.target.value)} 
                                />
                            </div>
                            <div className="w-1/3">
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Unidade</label>
                                <select className="theme-input" value={unit} onChange={e=>setUnit(e.target.value)}>
                                    <option value="hours">Horas</option>
                                    <option value="days">Dias</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Feedback */}
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Isso ajustará: <b>{unit === 'days' ? amount * 8 : amount} horas</b> no saldo.
                            <br/>(Use negativos para remover).
                        </p>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Motivo (Obrigatório)</label>
                            <input className="theme-input" 
                                placeholder="Ex: Compensação..."
                                value={reason} onChange={e=>setReason(e.target.value)} />
                        </div>
                        <button disabled={loading} className="btn-primary w-full justify-center">
                            {loading ? "Processando..." : "Aplicar Ajuste"}
                        </button>
                    </form>
                </div>

                {/* Histórico */}
                <div className="theme-card">
                    <h3 className="font-bold text-lg mb-4 flex gap-2 text-slate-800 dark:text-white">
                        <History className="text-blue-600"/> Histórico
                    </h3>
                    <div className="overflow-y-auto max-h-[400px] space-y-2 pr-2">
                        {history.length === 0 && <p className="text-slate-400 text-center py-4">Sem histórico.</p>}
                        {history.map(h => (
                            <div key={h.id} className="p-3 rounded-lg bg-slate-50 dark:bg-neutral-950 border border-slate-100 dark:border-emerald-900/20 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-slate-700 dark:text-emerald-100">
                                        {h.type === 'concessao' ? '+ Crédito' : '- Folga'} 
                                        <span className="ml-1">({h.hours}h / {(h.hours/8).toFixed(1)}d)</span>
                                    </div>
                                    <div className="text-xs text-slate-500">{h.reason}</div>
                                    <div className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleDateString()}</div>
                                </div>
                                <Tag variant={h.status==='aprovado'?'success':h.status==='negado'?'danger':'pending'}>{h.status}</Tag>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserDetails;