import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, Landmark, AlertTriangle, Briefcase, ChevronRight } from 'lucide-react';
import { fetchEmployees, fetchPositions, fetchTargets, Employee, Position, HRTargets } from '../lib/api';
import { fetchOffers, fetchCandidates, Offer, Candidate } from '../lib/recruitment_api';

export type KpiType = 'budget' | 'active' | 'offered' | 'hold' | 'vacancy';

interface KpiDetailsViewProps {
  kpiType: KpiType;
  onBack: () => void;
  formatCurrency: (val: number) => string;
  buFilter?: string;
  deptFilter?: string;
}

export const KpiDetailsView: React.FC<KpiDetailsViewProps> = ({ kpiType, onBack, formatCurrency, buFilter, deptFilter }) => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [targets, setTargets] = useState<HRTargets | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [empRes, posRes, offRes, candRes, targetRes] = await Promise.all([
          fetchEmployees(),
          fetchPositions(),
          fetchOffers().catch(() => []),
          fetchCandidates().catch(() => []),
          fetchTargets().catch(() => null)
        ]);
        setEmployees(empRes);
        setPositions(posRes);
        setOffers(offRes);
        setCandidates(candRes);
        setTargets(targetRes);
      } catch (err) {
        console.error('Failed to load drill-down data', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getManagerName = (posId: string | null) => {
    if (!posId) return 'N/A';
    const mgrPos = positions.find(p => p.id === posId);
    if (!mgrPos) return 'N/A';
    const mgrEmp = employees.find(e => e.position_id === posId && (e.employment_status === 'Active' || e.employment_status === 'Under Notice Period'));
    return mgrEmp ? mgrEmp.full_name : `${mgrPos.title} (Vacant)`;
  };

  const getCandidateName = (candId: string) => {
    const cand = candidates.find(c => c.id === candId);
    return cand ? `${cand.first_name} ${cand.last_name}` : 'Unknown Candidate';
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 overflow-y-auto w-full max-w-[1400px] mx-auto animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
        <div className="bg-white rounded-3xl h-[600px] border border-slate-200 shadow-sm"></div>
      </div>
    );
  }

  let title = '';
  let icon = <Users className="w-6 h-6" />;
  let iconBg = '';
  let content = null;

  // Apply filters
  const filteredPositions = positions.filter(p => {
    if (buFilter && p.business_unit !== buFilter) return false;
    if (deptFilter && p.department !== deptFilter) return false;
    return true;
  });

  const filteredEmployees = employees.filter(e => {
    if (buFilter && e.business_unit !== buFilter) return false;
    if (deptFilter && e.department !== deptFilter) return false;
    return true;
  });

  const filteredOffers = offers.filter(o => {
    const pos = positions.find(p => p.id === o.position_id);
    const oBu = pos?.business_unit;
    const oDept = pos?.department;
    if (buFilter && oBu !== buFilter) return false;
    if (deptFilter && oDept !== deptFilter) return false;
    return true;
  });

  if (kpiType === 'budget') {
    title = 'Budgeted Headcount & Cost Details';
    icon = <Landmark className="w-6 h-6 text-blue-600" />;
    iconBg = 'bg-blue-50';
    const activePositions = filteredPositions.filter(p => p.status !== 'C');
    
    content = (
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <th className="px-4 py-3">Position Title</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Business Unit</th>
            <th className="px-4 py-3">Reporting To</th>
            <th className="px-4 py-3 text-right">Budgeted CTC</th>
          </tr>
        </thead>
        <tbody>
          {activePositions.map(p => (
            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 font-bold text-slate-800">{p.title}</td>
              <td className="px-4 py-3 text-slate-600">{p.department}</td>
              <td className="px-4 py-3 text-slate-600">{p.business_unit || '-'}</td>
              <td className="px-4 py-3 text-slate-600">{getManagerName(p.reporting_to_position_id)}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatCurrency(p.budgeted_ctc || 0)}</td>
            </tr>
          ))}
          {activePositions.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No positions found</td></tr>
          )}
        </tbody>
      </table>
    );
  } else if (kpiType === 'active') {
    title = 'Active Employees Details';
    icon = <Users className="w-6 h-6 text-emerald-600" />;
    iconBg = 'bg-emerald-50';
    const activeEmps = filteredEmployees.filter(e => 
      e.employment_status === 'Active' || 
      e.employment_status === 'Replacement Joined' ||
      e.employment_status === 'Under Notice Period' ||
      e.employment_status === 'Resigned on Roll'
    );
    
    content = (
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <th className="px-4 py-3">Employee Name</th>
            <th className="px-4 py-3">Designation</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Reporting To</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actual CTC</th>
          </tr>
        </thead>
        <tbody>
          {activeEmps.map(e => {
            const pos = positions.find(p => p.id === e.position_id);
            return (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={e.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.full_name)}&background=random`} className="w-8 h-8 rounded-full border border-slate-200" />
                    <span className="font-bold text-slate-800">{e.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{e.designation}</td>
                <td className="px-4 py-3 text-slate-600">{e.department}</td>
                <td className="px-4 py-3 text-slate-600">{getManagerName(pos?.reporting_to_position_id || null)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${e.employment_status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {e.employment_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatCurrency(e.ctc_annual || 0)}</td>
              </tr>
            );
          })}
          {activeEmps.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No active employees found</td></tr>
          )}
        </tbody>
      </table>
    );
  } else if (kpiType === 'offered') {
    title = 'Offered Candidates Details';
    icon = <Briefcase className="w-6 h-6 text-indigo-600" />;
    iconBg = 'bg-indigo-50';
    
    // Active offers that are not declined, expired, or already joined
    const activeOffers = filteredOffers.filter(o => 
      o.status !== 'Offer Declined' && 
      o.status !== 'Offer Expired' && 
      o.status !== 'Joined' &&
      !o.status.startsWith('Pending')
    );
    
    content = (
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <th className="px-4 py-3">Candidate</th>
            <th className="px-4 py-3">Position</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Date Released</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Offered CTC</th>
          </tr>
        </thead>
        <tbody>
          {activeOffers.map(o => {
            const pos = positions.find(p => p.id === o.position_id);
            return (
              <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-800">{getCandidateName(o.candidate_id)}</td>
                <td className="px-4 py-3 text-slate-600">{o.designation}</td>
                <td className="px-4 py-3 text-slate-600">{pos?.department || '-'}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatCurrency(o.offered_ctc || 0)}</td>
              </tr>
            );
          })}
          {activeOffers.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No active offers found</td></tr>
          )}
        </tbody>
      </table>
    );
  } else if (kpiType === 'hold') {
    title = 'On-Hold Roles & Cost Details';
    icon = <AlertTriangle className="w-6 h-6 text-slate-600" />;
    iconBg = 'bg-slate-100';
    
    // Offers that are pending approvals/exceptions
    const holdOffers = offers.filter(o => 
      o.status.startsWith('Pending')
    );
    
    content = (
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <th className="px-4 py-3">Candidate</th>
            <th className="px-4 py-3">Position</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Pending With</th>
            <th className="px-4 py-3 text-right">Offered CTC</th>
          </tr>
        </thead>
        <tbody>
          {holdOffers.map(o => {
            const pos = positions.find(p => p.id === o.position_id);
            return (
              <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-800">{getCandidateName(o.candidate_id)}</td>
                <td className="px-4 py-3 text-slate-600">{o.designation}</td>
                <td className="px-4 py-3 text-slate-600">{pos?.department || '-'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                    {o.status.replace('Pending ', '')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatCurrency(o.offered_ctc || 0)}</td>
              </tr>
            );
          })}
          {holdOffers.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No offers on hold found</td></tr>
          )}
        </tbody>
      </table>
    );
  } else if (kpiType === 'vacancy') {
    title = 'Vacant Positions & Budget Availability';
    icon = <AlertTriangle className="w-6 h-6 text-amber-600" />;
    iconBg = 'bg-amber-50';
    
    const vacantPos = filteredPositions.filter(p => {
      const activeEmps = filteredEmployees.filter(e => e.position_id === p.id && (
        e.employment_status === 'Active' || 
        e.employment_status === 'Replacement Joined' ||
        e.employment_status === 'Under Notice Period' ||
        e.employment_status === 'Resigned on Roll'
      ));
      const oyjEmp = filteredEmployees.find(e => e.position_id === p.id && e.employment_status === 'Offered Yet to Join');
      const posOffers = filteredOffers.filter(o => o.position_id === p.id && o.status !== 'Offer Declined' && o.status !== 'Offer Expired' && o.status !== 'Joined');
      
      const hasActive = activeEmps.length > 0;
      const hasOyj = !!oyjEmp || (!oyjEmp && p.status === 'OYJ');
      const hasOffer = posOffers.length > 0 || (posOffers.length === 0 && p.status === 'H');
      
      return !hasActive && !hasOyj && !hasOffer;
    });
    
    content = (
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <th className="px-4 py-3">Position Title</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Business Unit</th>
            <th className="px-4 py-3">Hiring Manager</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Budget Remaining</th>
          </tr>
        </thead>
        <tbody>
          {vacantPos.map(p => {
            // Calculate Department remaining budget
            const deptEmps = employees.filter(e => e.department === p.department && (e.business_unit || '') === (p.business_unit || '') && e.employment_status !== 'Inactive');
            const deptActualCost = deptEmps.reduce((sum, e) => sum + (Number(e.ctc_annual) || 0), 0);
            const deptTarget = targets?.departments.find(d => d.department === p.department && (d.business_unit || '') === (p.business_unit || ''));
            const deptBudget = deptTarget?.budget_allocated || 0;
            const deptRemainingBudget = Math.max(0, deptBudget - deptActualCost);
            
            // Distribute remaining budget evenly among vacant positions in this dept/BU
            const vacantCountInDept = vacantPos.filter(vp => vp.department === p.department && (vp.business_unit || '') === (p.business_unit || '')).length;
            const budgetForThisPosition = vacantCountInDept > 0 ? (deptRemainingBudget / vacantCountInDept) : 0;

            return (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-800">{p.title}</td>
                <td className="px-4 py-3 text-slate-600">{p.department}</td>
                <td className="px-4 py-3 text-slate-600">{p.business_unit || '-'}</td>
                <td className="px-4 py-3 text-slate-600">{getManagerName(p.reporting_to_position_id)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${p.status === 'F' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>
                    {p.status === 'F' ? 'Frozen' : 'Vacant'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatCurrency(budgetForThisPosition)}</td>
              </tr>
            );
          })}
          {vacantPos.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No vacant positions found</td></tr>
          )}
        </tbody>
      </table>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full max-w-[1400px] mx-auto slide-up">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-200 bg-slate-100 rounded-full text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hover:text-slate-800 cursor-pointer" onClick={onBack}>Dashboard</span>
          <ChevronRight className="w-4 h-4" />
          <span className="font-bold text-slate-800">{title}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className={`p-3 rounded-2xl ${iconBg}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
            <p className="text-sm text-slate-500 font-medium">Detailed list supporting the dashboard metric</p>
          </div>
        </div>
        <div className="flex-1 overflow-x-auto">
          {content}
        </div>
      </div>
    </div>
  );
};
