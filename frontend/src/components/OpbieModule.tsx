import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, Edit2, Search } from 'lucide-react';

interface OPBIEKnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  created_by: string;
}

export const OpbieModule: React.FC = () => {
  const [knowledge, setKnowledge] = useState<OPBIEKnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OPBIEKnowledgeItem | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Organizational Psychology',
    content: ''
  });

  const fetchKnowledge = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/opbie/knowledge');
      const data = await res.json();
      setKnowledge(data);
    } catch (err) {
      console.error('Failed to fetch OPBIE knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem 
        ? `http://localhost:3001/api/opbie/knowledge/${editingItem.id}` 
        : `http://localhost:3001/api/opbie/knowledge`;
        
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, created_by: 'Admin' })
      });
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ title: '', category: 'Organizational Psychology', content: '' });
      fetchKnowledge();
    } catch (err) {
      console.error('Failed to save knowledge item:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge item?')) return;
    try {
      await fetch(`http://localhost:3001/api/opbie/knowledge/${id}`, { method: 'DELETE' });
      fetchKnowledge();
    } catch (err) {
      console.error('Failed to delete knowledge item:', err);
    }
  };

  const filteredKnowledge = knowledge.filter(k => 
    k.title.toLowerCase().includes(search.toLowerCase()) || 
    k.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Book className="text-purple-600" />
            Enterprise Psychology Knowledge Base (OPBIE)
          </h1>
          <p className="text-slate-500 mt-1">Manage organizational behavioral frameworks, policies, and coaching guidelines for Aira.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors"
        >
          <Plus size={18} /> Add Knowledge
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search knowledge..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 w-64"
            />
          </div>
          <div className="text-sm text-slate-500 font-medium">
            {filteredKnowledge.length} Items
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading knowledge base...</div>
        ) : filteredKnowledge.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No knowledge items found. Add some frameworks to train Aira.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredKnowledge.map(item => (
              <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400">Added by {item.created_by}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{item.content}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingItem(item);
                        setFormData({ title: item.title, category: item.category, content: item.content });
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[600px] max-w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                {editingItem ? 'Edit Knowledge Item' : 'Add New Knowledge'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                  <input 
                    type="text" required
                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="e.g. Conflict Resolution Framework"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                  <select 
                    value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option>Organizational Psychology</option>
                    <option>Leadership</option>
                    <option>Employee Engagement</option>
                    <option>Behavioral Economics</option>
                    <option>Change Management</option>
                    <option>General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Content</label>
                  <textarea 
                    required rows={6}
                    value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                    placeholder="Paste the guidelines, frameworks or knowledge text here. Aira will read and analyze this to help employees."
                  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => { setIsModalOpen(false); setEditingItem(null); setFormData({ title: '', category: 'Organizational Psychology', content: '' }); }}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700"
                >
                  Save Knowledge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
