import React, { useState, useEffect } from 'react';
import { Layers, UploadCloud, CheckCircle2, Building, MapPin, Briefcase } from 'lucide-react';
import { submitCandidateApplication, fetchRequisitions, JobRequisition } from '../lib/recruitment_api';

export const JobApplicationPortal: React.FC<{ requisitionId: string }> = ({ requisitionId }) => {
  const [req, setReq] = useState<JobRequisition | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    location: '',
    current_company: '',
    current_designation: '',
    total_experience: '',
    relevant_experience: '',
    current_ctc: '',
    expected_ctc: '',
    notice_period: '',
    reason_for_change: '',
  });

  const [files, setFiles] = useState<Record<string, File | null>>({
    resume: null,
    payslips: null,
    increment_letter: null,
    offer_letter: null,
    relieving_letter: null,
    education_certificates: null
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [candId, setCandId] = useState('');

  useEffect(() => {
    fetchRequisitions().then(reqs => {
      const found = reqs.find(r => r.id === requisitionId);
      if (found) setReq(found);
    });
  }, [requisitionId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [name]: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('requisition_id', requisitionId);
      Object.keys(formData).forEach(key => data.append(key, (formData as any)[key]));
      Object.keys(files).forEach(key => {
        if (files[key]) data.append(key, files[key] as Blob);
      });

      const res = await submitCandidateApplication(data);
      setCandId(res.id);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Application Received!</h2>
          <p className="text-slate-500 mb-6">Thank you for applying to Axxel. Your candidate ID is <strong className="text-slate-800">{candId}</strong>. We've sent an acknowledgement email.</p>
        </div>
      </div>
    );
  }

  if (!req) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-slate-500 font-medium animate-pulse">Loading position details...</div>
    </div>
  );

  if (req.status !== 'Approved' || req.is_active_link === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Layers className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Position Closed</h2>
          <p className="text-slate-500">We are no longer accepting applications for this position. Thank you for your interest in Axxel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tight text-slate-900">Axxel Careers</span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-indigo-50/50 to-white">
            <h1 className="text-3xl font-black text-slate-900 mb-4">{req.position_title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-1.5"><Building className="w-4 h-4 text-indigo-500"/> {req.department}</div>
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-500"/> {req.location}</div>
              <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-amber-500"/> {req.employment_type}</div>
            </div>
          </div>
          <div className="p-8 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
            {req.job_description}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Submit Your Application</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">First Name *</label>
              <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Last Name *</label>
              <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email *</label>
              <input required type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mobile Number *</label>
              <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.mobile_number} onChange={e => setFormData({...formData, mobile_number: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Native / Current Location *</label>
              <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reason for Change *</label>
              <input required type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.reason_for_change} onChange={e => setFormData({...formData, reason_for_change: e.target.value})} />
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2">Professional Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Company</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.current_company} onChange={e => setFormData({...formData, current_company: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Designation</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.current_designation} onChange={e => setFormData({...formData, current_designation: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Experience (Years)</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.total_experience} onChange={e => setFormData({...formData, total_experience: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notice Period</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.notice_period} onChange={e => setFormData({...formData, notice_period: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current CTC (INR)</label>
              <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.current_ctc} onChange={e => setFormData({...formData, current_ctc: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expected CTC (INR)</label>
              <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" value={formData.expected_ctc} onChange={e => setFormData({...formData, expected_ctc: e.target.value})} />
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2">Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resume *</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl flex items-center gap-2 transition-colors text-sm font-medium text-slate-700 flex-1">
                  <UploadCloud className="w-4 h-4" />
                  {files.resume ? files.resume.name : 'Choose file...'}
                  <input type="file" required className="hidden" onChange={e => handleFileChange(e, 'resume')} accept=".pdf,.doc,.docx" />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payslips (Last 3 months) *</label>
              <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl flex items-center gap-2 transition-colors text-sm font-medium text-slate-700">
                <UploadCloud className="w-4 h-4" />
                {files.payslips ? files.payslips.name : 'Choose file...'}
                <input type="file" required className="hidden" onChange={e => handleFileChange(e, 'payslips')} accept=".pdf" />
              </label>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Increment Letter (Optional)</label>
              <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl flex items-center gap-2 transition-colors text-sm font-medium text-slate-700">
                <UploadCloud className="w-4 h-4" />
                {files.increment_letter ? files.increment_letter.name : 'Choose file...'}
                <input type="file" className="hidden" onChange={e => handleFileChange(e, 'increment_letter')} accept=".pdf" />
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
