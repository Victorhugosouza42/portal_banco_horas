// src/ChallengesManager.jsx
import React, { useState, useEffect } from 'react';
import { Swords, Users, Upload, CheckCircle, Clock } from "lucide-react";
import { challenge, user } from './api.js';

const Card = ({ children, className = "" }) => <div className={`bg-neutral-900 border border-emerald-900/40 rounded-2xl shadow-xl p-5 ${className}`}>{children}</div>;
const Button = ({ children, onClick, variant = "primary", disabled, className = "" }) => {
    const colors = {
        primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
        subtle: "bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/50",
    };
    return <button onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-xl font-medium transition ${colors[variant]} disabled:opacity-50 ${className}`}>{children}</button>;
};
const Tag = ({ children }) => <span className="bg-emerald-900 text-emerald-200 px-2 py-1 rounded text-xs border border-emerald-700">{children}</span>;

function formatDuration(d) { return d ? new Date(d).toLocaleDateString() : "Sem prazo"; }

const ChallengesManager = ({ currentUser }) => {
  const [challenges, setChallenges] = useState([]);
  const [participations, setParticipations] = useState([]); // Lista do que eu já me inscrevi
  const [proofUrl, setProofUrl] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Busca Desafios e Minhas Inscrições em paralelo
      const [chalRes, partRes] = await Promise.all([
        challenge.getAll(),
        user.getParticipations()
      ]);

      const allChallenges = chalRes.data;
      const myParts = partRes.data;

      // 2. Filtra visíveis
      const visible = allChallenges.filter(c => {
        const roles = c.allowed_roles || [];
        const ids = c.allowed_user_ids || [];
        if (roles.length === 0 && ids.length === 0) return true;
        return roles.includes(currentUser.role) || ids.includes(currentUser.id);
      });

      setChallenges(visible);
      setParticipations(myParts); // Guarda as inscrições para comparar depois

    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, [currentUser]);

  const handleEnroll = async (cid) => {
    setLoading(true);
    try { 
        await challenge.enroll(cid); 
        await fetchData(); // Recarrega tudo para atualizar o botão
        alert("Inscrição realizada com sucesso!"); 
    } catch (e) { alert("Erro ao inscrever"); }
    finally { setLoading(false); }
  };

  const handleProof = async (cid) => {
    if(!proofUrl[cid]) return alert("Cole o link!");
    setLoading(true);
    try { 
        await challenge.submitProof(cid, proofUrl[cid]); 
        await fetchData(); // Recarrega para mudar status
        alert("Prova enviada!"); 
    } catch (e) { alert("Erro ao enviar"); }
    finally { setLoading(false); }
  };

  // Função para verificar se estou inscrito neste desafio específico
  const getMyStatus = (challengeId) => {
      return participations.find(p => p.challenge_id === challengeId);
  };

  return (
    <Card className="mt-4">
      <div className="flex items-center gap-2 mb-3"><Swords className="text-emerald-400"/><h2 className="text-emerald-100 font-semibold">Desafios Disponíveis</h2></div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {challenges.length === 0 && <p className="text-neutral-400">Nenhum desafio encontrado.</p>}
        
        {challenges.map((c) => {
            const myPart = getMyStatus(c.id); // Verifica minha participação neste card
            const isOverdue = c.due_at && new Date() > new Date(c.due_at);

            return (
                <div key={c.id} className="p-4 rounded-xl border border-emerald-800 bg-neutral-900/40 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                        <h3 className="text-emerald-100 font-semibold">{c.title}</h3>
                        <Tag>{c.points} pts</Tag>
                    </div>
                    <p className="text-neutral-300 text-sm mt-2">{c.description}</p>
                    <div className="text-xs text-neutral-400 mt-2 mb-4">Prazo: {formatDuration(c.due_at)}</div>
                  </div>
                  
                  {/* LÓGICA DE EXIBIÇÃO DOS BOTÕES */}
                  <div className="mt-auto">
                      
                      {/* Caso 1: Não inscrito */}
                      {!myPart && !isOverdue && (
                          <Button onClick={() => handleEnroll(c.id)} disabled={loading} className="w-full">
                              Inscrever-se
                          </Button>
                      )}

                      {/* Caso 2: Inscrito (Pode enviar prova) */}
                      {myPart && myPart.status === 'inscrito' && (
                          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle size={12}/> Você está inscrito! Envie a prova:
                            </div>
                            <div className="flex gap-2">
                                <input className="bg-neutral-950 text-white border border-emerald-800 p-2 rounded-lg w-full text-sm focus:outline-none focus:border-emerald-500" 
                                    placeholder="Cole o link (Drive/Docs)" 
                                    value={proofUrl[c.id] || ''}
                                    onChange={e => setProofUrl({...proofUrl, [c.id]: e.target.value})} />
                                <button onClick={() => handleProof(c.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg text-sm font-medium">
                                    Enviar
                                </button>
                            </div>
                          </div>
                      )}

                      {/* Caso 3: Enviado ou Validado */}
                      {myPart && myPart.status !== 'inscrito' && (
                          <div className={`p-2 rounded-lg text-center text-sm font-semibold border
                            ${myPart.status === 'enviado' ? 'bg-yellow-900/30 text-yellow-200 border-yellow-800' : 'bg-green-900/30 text-green-200 border-green-800'}`}>
                              Status: {myPart.status.toUpperCase()}
                          </div>
                      )}

                      {/* Caso 4: Prazo acabou e não inscrito */}
                      {!myPart && isOverdue && (
                          <div className="text-center text-red-400 text-sm p-2 border border-red-900/50 rounded-lg bg-red-900/20">
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