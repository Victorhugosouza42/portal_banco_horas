// src/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import { Users, Edit2, Save, X, KeyRound, Trash2, Eye, Clock } from "lucide-react";
import { admin, getPublicRoles } from './api';
import AdminUserDetails from './AdminUserDetails.jsx';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
      try {
        const [uRes, rRes] = await Promise.all([admin.getAllUsers(), getPublicRoles()]);
        setUsers(uRes.data);
        setRolesList(rRes.data);
      } catch (e) { console.error("Erro ao buscar dados", e); }
  };

  useEffect(() => { fetchData(); }, []);

  const startEdit = (user) => { setEditingId(user.id); setEditForm({ name: user.name, role: user.role, is_admin: user.is_admin }); };
  
  const handleSave = async () => {
    setLoading(true);
    try { await admin.updateUser(editingId, editForm); setEditingId(null); fetchData(); } catch (e) { alert("Erro ao atualizar."); } 
    finally { setLoading(false); }
  };
  
  const handleDelete = async (uid) => { if(confirm("ATENÇÃO: Demitir usuário?")) { await admin.deleteUser(uid); fetchData(); } };
  const handleReset = async (uid) => { const p=prompt("Nova senha:"); if(p) await admin.resetPassword(uid, p); };

  if (selectedUser) return <AdminUserDetails user={selectedUser} onBack={() => { setSelectedUser(null); fetchData(); }} />;

  return (
    <div className="theme-card mt-4">
      <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex gap-2"><Users/> Gestão de Usuários</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="theme-table-head">Nome</th>
              <th className="theme-table-head">Email</th>
              <th className="theme-table-head">Cargo</th>
              <th className="theme-table-head">Saldo</th> {/* NOVA COLUNA */}
              <th className="theme-table-head">Acesso</th>
              <th className="theme-table-head">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="theme-table-row group">
                <td className="theme-table-cell">
                  {editingId === u.id ? <input className="theme-input !py-1" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})}/> 
                  : <button onClick={() => setSelectedUser(u)} className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-2 text-left">{u.name} <Eye size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400"/></button>}
                </td>
                <td className="theme-table-cell text-xs">{u.email}</td>
                <td className="theme-table-cell">
                  {editingId === u.id ? 
                    <select className="theme-input !py-1" value={editForm.role} onChange={e=>setEditForm({...editForm, role:e.target.value})}>
                        {rolesList.map(role => (
                            <option key={role.id} value={role.name}>{role.name}</option>
                        ))}
                    </select> : u.role}
                </td>
                
                {/* MOSTRAR SALDO */}
                <td className="theme-table-cell font-mono font-bold text-slate-700 dark:text-emerald-300">
                    {u.hours}h
                </td>

                <td className="theme-table-cell">
                  {editingId === u.id ? <input type="checkbox" checked={editForm.is_admin} onChange={e=>setEditForm({...editForm, is_admin:e.target.checked})}/> : (u.is_admin?"Admin":"User")}
                </td>
                <td className="theme-table-cell flex gap-2">
                  {editingId === u.id ? (
                    <>
                        <button onClick={handleSave} disabled={loading} className="text-green-600"><Save size={18}/></button>
                        <button onClick={()=>setEditingId(null)} className="text-red-500"><X size={18}/></button>
                    </>
                  ) : (
                    <>
                        <button onClick={()=>startEdit(u)} className="text-blue-500 btn-icon"><Edit2 size={18}/></button>
                        <button onClick={()=>handleReset(u.id)} className="text-amber-500 btn-icon"><KeyRound size={18}/></button>
                        <button onClick={()=>handleDelete(u.id)} className="text-red-500 btn-icon"><Trash2 size={18}/></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminUsers;