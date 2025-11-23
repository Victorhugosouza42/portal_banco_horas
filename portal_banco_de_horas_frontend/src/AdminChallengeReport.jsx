// src/AdminChallengeReport.jsx
import React, { useState, useEffect } from 'react';
import { admin } from './api.js';

const AdminChallengeReport = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        admin.getAllParticipations().then(res => setData(res.data));
    }, []);

    return (
        <div className="bg-neutral-900/50 border border-emerald-900/40 rounded-2xl p-5 mt-4">
            <h2 className="text-emerald-100 font-semibold mb-4">Relatório de Desafios (Status Geral)</h2>
            <table className="w-full text-sm text-left text-neutral-300">
                <thead className="text-emerald-200 border-b border-emerald-800">
                    <tr>
                        <th className="p-2">Servidor</th>
                        <th>Desafio</th>
                        <th>Status</th>
                        <th>Data Inscrição</th>
                        <th>Prova</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(item => (
                        <tr key={item.id} className="border-b border-emerald-900/20">
                            <td className="p-2">{item.profiles?.name || 'N/A'}</td>
                            <td>{item.challenges?.title}</td>
                            <td>
                                <span className={`px-2 rounded text-xs 
                                    ${item.status==='validado'?'bg-green-900 text-green-200':
                                      item.status==='enviado'?'bg-yellow-900 text-yellow-200':
                                      'bg-neutral-800 text-gray-400'}`}>
                                    {item.status}
                                </span>
                            </td>
                            <td>{new Date(item.created_at).toLocaleDateString()}</td>
                            <td>{item.proof_url ? <a href={item.proof_url} target="_blank" className="text-blue-400 underline">Ver</a> : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
export default AdminChallengeReport;