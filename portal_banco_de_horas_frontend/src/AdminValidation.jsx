// src/AdminValidation.jsx
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, LogOut } from "lucide-react";
import { admin } from './api.js';

// Componentes UI (ligados ao index.css)
const Card = ({ children, className = "" }) => <div className={`theme-card ${className}`}>{children}</div>;
const Tag = ({ children, variant="default" }) => <span className={`tag tag-${variant}`}>{children}</span>;
const Button = ({ children, onClick, className="" }) => <button onClick={onClick} className={`btn-icon ${className}`}>{children}</button>;

const AdminValidation = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const load = async () => { try { const r = await admin.getPendingValidations(); setList(r.data); } catch(e){} };
    useEffect(() => { load(); }, []);

    const validate = async (id, ok) => {
        setLoading(true); setMessage(null);
        try { 
            await admin.validateParticipant(id, ok); 
            await load();
            setMessage({ type: 'success', text: ok ? "Validado!" : "Recusado." });
        } catch (e) { setMessage({ type: 'error', text: "Erro." }); }
        finally { setLoading(false); }
    };

    return (
        <Card className="mt-6">
            <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="text-emerald-600 dark:text-emerald-400"/>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Validação de Desafios</h2>
            </div>
            
            {message && <div className={`mb-4 p-2 text-sm rounded-lg ${message.type==='success'?'tag-success':'tag-danger'}`}>{message.text}</div>}
            
            {list.length === 0 && <p className="text-slate-500 dark:text-neutral-400 text-sm py-2">Nenhuma prova pendente de validação.</p>}

            <div className="flex flex-col gap-3">
                {list.map(p => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950/50 transition-colors">
                        <div className="flex-1 min-w-[200px]">
                            <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{p.challenges?.title}</div>
                            <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                                Servidor: <b>{p.profiles?.name}</b> • <span className="opacity-80">{p.profiles?.role}</span>
                            </div>
                            <div className="mt-1">
                                {p.proof_url ? (
                                    <a href={p.proof_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">Ver Prova (Link)</a>
                                ) : <span className="text-xs text-red-400">Sem link</span>}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-2 sm:mt-0">
                            <button onClick={()=>validate(p.id, true)} disabled={loading} className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold text-xs flex items-center gap-1">
                                <Check size={14}/> Aceitar
                            </button>
                            <button onClick={()=>validate(p.id, false)} disabled={loading} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs flex items-center gap-1">
                                <LogOut size={14} className="rotate-180"/> Recusar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default AdminValidation;