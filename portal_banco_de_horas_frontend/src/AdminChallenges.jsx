// src/AdminChallenges.jsx
import React, { useState, useEffect } from 'react';
import { Swords, Plus, Trash2 } from "lucide-react";
import { admin, challenge } from './api';

const AdminChallenges = () => {
  const [form, setForm] = useState({ title: "", description: "", points: 10, allowed_roles: "", due_at: "" });
  const [existingChallenges, setExistingChallenges] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChallenges = async () => {
      try {
          const res = await challenge.getAll();
          setExistingChallenges(res.data);
      } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchChallenges(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { 
        ...form, 
        points: parseInt(form.points),
        allowed_roles: form.allowed_roles.length ? form.allowed_roles.split(',').map(r=>r.trim()) : [],
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null 
      };
      
      await admin.createChallenge(payload);
      alert("Desafio criado com sucesso!");
      setForm({ title: "", description: "", points: 10, allowed_roles: "", due_at: "" });
      fetchChallenges();
    } catch (err) { alert("Erro ao criar desafio."); } 
    finally { setLoading(false); }
  };

  // NOVA FUNÇÃO: EXCLUIR DESAFIO
  const handleDelete = async (id) => {
      if (!confirm("Tem certeza que deseja excluir este desafio?")) return;
      try {
          await admin.deleteChallenge(id);
          fetchChallenges(); // Atualiza a lista
      } catch (e) { alert("Erro ao excluir."); }
  };

  return (
    <div className="space-y-6">
        {/* FORM DE CRIAÇÃO (Igual a antes) */}
        <div className="bg-neutral-900 border border-emerald-900/40 rounded-2xl p-5 mt-4">
        <div className="flex items-center gap-2 mb-4">
            <Swords className="text-emerald-400" />
            <h2 className="text-emerald-100 font-semibold">Criar Novo Desafio</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
            <input placeholder="Título do Desafio" required className="bg-neutral-950 border border-emerald-800 p-2 rounded text-white"
                value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
            
            <input type="number" placeholder="Pontos" required className="bg-neutral-950 border border-emerald-800 p-2 rounded text-white"
                value={form.points} onChange={e=>setForm({...form, points: e.target.value})} />
            </div>
            <textarea placeholder="Descrição completa..." required className="w-full bg-neutral-950 border border-emerald-800 p-2 rounded text-white h-20"
                value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
            <div className="grid md:grid-cols-2 gap-4">
            <input placeholder="Cargos permitidos (sep. vírgula)" className="bg-neutral-950 border border-emerald-800 p-2 rounded text-white"
                value={form.allowed_roles} onChange={e=>setForm({...form, allowed_roles: e.target.value})} />
            <div className="flex flex-col">
                <label className="text-xs text-neutral-400 mb-1">Prazo Limite (Opcional)</label>
                <input type="datetime-local" className="bg-neutral-950 border border-emerald-800 p-2 rounded text-white text-sm"
                value={form.due_at} onChange={e=>setForm({...form, due_at: e.target.value})} />
            </div>
            </div>
            <button disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded flex items-center gap-2 w-full justify-center">
            <Plus size={18}/> {loading ? "Criando..." : "Lançar Desafio"}
            </button>
        </form>
        </div>

        {/* LISTA COM BOTÃO DE EXCLUIR */}
        <div className="bg-neutral-900 border border-emerald-900/40 rounded-2xl p-5">
            <h3 className="text-emerald-100 font-semibold mb-4">Desafios em Andamento</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-neutral-300">
                    <thead className="text-emerald-200 border-b border-emerald-800">
                        <tr>
                            <th className="p-2">Título</th>
                            <th>Pontos</th>
                            <th>Prazo</th>
                            <th>Público</th>
                            <th>Ação</th> {/* Nova Coluna */}
                        </tr>
                    </thead>
                    <tbody>
                        {existingChallenges.map(c => (
                            <tr key={c.id} className="border-b border-emerald-900/20 hover:bg-neutral-800/30">
                                <td className="p-2 font-medium">{c.title}</td>
                                <td>{c.points}</td>
                                <td>{c.due_at ? new Date(c.due_at).toLocaleDateString() : 'Sem prazo'}</td>
                                <td>{c.allowed_roles?.join(', ') || 'Todos'}</td>
                                <td>
                                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-400 p-1" title="Excluir">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {existingChallenges.length === 0 && (
                            <tr><td colSpan="5" className="p-4 text-center text-neutral-500">Nenhum desafio criado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default AdminChallenges;