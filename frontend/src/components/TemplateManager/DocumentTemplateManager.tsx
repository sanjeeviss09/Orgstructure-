import React, { useState, useEffect } from 'react';
import { FileText, Upload, Clock, Plus, FileSpreadsheet } from 'lucide-react';
import { DocumentTemplate, getTemplates, uploadTemplate } from '../../lib/template_api';
import { LiveEditingWorkspace } from './LiveEditingWorkspace';

export const DocumentTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<DocumentTemplate | null>(null);

  const loadTemplates = async () => {
    const data = await getTemplates();
    setTemplates(data);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      // Determine type based on extension just for naming
      fd.append('type', file.name.includes('CTC') || file.name.endsWith('.xlsx') ? 'CTC Structure' : 'Offer Letter');
      
      const newTemplate = await uploadTemplate(fd);
      setTemplates(prev => [...prev, newTemplate]);
      setActiveTemplate(newTemplate); // Open workspace immediately
    } catch (err) {
      console.error(err);
      alert('Failed to upload template');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            Document & Template Studio
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage, upload, and configure HR document templates and CTC formulas.</p>
        </div>
        <div className="flex gap-3 relative">
          <label className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-sm">
            {isUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Upload className="w-4 h-4" />}
            {isUploading ? 'Uploading & Parsing...' : 'Upload Master Template'}
            <input type="file" accept=".docx,.pdf,.html,.xlsx" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50/30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* New Template Card */}
          <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all group min-h-[220px]">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Add New Template</h3>
            <p className="text-xs font-medium text-slate-500 mt-1 text-center">Support for DOCX, XLSX, PDF, and HTML templates.</p>
            <input type="file" accept=".docx,.pdf,.html,.xlsx" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>

          {/* List existing templates */}
          {templates.map(t => (
            <div key={t.id} onClick={() => setActiveTemplate(t)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group flex flex-col min-h-[220px]">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${t.file_type === 'XLSX' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  {t.file_type === 'XLSX' ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${t.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {t.active ? 'Active' : 'Archived'}
                </span>
              </div>
              
              <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{t.name}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase mt-1">{t.type} • v{t.version}</p>
              
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> {new Date(t.created_at).toLocaleDateString()}
                </div>
                <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                  {t.editable_fields.length} Fields
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>

      {activeTemplate && (
        <LiveEditingWorkspace template={activeTemplate} onClose={() => setActiveTemplate(null)} />
      )}
    </div>
  );
};
