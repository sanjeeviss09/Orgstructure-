import React, { useState, useEffect } from 'react';
import { BrainCircuit, UploadCloud, File, FileText, FileSpreadsheet, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { fetchKnowledgeDocuments, uploadKnowledgeDocument, deleteKnowledgeDocument, KnowledgeDocument } from '../lib/api';

export const AiraKnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    try {
      const docs = await fetchKnowledgeDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  useEffect(() => {
    loadDocuments();
    // Poll for status updates (Processing -> Active)
    const interval = setInterval(loadDocuments, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      await uploadKnowledgeDocument(file);
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteKnowledgeDocument(id);
      await loadDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return <FileText className="text-red-500" />;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="text-green-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="text-blue-500" />;
    return <File className="text-slate-500" />;
  };

  const activeDocs = documents.filter(d => d.status === 'Active');
  const estimatedTokens = activeDocs.reduce((acc, doc) => acc + (doc.size / 4), 0); // rough estimate: 1 token ~ 4 bytes

  return (
    <div className="p-8 max-w-6xl mx-auto animation-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <BrainCircuit className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Aira Knowledge Base</h1>
          <p className="text-slate-500 font-medium mt-1">Upload company documents, guidelines, and manuals to enhance Aira's intelligence.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload & Stats */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Knowledge Capacity</h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-black text-indigo-600">{activeDocs.length}</span>
              <span className="text-slate-500 font-medium mb-1">Active Documents</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min((activeDocs.length / 50) * 100, 100)}%` }}></div>
            </div>
            <p className="text-xs text-slate-400 font-medium">Estimated Context Size: ~{Math.round(estimatedTokens).toLocaleString()} Tokens</p>
          </div>

          {/* Upload Zone */}
          <div 
            className={`bg-white rounded-3xl p-8 border-2 border-dashed transition-all cursor-pointer text-center ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input type="file" id="file-upload" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" onChange={handleFileSelect} />
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              ) : (
                <UploadCloud className="w-8 h-8 text-indigo-600" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Drop your document here</h3>
            <p className="text-sm text-slate-500 font-medium">or click to browse from your computer</p>
            <p className="text-xs text-slate-400 mt-4">Supported: PDF, DOCX, XLSX, CSV, TXT (Max 5MB)</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-sm font-medium text-red-700">{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: Document List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Training Library</h2>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">{documents.length} Total</span>
            </div>
            <div className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                  No documents uploaded yet. Start training Aira by uploading a file!
                </div>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {getFileIcon(doc.filename)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 truncate">{doc.filename}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {doc.status === 'Processing' && (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> Processing
                        </span>
                      )}
                      {doc.status === 'Active' && (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                      {doc.status === 'Failed' && (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold">
                          <AlertCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
