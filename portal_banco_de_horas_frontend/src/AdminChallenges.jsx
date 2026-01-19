// src/AdminChallenges.jsx
import React, { useState, useEffect } from 'react';
import { Swords, Trash2, Plus, Users, X, Trophy, Calendar, Target } from "lucide-react";
import { admin, challenge as challengeApi } from './api';

const AdminChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estado para o Modal de Participantes
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  // Formulário de Novo Desafio
  const [form, setForm] = useState({ title: "", description: "", points: 10, audience: "Todos", due_at: "" });

  const fetchData = async () => {
    try {
      // Buscamos os desafios e TODAS as participações para cruzar os dados
      const [cRes, pRes] = await Promise.all([
        challengeApi.getAll(),
        admin.getAllParticipations()
      ]);
      setChallenges(cRes.data);
      setParticipations(pRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Tem a certeza? Isso apagará o histórico deste desafio.")) return;
    try {
      await admin.deleteChallenge(id);
      fetchData();
    } catch (e) { alert("Erro ao apagar."); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title) return alert("Preencha o título.");
    setLoading(true);
    try {
      await admin.createChallenge(form);
      setForm({ title: "", description: "", points: 10, audience: "Todos", due_at: "" });
      fetchData();
    } catch (e) { alert("Erro ao criar."); }
    finally { setLoading(false); }
  };

  // Filtra participantes do desafio selecionado
  const getChallengeParticipants = (challengeId) => {
    return participations.filter(p => p.challenge_id === challengeId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Formulário de Criação */}
      <div className="theme-card">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex gap-2">
            <Plus className="text-emerald-600"/> Novo Desafio
        </h3>
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2 items-end">
            <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Título</label>
                <input className="theme-input" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Ex: Doar Sangue..." />
            </div>
            <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
                <textarea className="theme-input" rows="2" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Detalhes do desafio..." />
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Pontos</label>
                <input type="number" className="theme-input" value={form.points} onChange={e=>setForm({...form, points:e.target.value})} />
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Público Alvo</label>
                <select className="theme-input" value={form.audience} onChange={e=>setForm({...form, audience:e.target.value})}>
                    <option>Todos</option>
                    <option>Analista</option>
                    <option>Técnico</option>
                    <option>Estagiário</option>
                </select>
            </div>
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Prazo (Opcional)</label>
                <input type="date" className="theme-input" value={form.due_at} onChange={e=>setForm({...form, due_at:e.target.value})} />
            </div>
            <button disabled={loading} className="btn-primary flex justify-center items-center gap-2 h-[42px]">
                <Swords size={18}/> Criar Desafio
            </button>
        </form>
      </div>

      {/* 2. Lista de Desafios */}
      <div className="theme-card">
        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex gap-2">
            <Trophy className="text-amber-500"/> Desafios Ativos
        </h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className="theme-table-head">Título</th>
                        <th className="theme-table-head">Pontos</th>
                        <th className="theme-table-head">Prazo</th>
                        <th className="theme-table-head">Público</th>
                        <th className="theme-table-head text-center">Inscritos</th>
                        <th className="theme-table-head text-right">Ação</th>
                    </tr>
                </thead>
                <tbody>
                    {challenges.map(c => {
                        const count = getChallengeParticipants(c.id).length;
                        return (
                            <tr key={c.id} className="theme-table-row">
                                <td className="theme-table-cell font-medium">{c.title}</td>
                                <td className="theme-table-cell font-bold text-emerald-600">{c.points} pts</td>
                                <td className="theme-table-cell text-xs text-slate-500">
                                    {c.due_at ? new Date(c.due_at).toLocaleDateString() : '-'}
                                </td>
                                <td className="theme-table-cell"><span className="tag tag-default">{c.audience}</span></td>
                                
                                {/* COLUNA NOVA: Botão de Participantes */}
                                <td className="theme-table-cell text-center">
                                    <button 
                                        onClick={() => setSelectedChallenge(c)}
                                        className="hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 mx-auto transition-colors"
                                    >
                                        <Users size={14}/> {count}
                                    </button>
                                </td>

                                <td className="theme-table-cell text-right">
                                    <button onClick={()=>handleDelete(c.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors">
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {challenges.length === 0 && (
                        <tr><td colSpan="6" className="text-center py-8 text-slate-400">Nenhum desafio criado.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* 3. MODAL DE PARTICIPANTES */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-emerald-900 overflow-hidden flex flex-col max-h-[80vh]">
                
                {/* Header do Modal */}
                <div className="p-4 border-b border-slate-100 dark:border-emerald-900/30 flex justify-between items-center bg-slate-50 dark:bg-neutral-950">
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">Inscritos</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px]">{selectedChallenge.title}</p>
                    </div>
                    <button onClick={() => setSelectedChallenge(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-full text-slate-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Lista de Pessoas */}
                <div className="p-4 overflow-y-auto space-y-2">
                    {getChallengeParticipants(selectedChallenge.id).length === 0 ? (
                        <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-2">
                            <Users size={32} opacity={0.5}/>
                            <p>Ninguém se inscreveu ainda.</p>
                        </div>
                    ) : (
                        getChallengeParticipants(selectedChallenge.id).map(p => (
                            <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-neutral-950/50 rounded-lg border border-slate-100 dark:border-emerald-900/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                                        {p.profiles?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-700 dark:text-emerald-100">{p.profiles?.name || 'Usuário'}</div>
                                        <div className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                
                                {/* Status do Participante */}
                                <div>
                                    {p.status === 'inscrito' && <span className="tag bg-slate-200 text-slate-600">Inscrito</span>}
                                    {p.status === 'enviado' && <span className="tag bg-amber-100 text-amber-700">Aguardando</span>}
                                    {p.status === 'validado' && <span className="tag tag-success">Concluído</span>}
                                    {p.status === 'rejeitado' && <span className="tag tag-danger">Recusado</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default AdminChallenges;