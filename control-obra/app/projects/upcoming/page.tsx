// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lightbulb, Plus, MapPin, DollarSign, Calendar, FileText, Printer, Trash2, Pencil, CheckCircle2, AlertCircle, X, ArrowRight, Building2 } from 'lucide-react';

export default function UpcomingProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [filtroPlanta, setFiltroPlanta] = useState('ALL');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    project_name: '',
    plant: 'Nogales',
    status: 'Planned',
    estimated_cost: '',
    actual_cost: '',
    due_date: '',
    description: '',
    business_justification: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data, error } = await supabase
      .from('upcoming_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching upcoming projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      project_name: '',
      plant: 'Nogales',
      status: 'Planned',
      estimated_cost: '',
      actual_cost: '0',
      due_date: new Date().toISOString().split('T')[0],
      description: '',
      business_justification: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (proj: any) => {
    setEditingId(proj.id);
    setFormData({
      project_name: proj.project_name,
      plant: proj.plant || 'Nogales',
      status: proj.status || 'Planned',
      estimated_cost: proj.estimated_cost || '',
      actual_cost: proj.actual_cost || '0',
      due_date: proj.due_date || '',
      description: proj.description || '',
      business_justification: proj.business_justification || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      project_name: formData.project_name,
      plant: formData.plant,
      status: formData.status,
      estimated_cost: Number(formData.estimated_cost) || 0,
      actual_cost: Number(formData.actual_cost) || 0,
      due_date: formData.due_date || null,
      description: formData.description,
      business_justification: formData.business_justification
    };

    if (editingId) {
      const { error } = await supabase.from('upcoming_projects').update(payload).eq('id', editingId);
      if (error) alert('Error updating project: ' + error.message);
    } else {
      const { error } = await supabase.from('upcoming_projects').insert([payload]);
      if (error) alert('Error creating project: ' + error.message);
    }

    setModalOpen(false);
    fetchProjects();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project proposal?')) return;
    const { error } = await supabase.from('upcoming_projects').delete().eq('id', id);
    if (error) alert('Error deleting: ' + error.message);
    else fetchProjects();
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtrado de proyectos
  const filteredProjects = filtroPlanta === 'ALL' 
    ? projects 
    : projects.filter(p => p.plant === filtroPlanta);

  // KPIs
  const totalEstimated = filteredProjects.reduce((acc, curr) => acc + Number(curr.estimated_cost || 0), 0);
  const totalActual = filteredProjects.reduce((acc, curr) => acc + Number(curr.actual_cost || 0), 0);
  const totalProjects = filteredProjects.length;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'On Hold': return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/30'; // Planned
    }
  };

  const getPlantBadge = (plant: string) => {
    switch(plant) {
      case 'Tijuana': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Long Beach': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Phoenix': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20'; // Nogales
    }
  };

  if (loading) return <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-emerald-400 font-bold animate-pulse">Loading Upcoming Projects Pipeline...</div>;

  return (
    <div className="min-h-screen bg-[#070b14] p-6 text-slate-200 font-sans print:bg-white print:text-black">
      
      {/* MODAL CREAR / EDITAR PROYECTO */}
      {modalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b101a] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#121826]">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Lightbulb size={18} className="text-emerald-400" /> 
                {editingId ? 'Edit Project Proposal' : 'New Upcoming Project'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Project Name</label>
                <input required type="text" value={formData.project_name} onChange={e => setFormData({...formData, project_name: e.target.value})} placeholder="e.g. Line 4 Automation & Conveyor Upgrade" className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-emerald-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Facility / Plant</label>
                  <select required value={formData.plant} onChange={e => setFormData({...formData, plant: e.target.value})} className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-emerald-500 appearance-none">
                    <option value="Nogales">Nogales, MX</option>
                    <option value="Tijuana">Tijuana, MX</option>
                    <option value="Long Beach">Long Beach, CA</option>
                    <option value="Phoenix">Phoenix, AZ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</label>
                  <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-emerald-500 appearance-none">
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Date</label>
                  <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Cost ($)</label>
                  <input required type="number" step="0.01" value={formData.estimated_cost} onChange={e => setFormData({...formData, estimated_cost: e.target.value})} placeholder="0.00" className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-emerald-500 font-bold text-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Actual / Spent ($)</label>
                  <input type="number" step="0.01" value={formData.actual_cost} onChange={e => setFormData({...formData, actual_cost: e.target.value})} placeholder="0.00" className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-emerald-500 font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Project Description & Scope</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief technical summary..." className="w-full bg-[#070b14] border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-emerald-500 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Business Justification (For Travel / CAPEX / Management)</label>
                <textarea rows={3} required value={formData.business_justification} onChange={e => setFormData({...formData, business_justification: e.target.value})} placeholder="Why is this project necessary? ROI, downtime reduction, safety compliance..." className="w-full bg-[#070b14] border border-emerald-500/40 text-white rounded-lg p-3 outline-none focus:border-emerald-500 text-sm" />
              </div>

              <button type="submit" disabled={saving} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                {saving ? 'SAVING...' : (editingId ? 'UPDATE PROPOSAL' : 'SAVE PROJECT PROPOSAL')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VISTA PRINCIPAL */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex justify-between items-end border-b border-slate-800 pb-6 print:border-black">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 print:text-black">
              Upcoming Projects Pipeline & CAPEX
            </h1>
            <p className="text-slate-400 text-sm mt-1">Plant infrastructure pipeline, cost estimations, and executive business justifications.</p>
          </div>
          <div className="flex gap-3 print:hidden">
            <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 border border-slate-700 shadow-lg">
              <Printer size={18} /> Print Report
            </button>
            <button onClick={handleOpenNew} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-5 py-2.5 rounded-lg font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <Plus size={18} /> New Project Proposal
            </button>
          </div>
        </div>

        {/* FILTROS DE PLANTA */}
        <div className="flex gap-2 print:hidden overflow-x-auto pb-2">
          {['ALL', 'Nogales', 'Tijuana', 'Long Beach', 'Phoenix'].map((planta) => (
            <button
              key={planta}
              onClick={() => setFiltroPlanta(planta)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                filtroPlanta === planta 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                  : 'bg-[#121826] text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {planta === 'ALL' ? '🌍 All Facilities' : planta}
            </button>
          ))}
        </div>

        {/* KPIS RAPIDOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl shadow-xl">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Pipeline Projects</h3>
            <p className="text-3xl font-black text-white">{totalProjects}</p>
          </div>
          <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl shadow-xl">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Estimated Investment</h3>
            <p className="text-3xl font-black text-emerald-400">${totalEstimated.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
          <div className="bg-[#121826] border border-slate-800 p-5 rounded-2xl shadow-xl">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Actual Executed</h3>
            <p className="text-3xl font-black text-blue-400">${totalActual.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          </div>
        </div>

        {/* TABLA DE PROYECTOS */}
        <div className="bg-[#121826] border border-slate-800 rounded-2xl shadow-xl overflow-hidden print:border-slate-300">
          <div className="p-6 border-b border-slate-800 bg-[#0b101a] print:bg-white">
            <h2 className="text-white font-bold print:text-black">Project Proposals & Justifications</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#121826] border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500 print:bg-slate-100 print:border-slate-300">
                  <th className="p-4 font-bold">Facility</th>
                  <th className="p-4 font-bold">Project Name & Scope</th>
                  <th className="p-4 font-bold">Business Justification (Travel / CAPEX)</th>
                  <th className="p-4 font-bold text-right">Estimated ($)</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredProjects.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No project proposals found for this filter.</td></tr>
                ) : (
                  filteredProjects.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${getPlantBadge(p.plant)}`}>
                          {p.plant}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-white">{p.project_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                      </td>
                      <td className="p-4 text-slate-300 text-xs max-w-xs">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg">
                          <span className="font-bold text-emerald-400 block mb-0.5">Justification:</span>
                          {p.business_justification}
                        </div>
                      </td>
                      <td className="p-4 text-right font-bold text-emerald-400">
                        ${Number(p.estimated_cost).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right print:hidden">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEdit(p)} className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 p-1.5 rounded transition-colors" title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}