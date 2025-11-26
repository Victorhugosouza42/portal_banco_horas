// src/AdminChallenges.jsx
import React, { useState, useEffect } from 'react';
import { Swords, Plus, Trash2, X } from "lucide-react";
import { admin, challenge, getPublicRoles } from './api'; // Importar getPublicRoles

const AdminChallenges = () => {
  const [form, setForm] = useState({ title: "", description: "", points: 10, allowed_roles: [], due_at: "" });
  const [existingChallenges, setExistingChallenges] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]); // Cargos vindos do DB
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
      try {
          const [cRes, rRes] = await Promise.all([challenge.getAll(), getPublicRoles()]);
          setExistingChallenges(cRes.data);
          setAvailableRoles(rRes.data);
      } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const addRole = (role) => {
    if (!role) return;
    if (!form.allowed_roles.includes(role)) setForm({ ...form, allowed_roles: [...form.allowed_roles, role] });
  };

  const removeRole = (r) => setForm({ ...form, allowed_roles: form.allowed_roles.filter(x => x !== r) });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, points: +form.points, allowed_roles: form.allowed_roles, due_at: form.due_at || null };
      await admin.createChallenge(payload); alert("Criado!"); setForm({ title: "", description: "", points: 10, allowed_roles: [], due_at: "" }); fetchData();
    } catch (err) { alert("Erro."); } finally { setLoading(false); }
  };

  const handleDelete = async (id) => { if(confirm("Excluir?")) { await admin.deleteChallenge(id); fetchData(); } };

  return (
    <div className="space-y-6">
        <div className="theme-card mt-4">
            <div className="flex items-center gap-2 mb-4">
                <Swords className="text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-emerald-900 dark:text-emerald-100 font-semibold text-lg">Criar Novo Desafio</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Título</label><input placeholder="Ex: Organização" required className="theme-input" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Pontos</label><input type="number" placeholder="10" required className="theme-input" value={form.points} onChange={e=>setForm({...form, points: e.target.value})} /></div>
                </div>
                <div><label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Descrição</label><textarea placeholder="Detalhes..." required className="theme-input h-24 resize-none" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} /></div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Público Alvo</label>
                        <select className="theme-input w-full cursor-pointer mb-2" value="" onChange={(e) => addRole(e.target.value)}>
                            <option value="" disabled>Adicionar Cargo...</option>
                            {availableRoles.map(role => <option key={role.id} value={role.name}>{role.name}</option>)}
                        </select>
                        <div className="flex flex-wrap gap-2 min-h-[30px]">
                            {form.allowed_roles.length === 0 && <span className="text-xs text-slate-400 italic py-1">Todos podem ver</span>}
                            {form.allowed_roles.map(role => (
                                <span key={role} className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-md border border-emerald-200 dark:border-emerald-800">
                                    {role} <button type="button" onClick={() => removeRole(role)} className="hover:text-red-500"><X size={14} /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Prazo (Opcional)</label>
                        <input type="datetime-local" className="theme-input" value={form.due_at} onChange={e=>setForm({...form, due_at: e.target.value})} />
                    </div>
                </div>
                <button disabled={loading} className="btn-primary w-full justify-center mt-4"><Plus size={18}/> {loading ? "..." : "Lançar"}</button>
            </form>
        </div>

        <div className="theme-card">
            <h3 className="text-emerald-900 dark:text-emerald-100 font-semibold mb-4">Desafios em Andamento</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead><tr><th className="theme-table-head">Título</th><th className="theme-table-head">Pontos</th><th className="theme-table-head">Prazo</th><th className="theme-table-head">Público</th><th className="theme-table-head">Ação</th></tr></thead>
                    <tbody>
                        {existingChallenges.map(c => (
                            <tr key={c.id} className="theme-table-row">
                                <td className="theme-table-cell font-bold">{c.title}</td>
                                <td className="theme-table-cell">{c.points}</td>
                                <td className="theme-table-cell">{c.due_at ? new Date(c.due_at).toLocaleDateString() : '-'}</td>
                                <td className="theme-table-cell text-xs">{c.allowed_roles?.join(', ') || 'Todos'}</td>
                                <td className="theme-table-cell"><button onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg"><Trash2 size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
export default AdminChallenges;