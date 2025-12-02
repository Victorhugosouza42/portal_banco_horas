// src/ChallengesManager.jsx
import React, { useState, useEffect } from 'react';
import { Swords, Users, Upload, CheckCircle, Clock } from "lucide-react";
import { challenge, user } from './api.js';

// --- UI Components (Adaptados ao Tema Claro/Escuro) ---

// 1. O Card principal agora usa 'theme-card' para ficar Branco/Preto automaticamente
const Card = ({ children, className = "" }) => (
  <div className={`theme-card ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", disabled, className = "" }) => {
    const colors = {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700",
        subtle: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50",
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-xl font-medium transition ${colors[variant]} disabled:opacity-50 ${className}`}>
            {children}
        </button>
    );
};

const Tag = ({ children }) => (
    <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700 px-2 py-1 rounded text-xs font-bold">
        {children}
    </span>
);

function formatDuration(d) { return d ? new Date(d).toLocaleDateString() : "Sem prazo"; }

// --- Componente Principal ---

const ChallengesManager = ({ currentUser }) => {
  const [challenges, setChallenges] = useState([]);
  const [participations, setParticipations] = useState([]); 
  const [proofUrl, setProofUrl] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [chalRes, partRes] = await Promise.all([
        challenge.getAll(),
        user.getParticipations()
      ]);

      const allChallenges = chalRes.data;
      const myParts = partRes.data;

      const visible = allChallenges.filter(c => {
        const roles = c.allowed_roles || [];
        const ids = c.allowed_user_ids || [];
        if (roles.length === 0 && ids.length === 0) return true;
        return roles.includes(currentUser.role) || ids.includes(currentUser.id);
      });

      setChallenges(visible);
      setParticipations(myParts); 

    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, [currentUser]);

  const handleEnroll = async (cid) => {
    setLoading(true);
    try { await challenge.enroll(cid); await fetchData(); alert("Inscrição realizada!"); } 
    catch (e) { alert("Erro ao inscrever"); }
    finally { setLoading(false); }
  };

  const handleProof = async (cid) => {
    if(!proofUrl[cid]) return alert("Cole o link!");
    setLoading(true);
    try { await challenge.submitProof(cid, proofUrl[cid]); await fetchData(); alert("Prova enviada!"); } 
    catch (e) { alert("Erro ao enviar"); }
    finally { setLoading(false); }
  };

  const getMyStatus = (challengeId) => {
      return participations.find(p => p.challenge_id === challengeId);
  };

  return (
    <Card className="mt-6">
      <div className="flex items-center gap-2 mb-4">
          <Swords className="text-emerald-600 dark:text-emerald-400"/>
          <h2 className="text-lg font-bold text-slate-800 dark:text-emerald-100">Desafios Disponíveis</h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {challenges.length === 0 && (
            <p className="text-slate-500 dark:text-neutral-400 text-sm italic">Nenhum desafio encontrado para o seu perfil.</p>
        )}
        
        {challenges.map((c) => {
            const myPart = getMyStatus(c.id);
            const isOverdue = c.due_at && new Date() > new Date(c.due_at);

            return (
                // 2. O Cartão interno também foi ajustado para cores claras/escuras
                <div key={c.id} className="p-5 rounded-xl border border-slate-200 dark:border-emerald-800 bg-slate-50 dark:bg-neutral-900/40 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-emerald-100">{c.title}</h3>
                        <Tag>{c.points} pts</Tag>
                    </div>
                    <p className="text-slate-600 dark:text-neutral-300 text-sm mb-3">{c.description}</p>
                    <div className="text-xs text-slate-500 dark:text-neutral-400 mb-4 flex items-center gap-1">
                        <Clock size={12}/> Prazo: {formatDuration(c.due_at)}
                    </div>
                  </div>
                  
                  <div className="mt-auto border-t border-slate-200 dark:border-emerald-900/50 pt-3">
                      {/* Caso 1: Não inscrito */}
                      {!myPart && !isOverdue && (
                          <Button onClick={() => handleEnroll(c.id)} disabled={loading} className="w-full">
                              Inscrever-se
                          </Button>
                      )}

                      {/* Caso 2: Inscrito (Enviar Prova) */}
                      {myPart && myPart.status === 'inscrito' && (
                          <div className="flex flex-col gap-2">
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle size={12}/> Inscrito! Envie a prova:
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    className="theme-input !py-1.5 text-xs" // Usa a classe global theme-input
                                    placeholder="Link (Drive/Docs)" 
                                    value={proofUrl[c.id] || ''}
                                    onChange={e => setProofUrl({...proofUrl, [c.id]: e.target.value})} 
                                />
                                <button onClick={() => handleProof(c.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 rounded-lg text-xs font-bold">
                                    Enviar
                                </button>
                            </div>
                          </div>
                      )}

                      {/* Caso 3: Status Final */}
                      {myPart && myPart.status !== 'inscrito' && (
                          <div className={`p-2 rounded-lg text-center text-xs font-bold border uppercase tracking-wide
                            ${myPart.status === 'enviado' 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800'
                            }`}>
                              Status: {myPart.status}
                          </div>
                      )}

                      {!myPart && isOverdue && (
                          <div className="text-center text-red-500 dark:text-red-400 text-xs font-medium p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              Inscrições Encerradas
                          </div>
                      )}
                  </div>
                </div>
            );
        })}
      </div>
    </Card>
  );
};

export default ChallengesManager;