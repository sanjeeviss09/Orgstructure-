import React from 'react';
import { ArrowLeft, TrendingUp, Activity, Users } from 'lucide-react';
import AttritionAnalytics from './AttritionAnalytics';
import WorkforceForecasting from './WorkforceForecasting';

interface DetailedAnalyticsProps {
  type: 'hiring' | 'attrition' | 'budget';
  onBack: () => void;
}

export const DetailedAnalytics: React.FC<DetailedAnalyticsProps> = ({ type, onBack }) => {
  const titles = {
    hiring: 'Hiring & Headcount Drill-down',
    attrition: 'Attrition Risk Analysis',
    budget: 'Workforce Forecasting'
  };

  const icons = {
    hiring: <Users className="w-6 h-6 text-blue-600" />,
    attrition: <Activity className="w-6 h-6 text-red-600" />,
    budget: <TrendingUp className="w-6 h-6 text-purple-600" />
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 slide-up pb-10">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          {icons[type]} {titles[type]}
        </h2>
      </div>

      {type === 'attrition' && <AttritionAnalytics />}
      {type === 'budget' && <WorkforceForecasting />}
      {type === 'hiring' && (
        <div className="glass-panel p-6 text-center text-slate-500 font-bold">
          Hiring detailed view is integrated into the Recruitment module dashboard. Please navigate there to see extensive hiring funnels and trends.
        </div>
      )}
    </div>
  );
};

