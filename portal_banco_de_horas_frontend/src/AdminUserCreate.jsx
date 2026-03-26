// src/AdminUserCreate.jsx
import React, { useState, useEffect } from 'react';
import { UserPlus, Save } from 'lucide-react';
import { auth, getPublicRoles } from './api';

const AdminUserCreate = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPublicRoles().then(r => {
      setRoles(r.data);
      if (r.data.length > 0) setForm(f => ({ ...f, role: r.data[0].name }));
    }).catch(e => console.error(e));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");
    setLoading(true);
    try {
      await auth.signup(form.name, form.role, form.email, form.password);
      alert("Usuário criado com sucesso!");
      // Reset only name, email and password. Keep the role as the selected one.
      setForm({ ...form, name: '', email: '', password: '' });
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao criar usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-card mt-4 animate-in fade-in duration-500 max-w-2xl">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-emerald-900/30 pb-4">
        <UserPlus className="text-emerald-600 dark:text-emerald-400" size={24} />
        <h2 className="text-emerald-900 dark:text-emerald-100 font-semibold text-xl">Cadastrar Novo Usuário</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Nome Completo</label>
          <input required className="theme-input w-full" placeholder="Ex: João Silva" value={form.name} onChange={e => setForm({...form, name: e.target.value})} autoComplete="nome-novo-usuario" />
        </div>
        
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">E-mail</label>
          <input type="email" required className="theme-input w-full" placeholder="Ex: joao@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} autoComplete="email-novo-usuario" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
            <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Senha Provisória</label>
            <input type="password" required className="theme-input w-full" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm({...form, password: e.target.value})} autoComplete="new-password" />
            </div>

            <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mb-1 block">Cargo Inicial</label>
            <select required className="theme-input w-full cursor-pointer" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                {roles.length === 0 && <option disabled value="">A carregar...</option>}
                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
            </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-6 py-3">
          <Save size={18} /> {loading ? "A criar usuário..." : "Cadastrar Usuário"}
        </button>
      </form>
    </div>
  );
};

export default AdminUserCreate;
