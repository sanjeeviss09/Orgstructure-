import React, { useState, useEffect } from 'react';
import { fetchRequisitions, createRequisition, updateRequisition, deleteRequisition, JobRequisition } from '../lib/recruitment_api';
import { Plus, Link as LinkIcon, CheckCircle2, Trash2 } from 'lucide-react';

export const PositionRequisitions: React.FC<{ activeRole: string }> = ({ activeRole }) => {
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');
  
  const [formData, setFormData] = useState<Partial<JobRequisition>>({
    position_title: '',
    position_code: '',
    department: '',
    business_unit: '',
    location: '',
    position_type: 'New Position',
    budgeted_ctc: 0,
    grade: '',
    employment_type: 'Full-Time',
    number_of_openings: 1,
    required_experience: '',
    qualification: '',
    key_skills: '',
    job_description: '',
    hiring_justification: '',
    expected_joining_date: ''
  });

  const loadData = () => fetchRequisitions().then(setRequisitions);
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRequisition(formData);
    setShowModal(false);
    loadData();
  };

  const handleApproval = async (id: string, currentStatus: string) => {
    let nextStatus = currentStatus;
    if (activeRole === 'Admin' || activeRole === 'HR Head') {
      nextStatus = 'Approved';
    }
    
    if (nextStatus !== currentStatus) {
      await updateRequisition(id, { status: nextStatus as any });
      loadData();
    }
  };

  const copyToClipboard = (id: string) => {
    const url = `${window.location.origin}?job=${id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(''), 2000);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this position requisition?')) {
      await deleteRequisition(id);
      loadData();
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-slate-900">Position Requisitions</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Position
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Position</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dept / BU</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Public Link</th>
              <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requisitions.map(req => (
              <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-900">{req.position_title}</div>
                  <div className="text-xs text-slate-500">{req.id} • {req.number_of_openings} openings</div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm font-semibold text-slate-700">{req.department}</div>
                  <div className="text-xs text-slate-500">{req.business_unit}</div>
                </td>
                <td className="py-4 px-4 text-sm font-medium text-slate-600">{req.position_type}</td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                    req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                    req.status.includes('Pending') ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {req.status === 'Approved' ? (
                    <button
                      onClick={() => copyToClipboard(req.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {copiedLink === req.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                      {copiedLink === req.id ? 'Copied' : 'Copy URL'}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Pending Approval</span>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {req.status !== 'Approved' && (activeRole === 'Admin' || activeRole === 'HR Head') && (
                      <button
                        onClick={() => handleApproval(req.id, req.status)}
                        className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {(activeRole === 'Admin' || activeRole === 'HR Head') && (
                      <button
                        onClick={() => handleDelete(req.id)}
                        className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-lg transition-colors"
                        title="Delete Requisition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {requisitions.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500 font-medium">No position requisitions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col pop-in">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">Create Position Requisition</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Position Title</label>
                  <input required type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200" value={formData.position_title} onChange={e => setFormData({...formData, position_title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department</label>
                  <input required type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                  <input required type="text" className="w-full px-3 py-2 rounded-xl border border-slate-200" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white" value={formData.position_type} onChange={e => setFormData({...formData, position_type: e.target.value as any})}>
                    <option>New Position</option>
                    <option>Replacement Position</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Job Description</label>
                  <textarea required rows={4} className="w-full px-3 py-2 rounded-xl border border-slate-200" value={formData.job_description} onChange={e => setFormData({...formData, job_description: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold">Submit Requisition</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
