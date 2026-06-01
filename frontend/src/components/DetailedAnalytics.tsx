import React, { useEffect, useState } from 'react';
import { fetchStats, Stats } from '../lib/api';
import { ArrowLeft, TrendingUp, Activity, Users } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';

interface DetailedAnalyticsProps {
  type: 'hiring' | 'attrition' | 'budget';
  onBack: () => void;
}

export const DetailedAnalytics: React.FC<DetailedAnalyticsProps> = ({ type, onBack }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetchStats().then(setStats);
  }, []);

  if (!stats) {
    return <div className="p-10 text-center animate-pulse font-bold text-slate-500">Loading Analytics...</div>;
  }

  const titles = {
    hiring: 'Hiring & Headcount Drill-down',
    attrition: 'Attrition Risk Analysis',
    budget: 'Budget vs Actual Drill-down'
  };

  const icons = {
    hiring: <Users className="w-6 h-6 text-blue-600" />,
    attrition: <Activity className="w-6 h-6 text-red-600" />,
    budget: <TrendingUp className="w-6 h-6 text-purple-600" />
  };

  const chartData = {
    labels: stats.hiringTrend?.map(t => t.month) || [],
    datasets: type === 'attrition' ? [
      {
        label: 'Attrition Rate (%)',
        data: stats.attritionTrend?.map(t => t.rate) || [],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ] : [
      {
        label: 'Actual Hires',
        data: stats.hiringTrend?.map(t => t.actual) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Planned Hires',
        data: stats.hiringTrend?.map(t => t.planned) || [],
        backgroundColor: 'rgba(148, 163, 184, 0.4)',
        borderRadius: 4,
      }
    ]
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 slide-up pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          {icons[type]} {titles[type]}
        </h2>
      </div>

      {/* LARGE CHART */}
      <div className="glass-panel p-6 h-[400px]">
        {type === 'attrition' ? (
          <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
        ) : (
          <Bar data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
        )}
      </div>

      {/* DETAILED DATA TABLE */}
      <div className="glass-panel p-1 overflow-hidden">
        <div className="p-5 border-b border-white/40">
           <h3 className="text-sm font-bold text-slate-800">Monthly Breakdown Data</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-6 py-3">Month</th>
                <th className="px-6 py-3 text-center">{type === 'attrition' ? 'Attrition Rate (%)' : 'Actual Hires'}</th>
                {type !== 'attrition' && <th className="px-6 py-3 text-center">Planned Hires</th>}
                <th className="px-6 py-3 text-right">Variance / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {stats.hiringTrend.map((t, idx) => {
                const att = stats.attritionTrend[idx];
                const variance = type === 'attrition' 
                  ? Number((att.rate - stats.attritionRate).toFixed(1)) 
                  : Number((t.actual - t.planned).toFixed(1));
                
                return (
                  <tr key={t.month} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{t.month}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {type === 'attrition' ? att.rate : t.actual}
                    </td>
                    {type !== 'attrition' && (
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{t.planned}</td>
                    )}
                    <td className="px-6 py-4 text-right">
                      {type === 'attrition' ? (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${variance > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {variance > 0 ? 'Above Target' : 'Safe Zone'}
                        </span>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${variance < 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {variance === 0 ? 'On Target' : variance > 0 ? `+${variance} Surpassed` : `${variance} Shortfall`}
                        </span>
                      )}
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
