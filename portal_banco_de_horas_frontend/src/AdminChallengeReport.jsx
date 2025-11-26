// src/AdminChallengeReport.jsx
import React, { useState, useEffect } from 'react';
import { admin } from './api.js';

const AdminChallengeReport = () => {
    const [data, setData] = useState([]);
    useEffect(() => { admin.getAllParticipations().then(res => setData(res.data)); }, []);

    return (
        <div className="theme-card mt-4">
            <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Relatório Geral</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead><tr><th className="theme-table-head">Nome</th><th className="theme-table-head">Desafio</th><th className="theme-table-head">Status</th><th className="theme-table-head">Data</th><th className="theme-table-head">Prova</th></tr></thead>
                    <tbody>
                        {data.map(d => (
                            <tr key={d.id} className="theme-table-row">
                                <td className="theme-table-cell">{d.profiles?.name}</td>
                                <td className="theme-table-cell">{d.challenges?.title}</td>
                                <td className="theme-table-cell"><span className={`tag tag-${d.status==='validado'?'success':d.status==='enviado'?'pending':'default'}`}>{d.status}</span></td>
                                <td className="theme-table-cell">{new Date(d.created_at).toLocaleDateString()}</td>
                                <td className="theme-table-cell">{d.proof_url ? <a href={d.proof_url} target="_blank" className="text-blue-500 hover:underline">Ver Link</a> : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default AdminChallengeReport;