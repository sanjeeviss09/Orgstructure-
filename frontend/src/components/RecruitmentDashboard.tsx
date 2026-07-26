import React, { useEffect, useState } from 'react';
import { fetchDashboardMetrics } from '../lib/recruitment_api';
import { Briefcase, Users, UserCheck, Clock, DollarSign, Target, FileText, BarChart2, Archive } from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export const RecruitmentDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchDashboardMetrics().then(setMetrics);
  }, []);

  if (!metrics) return <div className="text-center p-10 text-slate-500 font-medium animate-pulse">Loading Dashboard Metrics...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end mb-[-1rem] relative">
        <input 
          type="file" 
          id="dashboard-resume-upload" 
          className="hidden" 
          accept=".pdf" 
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            
            setShowToast(true);
            try {
              const data = new FormData();
              data.append('resume', file);
              const { submitCandidateAIUpload } = await import('../lib/recruitment_api');
              await submitCandidateAIUpload(data);
              alert("Success: Candidate auto-matched and added to pipeline!");
            } catch (err: any) {
              alert("Failed to upload: " + err.message);
            } finally {
              setShowToast(false);
              e.target.value = ''; // Reset input
            }
          }}
        />
        <label 
          htmlFor="dashboard-resume-upload"
          title="Auto-Match Resume to Pipeline"
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 p-2.5 rounded-xl font-bold flex items-center justify-center transition-colors shadow-sm cursor-pointer"
        >
          {showToast ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Archive className="w-5 h-5" />
          )}
        </label>
      </div>
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: 'Applications', value: metrics.applicationsReceived, icon: <FileText className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Shortlisted', value: metrics.shortlisted, icon: <Users className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Interviewed', value: metrics.interviewed, icon: <Clock className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
          { label: 'Selected', value: metrics.selected, icon: <Target className="w-5 h-5" />, color: 'bg-pink-50 text-pink-600' },
          { label: 'Offered', value: metrics.offered, icon: <Briefcase className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
          { label: 'Joined', value: metrics.joined, icon: <UserCheck className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Closure Rate', value: `${metrics.vacancyClosureRate}%`, icon: <BarChart2 className="w-5 h-5" />, color: 'bg-teal-50 text-teal-600' },
          { label: 'Time to Hire', value: `${metrics.timeToHire} d`, icon: <Clock className="w-5 h-5" />, color: 'bg-slate-100 text-slate-600' },
          { label: 'Cost per Hire', value: `₹${(metrics.costPerHire/1000).toFixed(1)}k`, icon: <DollarSign className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
          { label: 'Open Pos.', value: metrics.openPositions, icon: <Briefcase className="w-5 h-5" />, color: 'bg-red-50 text-red-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex items-center gap-3 transition-all hover:-translate-y-1 hover:shadow-md">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 leading-tight">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recruitment Funnel</h3>
          <div className="h-64">
            <Bar 
              data={{
                labels: ['Applied', 'Shortlisted', 'Interviewed', 'Selected', 'Offered', 'Joined'],
                datasets: [{
                  label: 'Candidates',
                  data: [metrics.applicationsReceived, metrics.shortlisted, metrics.interviewed, metrics.selected, metrics.offered, metrics.joined],
                  backgroundColor: ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
                  borderRadius: 8
                }]
              }}
              options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-900 mb-2 self-start">Offer Acceptance</h3>
          <div className="h-48 w-full flex items-center justify-center relative mt-4">
             <Doughnut 
              data={{
                labels: ['Accepted', 'Declined/Pending'],
                datasets: [{
                  data: [metrics.offerAcceptanceRate, 100 - metrics.offerAcceptanceRate],
                  backgroundColor: ['#10b981', '#f1f5f9'],
                  borderWidth: 0,
                  cutout: '75%'
                } as any]
              }}
              options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900">{Math.round(metrics.offerAcceptanceRate)}%</span>
              <span className="text-xs font-bold text-slate-500">Accepted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Department Hiring Trend</h3>
          <div className="h-64">
             <Line 
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: (metrics.deptHiringTrend || []).map((d: any, idx: number) => ({
                  label: d.department,
                  data: d.trend,
                  borderColor: `hsl(${idx * 40}, 70%, 50%)`,
                  tension: 0.3
                }))
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Recruiter Productivity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="pb-3 font-semibold">Recruiter</th>
                  <th className="pb-3 font-semibold text-center">Screened</th>
                  <th className="pb-3 font-semibold text-center">Positions Closed</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.recruiterProductivity || []).map((r: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-medium text-slate-900">{r.name}</td>
                    <td className="py-3 text-center">{r.candidatesScreened}</td>
                    <td className="py-3 text-center">
                      <span className="bg-emerald-100 text-emerald-700 py-1 px-3 rounded-full font-bold">
                        {r.positionsClosed}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

