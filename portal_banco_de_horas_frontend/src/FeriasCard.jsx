import React, { useState, useEffect } from 'react';
import { Plane, Calendar } from 'lucide-react';
import { ferias } from './api';

const FeriasCard = ({ userId }) => {
  const [dias, setDias] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Função para ir buscar o saldo assim que o componente aparece na tela
    const carregarSaldo = async () => {
      if (!userId) return;
      try {
        const response = await ferias.getSaldo(userId);
        setDias(response.data.dias);
      } catch (error) {
        console.error("Erro ao carregar férias:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarSaldo();
  }, [userId]);

  return (
    <div className="theme-card flex items-center justify-between p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-slate-100 dark:border-neutral-800">
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-1">
          <Plane className="text-sky-500" size={16} /> 
          Saldo de Férias
        </h3>
        {loading ? (
          <div className="h-8 w-16 bg-slate-200 dark:bg-neutral-800 animate-pulse rounded"></div>
        ) : (
          <div className="text-3xl font-black text-slate-800 dark:text-white">
            {dias} <span className="text-base font-medium text-slate-500">dias</span>
          </div>
        )}
      </div>
      <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600">
        <Calendar size={24} />
      </div>
    </div>
  );
};

export default FeriasCard;