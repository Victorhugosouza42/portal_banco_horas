import React, { useState, useEffect } from 'react';
import { Plane, Trash2, Calendar, SlidersHorizontal, RotateCcw, Gift, Palmtree } from 'lucide-react';
import { ferias, admin } from './api';

// ── Helpers ─────────────────────────────────────────────────────────────────

// Formata "YYYY-MM-DD" sem converter para UTC (evita bug de fuso)
const fmtDate = (str) => {
  if (!str) return '—';
  const [y, m, d] = str.split('-').map(Number);
  return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
};

// Calcula data fim (start + dias - 1), sem bug de fuso
const calcFim = (startStr, dias) => {
  if (!startStr || !dias || Number(dias) <= 0) return '';
  const [y, m, d] = startStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + Number(dias) - 1);
  const ey = dt.getFullYear();
  const em = String(dt.getMonth() + 1).padStart(2, '0');
  const ed = String(dt.getDate()).padStart(2, '0');
  return `${ey}-${em}-${ed}`;
};

const anoAtual = new Date().getFullYear();
const ANOS = Array.from({ length: 6 }, (_, i) => anoAtual - 3 + i);
const MESES = [
  { value: '', label: 'Todos os meses' },
  { value: '01', label: 'Janeiro' },  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },    { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },     { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },    { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

// ── FilterBar ────────────────────────────────────────────────────────────────
function FilterBar({ label, count, onReset, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">{label}</h3>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
          {count}
        </span>
      </div>
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 shadow-sm">
        <SlidersHorizontal size={13} className="text-slate-400 flex-shrink-0" />
        <span className="text-xs text-slate-400 font-medium hidden sm:block">Filtrar:</span>
        {children}
        <div className="w-px h-4 bg-slate-200 dark:bg-neutral-700 mx-1" />
        <button onClick={onReset} className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-500 transition-colors font-medium">
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
}

const selCls = "filter-pill-select";

// ── Component ────────────────────────────────────────────────────────────────
const AdminFerias = () => {
  const [usuarios,  setUsuarios]  = useState([]);
  const [relatorio, setRelatorio] = useState([]);
  const [loading,   setLoading]   = useState(false);

  const [form, setForm] = useState({
    user_id: '', tipo: 'concessao', dias: '', start_date: '', end_date: '',
  });

  const mesAtual = String(new Date().getMonth() + 1).padStart(2, '0');
  const [filtroMes, setFiltroMes] = useState(mesAtual);
  const [filtroAno, setFiltroAno] = useState(String(anoAtual));

  const carregarDados = async () => {
    try {
      const [resU, resR] = await Promise.all([admin.getAllUsers(), ferias.getRelatorio()]);
      setUsuarios(resU.data);
      setRelatorio(resR.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { carregarDados(); }, []);

  // Filtragem — usa getUTC* pois YYYY-MM-DD é interpretado como UTC
  const relatorioFiltrado = relatorio.filter(item => {
    if (!item.start_date) return true;
    const d = new Date(item.start_date);
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const ano = String(d.getUTCFullYear());
    const mesOk = filtroMes === '' || mes === filtroMes;
    return mesOk && ano === filtroAno;
  });

  // Handlers do form
  const setTipo = (t) => setForm({ user_id: form.user_id, tipo: t, dias: '', start_date: '', end_date: '' });

  const handleDias = (val) => {
    const fim = calcFim(form.start_date, val);
    setForm(f => ({ ...f, dias: val, ...(fim && { end_date: fim }) }));
  };

  const handleInicio = (val) => {
    const fim = calcFim(val, form.dias);
    setForm(f => ({ ...f, start_date: val, ...(fim && { end_date: fim }) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.user_id) return alert('Selecione um servidor.');
    if (!form.dias || Number(form.dias) <= 0) return alert('Informe um número de dias válido.');
    if (form.tipo === 'gozo' && !form.start_date) return alert('Informe a data de início do gozo.');
    setLoading(true);
    try {
      await ferias.ajustarSaldo({
        user_id: form.user_id,
        tipo: form.tipo,
        dias: Number(form.dias),
        ...(form.tipo === 'gozo' && { start_date: form.start_date, end_date: form.end_date }),
      });
      alert('Operação realizada com sucesso!');
      setForm({ user_id: '', tipo: 'concessao', dias: '', start_date: '', end_date: '' });
      carregarDados();
    } catch { alert('Erro ao realizar operação.'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este registro?\nO impacto no saldo será revertido automaticamente.')) return;
    setLoading(true);
    try { await ferias.deleteHistorico(id); carregarDados(); }
    catch { alert('Erro ao excluir.'); }
    finally { setLoading(false); }
  };

  // Badge do relatório
  const tipoBadge = (notes) => {
    if (!notes) return { label: '—', cls: 'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400' };
    if (notes.startsWith('GOZO'))       return { label: 'Gozo',      cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' };
    if (notes.startsWith('CONCESSAO') || notes.startsWith('CONCESSÃO')) return { label: 'Concessão', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
    return { label: 'Ajuste', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Formulário ───────────────────────────────────────────────────── */}
      <div className="theme-card">
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-slate-800 dark:text-white">
          <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/30">
            <Plane className="text-sky-500" size={18} />
          </span>
          Lançar Férias
        </h3>

        {/* Seletor de tipo */}
        <div className="flex gap-2 mb-5">
          <button type="button"
            onClick={() => setTipo('concessao')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              form.tipo === 'concessao'
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md'
                : 'border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-emerald-400'
            }`}
          >
            <Gift size={15} /> Concessão
          </button>
          <button type="button"
            onClick={() => setTipo('gozo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              form.tipo === 'gozo'
                ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                : 'border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-sky-400'
            }`}
          >
            <Palmtree size={15} /> Gozo
          </button>
        </div>

        {/* Descrição do tipo selecionado */}
        <p className="text-xs text-slate-400 dark:text-neutral-500 mb-4 -mt-2">
          {form.tipo === 'concessao'
            ? '📋 Concessão adiciona dias ao saldo do servidor. Não requer datas.'
            : '🏖️ Gozo registra o período de férias e desconta dias do saldo.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Servidor</label>
              <select className="theme-input w-full" value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}>
                <option value="">Selecione um servidor...</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">
                {form.tipo === 'concessao' ? 'Dias a conceder' : 'Dias de gozo'}
              </label>
              <input
                type="number" min="1"
                className="theme-input w-full"
                placeholder="Ex: 30"
                value={form.dias}
                onChange={e => handleDias(e.target.value)}
              />
            </div>
          </div>

          {/* Campos de data — apenas para Gozo */}
          {form.tipo === 'gozo' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Calendar size={11} /> Data Início <span className="font-normal text-red-400">(obrigatório)</span>
                </label>
                <input type="date" className="theme-input w-full" value={form.start_date} onChange={e => handleInicio(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Calendar size={11} /> Data Fim <span className="font-normal normal-case text-slate-400">(automático)</span>
                </label>
                <input
                  type="date" className="theme-input w-full opacity-75"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  placeholder="Calculado automaticamente"
                />
              </div>
            </div>
          )}

          <button disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Salvando…' : form.tipo === 'concessao' ? '✓ Confirmar Concessão' : '✓ Registrar Gozo'}
          </button>
        </form>
      </div>

      {/* ── Relatório ────────────────────────────────────────────────────── */}
      <div className="theme-card">
        <FilterBar
          label="Relatório de Férias"
          count={`${relatorioFiltrado.length} registro${relatorioFiltrado.length !== 1 ? 's' : ''}`}
          onReset={() => { setFiltroMes(mesAtual); setFiltroAno(String(anoAtual)); }}
        >
          <select className={selCls} value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <div className="w-px h-4 bg-slate-200 dark:bg-neutral-700" />
          <select className={selCls} value={filtroAno} onChange={e => setFiltroAno(e.target.value)}>
            {ANOS.map(a => <option key={a} value={String(a)}>{a}</option>)}
          </select>
        </FilterBar>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="theme-table-head">Servidor</th>
                <th className="theme-table-head">Início</th>
                <th className="theme-table-head">Fim</th>
                <th className="theme-table-head">Observações</th>
                <th className="theme-table-head">Tipo</th>
                <th className="theme-table-head text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {relatorioFiltrado.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 dark:text-neutral-500">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar size={32} className="opacity-30" />
                      <span>Nenhum registro encontrado para este período.</span>
                      <button onClick={() => { setFiltroMes(''); setFiltroAno(String(anoAtual)); }}
                        className="text-emerald-500 text-xs hover:underline mt-1 flex items-center gap-1">
                        <RotateCcw size={11} /> Ver todos
                      </button>
                    </div>
                  </td>
                </tr>
              ) : relatorioFiltrado.map(item => {
                const { label, cls } = tipoBadge(item.notes);
                return (
                  <tr key={item.id} className="theme-table-row group">
                    <td className="theme-table-cell font-semibold">{item.profiles?.name || 'Desconhecido'}</td>
                    <td className="theme-table-cell tabular-nums">{fmtDate(item.start_date)}</td>
                    <td className="theme-table-cell tabular-nums">{fmtDate(item.end_date)}</td>
                    <td className="theme-table-cell text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={item.notes}>{item.notes || '—'}</td>
                    <td className="theme-table-cell">
                      <span className={`tag text-xs font-semibold ${cls}`}>{label}</span>
                    </td>
                    <td className="theme-table-cell text-center">
                      <button onClick={() => handleDelete(item.id)} disabled={loading}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 disabled:opacity-30">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFerias;