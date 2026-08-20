'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, FolderKanban, DollarSign, Clock, ArrowRight, X, Loader2, Printer } from 'lucide-react';
import Link from 'next/link';

interface ProjectSummary {
  project_name: string;
  total_reg_hours: number;
  total_ot_hours: number;
  total_material_cost: number;
  records_count: number;
}

export default function ProjectsDashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    fetchProjectsSummary();
  }, []);

  const fetchProjectsSummary = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('project_costs').select('*');

    if (error) {
      console.error('Error fetching data:', error);
    } else if (data) {
      const summaryMap: { [key: string]: ProjectSummary } = {};

      data.forEach((item: any) => {
        const name = item.project_name || 'General Maintenance';
        if (!summaryMap[name]) {
          summaryMap[name] = {
            project_name: name,
            total_reg_hours: 0,
            total_ot_hours: 0,
            total_material_cost: 0,
            records_count: 0
          };
        }
        summaryMap[name].total_reg_hours += Number(item.regular_hours) || 0;
        summaryMap[name].total_ot_hours += Number(item.overtime_hours) || 0;
        summaryMap[name].total_material_cost += Number(item.material_cost) || 0;
        summaryMap[name].records_count += 1;
      });

      setProjects(Object.values(summaryMap));
    }
    setLoading(false);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setSubmitting(true);

    const { error } = await (supabase.from('project_costs') as any).insert([
      {
        project_name: newProjectName.trim(),
        worker_name: 'System Initial',
        description: 'Project Initialization',
        project_date: new Date().toISOString().split('T')[0],
        regular_hours: 0,
        overtime_hours: 0,
        material_cost: 0,
        tasks_status: 'In Progress'
      }
    ]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setIsModalOpen(false);
      setNewProjectName('');
      fetchProjectsSummary();
    }
    setSubmitting(false);
  };

  const grandTotalCost = projects.reduce((acc, curr) => acc + curr.total_material_cost, 0);
  const grandTotalReg = projects.reduce((acc, curr) => acc + curr.total_reg_hours, 0);
  const grandTotalOt = projects.reduce((acc, curr) => acc + curr.total_ot_hours, 0);
  const grandTotalHours = grandTotalReg + grandTotalOt;

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 print:p-0 print:bg-white font-sans text-slate-200">
      
      {/* ================= 1. VISTA OSCURA (APP PANEL) ================= */}
      <div className="print:hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-sky-400">
              <FolderKanban size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">Plant Projects & Financial Control</h1>
              <p className="text-sm text-slate-400 mt-1">Select a project to review expenses, per diems, and individual employee labor hours.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-[#00d084] hover:bg-[#00b370] text-slate-900 font-bold rounded-lg transition-colors shadow-lg shadow-[#00d084]/20"
            >
              <Printer size={18} /> Print Global Report
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors border border-sky-500 shadow-lg"
            >
              <Plus size={18} /> New Project
            </button>
          </div>
        </div>

        {/* KPIs Generales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700 shadow-lg relative overflow-hidden">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Projects</p>
            <h3 className="text-3xl font-black text-white mt-2">{projects.length}</h3>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700 shadow-lg relative overflow-hidden">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Plant Total Labor Hours</p>
            <h3 className="text-3xl font-black text-white mt-2">{grandTotalHours} hrs</h3>
            <p className="text-sm text-sky-400 mt-1 font-medium">{grandTotalReg} Reg / {grandTotalOt} OT</p>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700 shadow-lg relative overflow-hidden">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Plant Total Material Expenses</p>
            <h3 className="text-3xl font-black text-[#00d084] mt-2">${grandTotalCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
          </div>
        </div>

        {/* Lista de Proyectos */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Projects Directory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0f172a] text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-semibold">Project Name</th>
                  <th className="px-6 py-3 font-semibold text-center">Labor Hours</th>
                  <th className="px-6 py-3 font-semibold text-right">Material / Expenses</th>
                  <th className="px-6 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Loading projects...</td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No projects found. Click "New Project" to start.</td>
                  </tr>
                ) : (
                  projects.map((proj, idx) => (
                    <tr key={idx} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white text-base">
                        {proj.project_name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sky-400 font-bold">{proj.total_reg_hours + proj.total_ot_hours} hrs</span> 
                        <span className="text-slate-400 text-xs ml-2">({proj.total_reg_hours} Reg / {proj.total_ot_hours} OT)</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#00d084]">
                        ${proj.total_material_cost.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link 
                          href={`/financial/tracking-maintenance/${encodeURIComponent(proj.project_name)}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors text-xs"
                        >
                          View Project Details <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal para Nuevo Proyecto */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex justify-between items-center p-5 border-b border-slate-700 bg-slate-800/50">
                <h3 className="text-lg font-bold text-white">Create New Project</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Project Name</label>
                  <input 
                    required 
                    value={newProjectName} 
                    onChange={(e) => setNewProjectName(e.target.value)} 
                    type="text" 
                    className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-white focus:border-sky-500 focus:outline-none" 
                    placeholder="e.g. Paint Oven Upgrade" 
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg font-medium transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 bg-[#00d084] hover:bg-[#00b370] text-slate-900 p-2.5 rounded-lg font-bold transition-colors flex justify-center items-center gap-2">
                    {submitting && <Loader2 className="animate-spin" size={16} />} Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ================= 2. DOCUMENTO IMPRESO GLOBAL (PDF BLANCO) ================= */}
      <div className="hidden print:block max-w-5xl mx-auto bg-white p-10 print:w-full text-slate-900">
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-[#00d084] rounded-sm"></div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">KINETIX <span className="font-light">Pro</span></h1>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">JBI Manufacturing Operations</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800 uppercase">Global Financial & Labor Summary</h2>
            <p className="text-sm text-slate-500 mt-1">Scope: <span className="font-semibold text-slate-700">All Plant Projects</span></p>
            <p className="text-sm text-slate-500">Issued Date: {new Date().toLocaleDateString('en-US')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Active Projects</p>
            <p className="text-3xl font-black text-slate-800">{projects.length}</p>
          </div>
          <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
            <p className="text-xs font-bold text-sky-600 uppercase">Total Labor Hours</p>
            <p className="text-3xl font-black text-sky-700">{grandTotalHours} hrs</p>
            <p className="text-xs font-semibold text-sky-600 mt-1">{grandTotalReg} Reg / {grandTotalOt} OT</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <p className="text-xs font-bold text-emerald-600 uppercase">Total Material Expenses</p>
            <p className="text-3xl font-black text-emerald-700">${grandTotalCost.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-3 text-xs font-bold uppercase tracking-wider rounded-tl-md">Project Name</th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-center">Regular Hours</th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-center">Overtime (OT)</th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-right rounded-tr-md">Material Expenses</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="p-3 text-sm font-bold text-slate-800">{p.project_name}</td>
                <td className="p-3 text-sm text-slate-800 font-bold text-center">{p.total_reg_hours}h</td>
                <td className="p-3 text-sm text-amber-600 font-bold text-center">{p.total_ot_hours}h</td>
                <td className="p-3 text-sm text-emerald-700 font-bold text-right">
                  ${p.total_material_cost.toLocaleString('en-US', {minimumFractionDigits: 2})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-24 pt-8 flex justify-around print:break-inside-avoid">
          <div className="text-center w-56">
            <div className="border-b-2 border-slate-800 mb-2 h-8"></div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Maintenance Manager</p>
          </div>
          <div className="text-center w-56">
            <div className="border-b-2 border-slate-800 mb-2 h-8"></div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Plant Management (Felix / Rafael)</p>
          </div>
        </div>
      </div>

    </div>
  );
}