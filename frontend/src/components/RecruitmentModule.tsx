import React, { useState } from 'react';
import { AuthUser } from '../lib/api';
import { RecruitmentDashboard } from './RecruitmentDashboard';
import { PositionRequisitions } from './PositionRequisitions';
import { CandidatePipeline } from './CandidatePipeline';
import { InterviewOfferManager } from './InterviewOfferManager';
import { LayoutDashboard, FilePlus, Users, Calendar, Award } from 'lucide-react';

interface RecruitmentModuleProps {
  activeRole: string;
  loggedInUser: AuthUser | null;
}

export const RecruitmentModule: React.FC<RecruitmentModuleProps> = ({ activeRole }) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'requisitions' | 'pipeline' | 'interviews' | 'offers'>('dashboard');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex bg-white rounded-2xl shadow-sm border border-slate-200 p-1 w-max mx-auto overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </button>
        <button
          onClick={() => setActiveSubTab('requisitions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'requisitions' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FilePlus className="w-4 h-4" /> Requisitions
        </button>
        <button
          onClick={() => setActiveSubTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'pipeline' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" /> Candidate Pipeline
        </button>
        <button
          onClick={() => setActiveSubTab('interviews')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'interviews' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" /> Interviews
        </button>
        <button
          onClick={() => setActiveSubTab('offers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeSubTab === 'offers' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" /> Offers
        </button>
      </div>

      <div className="pop-in">
        {activeSubTab === 'dashboard' && <RecruitmentDashboard />}
        {activeSubTab === 'requisitions' && <PositionRequisitions activeRole={activeRole} />}
        {activeSubTab === 'pipeline' && <CandidatePipeline activeRole={activeRole} />}
        {activeSubTab === 'interviews' && <InterviewOfferManager activeRole={activeRole} type="interviews" />}
        {activeSubTab === 'offers' && <InterviewOfferManager activeRole={activeRole} type="offers" />}
      </div>
    </div>
  );
};
