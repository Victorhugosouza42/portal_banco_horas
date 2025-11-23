// src/AdminValidation.jsx
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, LogOut, Swords, Trophy } from "lucide-react";
import { admin } from './api.js'; // <-- CORRIGIDO

// --- Componentes UI (Reutilizados) ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-neutral-900 border border-emerald-900/40 rounded-2xl shadow-xl p-5 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", disabled, type = "button", className = "" }) => {
  const base = "px-3 py-1 rounded-lg font-medium transition transform active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed text-xs";
  const variants = {
    success: "bg-green-700/90 text-white hover:bg-green-600",
    danger: "bg-red-600/90 text-white hover:bg-red-600",
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
    success: "bg-green-800/50 text-green-200 border border-green-700",
    danger: "bg-red-800/50 text-red-200 border border-red-700",
  }
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
};

// --- Componente Principal ---

const AdminValidation = () => {
    const [pendingProofs, setPendingProofs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchPendingProofs = async () => {
        try {
            const response = await admin.getPendingValidations();
            setPendingProofs(response.data);
        } catch (e) {
            console.error("Erro ao buscar provas pendentes:", e);
            setMessage({type: 'error', text: "Erro ao carregar lista de provas."});
        }
    };

    useEffect(() => {
        fetchPendingProofs();
    }, []);

    const handleValidation = async (participantId, approved) => {
        setLoading(true);
        setMessage(null);
        try {
            await admin.validateParticipant(participantId, approved);
            await fetchPendingProofs(); 
            setMessage({ 
                type: 'success', 
                text: approved ? "Prova validada e pontos atribuídos!" : "Prova recusada." 
            });
        } catch (e) {
            const detail = e.response?.data?.detail || "Erro na validação.";
            setMessage({ type: 'error', text: detail.replace("Exception: ", "") });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="mt-4">
            <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="text-emerald-400"/>
                <h2 className="text-emerald-100 font-semibold">Validação de Desafios</h2>
            </div>
            {message && (
                <div className={`p-3 rounded-lg mb-3 text-sm ${message.type === 'success' ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                    {message.text}
                </div>
            )}
            
            {pendingProofs.length === 0 && (
                <p className="text-neutral-400">Nenhuma prova pendente de validação.</p>
            )}

            <div className="mt-2 flex flex-col gap-3">
                {pendingProofs.map((p) => (
                    <div key={p.id} className="flex flex-wrap items-center justify-between bg-neutral-950/50 p-3 rounded-lg border border-neutral-800">
                        
                        {/* Detalhes do Pedido */}
                        <div className="flex-1 min-w-[250px]">
                            <div className="text-emerald-200 font-semibold text-sm">
                                {p.challenges?.title || 'Desafio Desconhecido'} ({p.challenges?.points} pts)
                            </div>
                            <div className="text-neutral-300 text-xs mt-1">
                                Servidor: {p.profiles?.name || 'N/A'} ({p.profiles?.role})
                            </div>
                            <div className="text-neutral-400 text-xs">
                                Status: <Tag variant="pending">{p.status}</Tag>
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                            {p.proof_url && (
                                <a className="text-emerald-300 hover:text-emerald-100 underline text-xs" href={p.proof_url} target="_blank" rel="noreferrer">
                                    Ver Prova (URL)
                                </a>
                            )}
                            <Button 
                                variant="success" 
                                onClick={() => handleValidation(p.id, true)} 
                                disabled={loading}
                            >
                                <Check size={14} className="inline mr-1"/> Validar
                            </Button>
                            <Button 
                                variant="danger" 
                                onClick={() => handleValidation(p.id, false)} 
                                disabled={loading}
                            >
                                <LogOut size={14} className="rotate-180"/> Recusar
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default AdminValidation;