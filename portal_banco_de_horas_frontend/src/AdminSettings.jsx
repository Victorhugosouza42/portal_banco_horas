// src/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { Settings, Trash2, Plus } from "lucide-react";
import { admin, getPublicRoles } from './api';

const AdminSettings = () => {
    const [rate, setRate] = useState(0);
    const [roles, setRoles] = useState([]);
    const [newRole, setNewRole] = useState("");
    const [loading, setLoading] = useState(false);

    const load = async () => {
        try {
            const [s, r] = await Promise.all([admin.getSettings(), getPublicRoles()]);
            setRate(s.data.points_per_hour);
            setRoles(r.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { load(); }, []);

    const saveRate = async () => {
        try { await admin.updateSettings(parseInt(rate)); alert("Taxa atualizada!"); } catch(e){alert("Erro");}
    };

    const handleAddRole = async (e) => {
        e.preventDefault();
        if (!newRole) return;
        setLoading(true);
        try { await admin.addRole(newRole); setNewRole(""); load(); } catch(e){alert("Erro ao adicionar.");}
        finally { setLoading(false); }
    };

    const handleDeleteRole = async (id) => {
        if(!confirm("Excluir cargo?")) return;
        try { await admin.deleteRole(id); load(); } catch(e){alert("Erro.");}
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            
            {/* Configuração da Taxa */}
            <div className="theme-card mt-4">
                <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex gap-2">
                    <Settings className="text-emerald-600"/> Configuração Global
                </h2>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Taxa de Conversão (Pontos por 1 Hora)</label>
                        <input type="number" className="theme-input" value={rate} onChange={e=>setRate(e.target.value)} />
                    </div>
                    <button onClick={saveRate} className="btn-primary">Salvar Taxa</button>
                </div>
            </div>

            {/* Gestão de Cargos */}
            <div className="theme-card">
                <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex gap-2">
                    Cargos & Funções
                </h2>
                
                <form onSubmit={handleAddRole} className="flex gap-2 mb-6">
                    <input className="theme-input" placeholder="Novo Cargo (ex: Estagiário)" value={newRole} onChange={e=>setNewRole(e.target.value)} />
                    <button disabled={loading} className="btn-success"><Plus/></button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {roles.map(r => (
                        <div key={r.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-neutral-950 rounded-lg border border-slate-200 dark:border-emerald-900/30">
                            <span className="font-medium text-slate-700 dark:text-emerald-100">{r.name}</span>
                            <button onClick={()=>handleDeleteRole(r.id)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 p-1 rounded"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;