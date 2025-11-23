// src/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import { Users, Edit2, Save, X, KeyRound, Trash2 } from "lucide-react";
import { admin } from './api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
      try {
        const res = await admin.getAllUsers();
        setUsers(res.data);
      } catch (e) { console.error("Erro ao buscar usuários", e); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, role: user.role, is_admin: user.is_admin });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await admin.updateUser(editingId, editForm);
      setEditingId(null);
      fetchUsers();
    } catch (e) { alert("Erro ao atualizar usuário."); } 
    finally { setLoading(false); }
  };

  const handleResetPassword = async (uid) => {
      const newPass = prompt("Nova senha (min 6 chars):");
      if (newPass && newPass.length >= 6) {
          try {
              await admin.resetPassword(uid, newPass);
              alert("Senha alterada!");
          } catch (e) { alert("Erro ao alterar senha."); }
      }
  };

  // NOVA FUNÇÃO: EXCLUIR USUÁRIO
  const handleDelete = async (uid) => {
      if (!confirm("ATENÇÃO: Tem certeza que deseja DEMITIR este usuário? Esta ação não pode ser desfeita e apagará todo o histórico dele.")) return;
      
      try {
          await admin.deleteUser(uid);
          fetchUsers(); // Remove da lista
          alert("Usuário excluído com sucesso.");
      } catch (e) { 
          alert("Erro ao excluir usuário. Verifique se você é Admin."); 
      }
  };

  return (
    <div className="bg-neutral-900/50 border border-emerald-900/40 rounded-2xl p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="text-emerald-400" />
        <h2 className="text-emerald-100 font-semibold">Gestão de Usuários</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-emerald-200 border-b border-emerald-800">
            <tr>
              <th className="py-2">Nome</th>
              <th>Email</th>
              <th>Cargo</th>
              <th>Acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody className="text-neutral-300">
            {users.map(u => (
              <tr key={u.id} className="border-b border-emerald-900/30 hover:bg-neutral-800/30">
                <td className="py-3">
                  {editingId === u.id ? (
                    <input className="bg-neutral-950 border border-emerald-700 rounded p-1 text-white w-full" 
                        value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} />
                  ) : u.name}
                </td>
                <td>{u.email || "N/A"}</td>
                <td>
                  {editingId === u.id ? (
                    <select className="bg-neutral-950 border border-emerald-700 rounded p-1 text-white"
                        value={editForm.role} onChange={e=>setEditForm({...editForm, role: e.target.value})}>
                      <option>Analista</option><option>Técnico</option><option>Assistente</option><option>Coordenação</option>
                    </select>
                  ) : u.role}
                </td>
                <td>
                  {editingId === u.id ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={editForm.is_admin} onChange={e=>setEditForm({...editForm, is_admin: e.target.checked})} />
                      <span>Admin</span>
                    </label>
                  ) : (u.is_admin ? <span className="text-emerald-400 font-bold">Admin</span> : "User")}
                </td>
                <td>
                  {editingId === u.id ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={loading} className="text-green-400 hover:text-green-300"><Save size={18}/></button>
                      <button onClick={()=>setEditingId(null)} className="text-neutral-400 hover:text-white"><X size={18}/></button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                        <button onClick={()=>startEdit(u)} className="text-emerald-400 hover:text-emerald-200" title="Editar"><Edit2 size={18}/></button>
                        <button onClick={() => handleResetPassword(u.id)} className="text-yellow-500 hover:text-yellow-300" title="Senha"><KeyRound size={18}/></button>
                        {/* BOTÃO DE EXCLUIR */}
                        <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-300" title="Demitir / Excluir"><Trash2 size={18}/></button>
                    </div>
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