import React, { useState, useEffect } from 'react';
import { Plane, Plus, Minus, History, Users, Trash2 } from 'lucide-react';
import { ferias, admin } from './api'; // Ajuste os imports conforme necessário

const AdminFerias = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [relatorio, setRelatorio] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para os formulários
  const [formSaldo, setFormSaldo] = useState({ user_id: '', dias: 0 });
  const [formHistorico, setFormHistorico] = useState({ user_id: '', start_date: '', end_date: '', notes: '' });

  // Carrega a lista de utilizadores e o relatório de férias ao abrir a página
  const carregarDados = async () => {
    try {
      // Supondo que você tem uma função para pegar todos os usuários para o select
      const resUsuarios = await admin.getAllUsers(); 
      setUsuarios(resUsuarios.data);

      const resRelatorio = await ferias.getRelatorio();
      setRelatorio(resRelatorio.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  // Função para enviar o ajuste de saldo
  const handleAjustarSaldo = async (e) => {
    e.preventDefault();
    if (!formSaldo.user_id || formSaldo.dias === 0) return alert("Preencha o utilizador e os dias.");
    
    setLoading(true);
    try {
      await ferias.ajustarSaldo({ user_id: formSaldo.user_id, dias: Number(formSaldo.dias) });
      alert("Saldo ajustado com sucesso!");
      setFormSaldo({ user_id: '', dias: 0 });
      carregarDados(); // Atualiza a tabela com o novo histórico
    } catch (error) {
      alert("Erro ao ajustar saldo.");
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir um histórico
  const handleDeleteHistorico = async (id) => {
    if (confirm("ATENÇÃO: Deseja realmente excluir este registro? O saldo não será alterado automaticamente.")) {
      setLoading(true);
      try {
        await ferias.deleteHistorico(id);
        carregarDados(); // Atualiza a tabela
      } catch (error) {
        alert("Erro ao excluir registro.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Função para registar que alguém vai tirar férias
  const handleRegistrarFerias = async (e) => {
    e.preventDefault();
    if (!formHistorico.user_id || !formHistorico.start_date || !formHistorico.end_date) {
      return alert("Preencha todos os campos obrigatórios.");
    }

    setLoading(true);
    try {
      await ferias.registrarHistorico(formHistorico);
      alert("Férias registadas com sucesso!");
      setFormHistorico({ user_id: '', start_date: '', end_date: '', notes: '' });
      carregarDados(); // Atualiza a tabela
    } catch (error) {
      alert("Erro ao registar férias.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulário 1: Ajustar Saldo (Adicionar ou Subtrair) */}
        <div className="theme-card">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <Plane className="text-sky-500"/> Ajustar Saldo de Dias
          </h3>
          <form onSubmit={handleAjustarSaldo} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Servidor</label>
              <select className="theme-input w-full mt-1" value={formSaldo.user_id} onChange={e => setFormSaldo({...formSaldo, user_id: e.target.value})}>
                <option value="">Selecione um servidor...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Dias (Use - para remover)</label>
              <input type="number" className="theme-input w-full mt-1" placeholder="Ex: 5 ou -2" value={formSaldo.dias} onChange={e => setFormSaldo({...formSaldo, dias: e.target.value})} />
            </div>
            <button disabled={loading} className="btn-primary w-full py-2">Confirmar Ajuste</button>
          </form>
        </div>

        {/* Formulário 2: Agendar/Registar Férias */}
        <div className="theme-card">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <History className="text-emerald-500"/> Registar Férias
          </h3>
          <form onSubmit={handleRegistrarFerias} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Servidor</label>
              <select className="theme-input w-full mt-1" value={formHistorico.user_id} onChange={e => setFormHistorico({...formHistorico, user_id: e.target.value})}>
                <option value="">Selecione um servidor...</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Data Início</label>
                <input type="date" className="theme-input w-full mt-1" value={formHistorico.start_date} onChange={e => setFormHistorico({...formHistorico, start_date: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Data Fim</label>
                <input type="date" className="theme-input w-full mt-1" value={formHistorico.end_date} onChange={e => setFormHistorico({...formHistorico, end_date: e.target.value})} />
              </div>
            </div>
            <button disabled={loading} className="btn-primary w-full py-2 bg-emerald-600 hover:bg-emerald-700">Registar Período</button>
          </form>
        </div>
      </div>

      {/* Relatório de Férias */}
      <div className="theme-card mt-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
          <Users className="text-indigo-500"/> Relatório de Férias Agendadas/Tiradas
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="theme-table-head">Servidor</th>
                <th className="theme-table-head">Data de Início</th>
                <th className="theme-table-head">Data de Fim</th>
                <th className="theme-table-head">Observações</th>
                <th className="theme-table-head">Status</th>
                <th className="theme-table-head text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {relatorio.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-6 text-slate-400">Nenhum registo encontrado.</td></tr>
              ) : (
                relatorio.map(item => {
                  const dataInicio = new Date(item.start_date);
                  const hoje = new Date();
                  let status = dataInicio > hoje ? "Agendado" : "Já passou/A decorrer";
                  
                  if (item.notes && item.notes.includes("AJUSTE MANUAL")) {
                    status = "Ajuste";
                  }
                  
                  return (
                    <tr key={item.id} className="theme-table-row">
                      <td className="theme-table-cell font-medium">{item.profiles?.name || 'Utilizador Desconhecido'}</td>
                      <td className="theme-table-cell">{dataInicio.toLocaleDateString()}</td>
                      <td className="theme-table-cell">{new Date(item.end_date).toLocaleDateString()}</td>
                      <td className="theme-table-cell text-sm text-slate-500 dark:text-slate-400">{item.notes || '-'}</td>
                      <td className="theme-table-cell">
                        <span className={`tag ${status === 'Agendado' ? 'bg-sky-100 text-sky-700' : status === 'Ajuste' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="theme-table-cell text-center">
                        <button onClick={() => handleDeleteHistorico(item.id)} disabled={loading} className="text-red-500 hover:text-red-700 disabled:opacity-50">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminFerias;