import React, { useEffect, useState } from 'react';
import { X, User, Briefcase, Mail, Building2, TrendingUp, Phone } from 'lucide-react';
import { fetchEmployees, Employee } from '../lib/api';
import { fetchCandidates, fetchRequisitions, Candidate } from '../lib/recruitment_api';

interface DrillDownModalProps {
  rowData: {
    position: string;
    business_unit: string;
    department: string;
  };
  onClose: () => void;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({ rowData, onClose }) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'candidates'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [empRes, candRes, reqRes] = await Promise.all([
          fetchEmployees(),
          fetchCandidates(),
          fetchRequisitions()
        ]);
        
        // Filter employees to match the selected row
        const matchedEmps = empRes.filter(e => 
          e.department === rowData.department &&
          (e.designation === rowData.position || (!e.designation && rowData.position.includes('General')))
        );
        
        // Find requisitions that match this position
        const matchedReqs = reqRes.filter(r => 
          r.department === rowData.department && 
          r.position_title === rowData.position
        );
        const reqIds = new Set(matchedReqs.map(r => r.id));

        // Filter candidates applying for this position's requisitions
        const matchedCandidates = candRes.filter(c => reqIds.has(c.requisition_id));

        setEmployees(matchedEmps);
        setCandidates(matchedCandidates);
      } catch (err) {
        console.error("Failed to load drill-down data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [rowData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up ring-1 ring-slate-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                {rowData.business_unit}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
                {rowData.department}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              {rowData.position} Drill-Down
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-200 bg-white">
          <button 
            className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'employees' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('employees')}
          >
            <User className="w-4 h-4" /> Active Employees ({employees.length})
          </button>
          <button 
            className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'candidates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            onClick={() => setActiveTab('candidates')}
          >
            <TrendingUp className="w-4 h-4" /> Pipeline Candidates ({candidates.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : activeTab === 'employees' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 font-medium">No active employees found for this position.</div>
              ) : (
                employees.map(emp => (
                  <div key={emp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {emp.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{emp.full_name}</div>
                        <div className="text-xs text-slate-500">{emp.employment_status}</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                        <span className="font-medium truncate ml-2">{emp.email_official}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> BU</span>
                        <span className="font-medium">{emp.business_unit}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Experience</span>
                        <span className="font-medium">{emp.total_experience || '0'} years</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 font-medium">No pipeline candidates found for this position.</div>
              ) : (
                candidates.map(cand => (
                  <div key={cand.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-slate-900">{cand.first_name} {cand.last_name}</div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        cand.status === 'Offer Released' || cand.status === 'Offer Accepted' ? 'bg-purple-100 text-purple-700' :
                        cand.status === 'Joining' || cand.status === 'Employee Creation' ? 'bg-emerald-100 text-emerald-700' :
                        cand.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {cand.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                        <span className="font-medium truncate ml-2">{cand.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
                        <span className="font-medium">{cand.mobile_number}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Exp. CTC</span>
                        <span className="font-medium">₹{(cand.expected_ctc || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
