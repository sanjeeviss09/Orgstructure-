import React, { useEffect, useState } from 'react';
import { Intern, InternReport, fetchInterns, fetchInternReports, updateIntern } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Edit2, UploadCloud, FileText, UserCheck } from 'lucide-react';

export const ManageInterns: React.FC = () => {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [reports, setReports] = useState<InternReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Intern>>({});
  
  // Certificate State
  const [, setTemplateFile] = useState<File | null>(null);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [, setTemplateUrl] = useState<string | null>(null); // We could fetch existing from supabase storage but keep simple for now

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ints, reps] = await Promise.all([
        fetchInterns(),
        fetchInternReports() // Fetches all reports
      ]);
      setInterns(ints);
      setReports(reps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (i: Intern) => {
    setEditingId(i.id);
    setEditForm({ name: i.name, dob: i.dob, address: i.address, is_active: i.is_active });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateIntern(editingId, editForm);
      setEditingId(null);
      loadData();
    } catch (e) {
      alert('Failed to update intern');
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setTemplateFile(file);
    setUploadingTemplate(true);
    
    try {
      // Overwrite the same template for simplicity
      const { error } = await supabase.storage.from('certificate-templates').upload('template.png', file, { upsert: true });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from('certificate-templates').getPublicUrl('template.png');
      setTemplateUrl(publicUrlData.publicUrl);
      alert('Template uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to upload template');
    } finally {
      setUploadingTemplate(false);
    }
  };

  const handleGenerateCertificate = async (intern: Intern) => {
    // Check constraints
    // const startDate = new Date(intern.start_date);
    // const endDate = new Date(intern.end_date);
    // const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // In a real app, you'd use HTML2Canvas/JSPDF here to overlay text onto templateUrl.
    // For now, we just mark them as certified and mock the URL.
    try {
      // update intern
      await updateIntern(intern.id, { 
        is_certified: true, 
        certificate_url: 'https://mock-certificate-url.com/cert.pdf' // Placeholder
      });
      alert(`Certificate generated for ${intern.name}!`);
      loadData();
    } catch (e) {
      alert('Failed to generate certificate');
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500 font-bold">Loading Interns...</div>;
  }

  return (
    <div className="space-y-6 slide-up">
      {/* Top Config Row */}
      <div className="glass-panel p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Certificate Template Configuration
          </h2>
          <p className="text-sm text-slate-500 font-medium">Upload a base image template for automatic certificate generation.</p>
        </div>
        <div>
           <label className="relative flex items-center justify-center px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
              <UploadCloud className="w-4 h-4 mr-2" />
              {uploadingTemplate ? 'Uploading...' : 'Upload Template Image'}
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleTemplateUpload} disabled={uploadingTemplate} />
           </label>
        </div>
      </div>

      {/* Interns Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-black text-slate-900">Intern Directory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="p-4">Intern Details</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Documents</th>
                <th className="p-4">Status & Reports</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interns.map(intern => {
                const internReps = reports.filter(r => r.intern_id === intern.id);
                const durationDays = (new Date(intern.end_date).getTime() - new Date(intern.start_date).getTime()) / (1000 * 60 * 60 * 24);
                
                return (
                  <tr key={intern.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      {editingId === intern.id ? (
                        <div className="space-y-2">
                          <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="border p-1 text-sm rounded w-full" />
                          <input type="date" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} className="border p-1 text-sm rounded w-full" />
                          <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="border p-1 text-sm rounded w-full h-12" />
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {intern.name} 
                            {!intern.is_active && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">Inactive</span>}
                            {intern.is_certified && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Certified</span>}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">ID: {intern.id}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{intern.address}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-slate-700">{intern.start_date} to {intern.end_date}</div>
                      <div className="text-xs text-slate-500">({Math.ceil(durationDays)} days)</div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap max-w-[150px]">
                        {intern.documents_url.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-1 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors">
                            Doc {i+1}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-slate-700">{internReps.length} Reports Logged</div>
                      {editingId === intern.id ? (
                        <label className="flex items-center gap-2 mt-2 text-sm">
                          <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} />
                          Active Account
                        </label>
                      ) : (
                        <button className="text-xs text-indigo-600 font-bold hover:underline mt-1" onClick={() => alert(internReps.map(r => r.date + ': ' + r.learnings).join('\n\n'))}>
                          View Reports
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {editingId === intern.id ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1">Cancel</button>
                          <button onClick={handleSaveEdit} className="text-xs font-bold bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Save</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEditClick(intern)} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="Edit Intern Details">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!intern.is_certified && (
                            <button onClick={() => handleGenerateCertificate(intern)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Generate Certificate">
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {interns.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-sm text-slate-400 font-medium">No interns found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
