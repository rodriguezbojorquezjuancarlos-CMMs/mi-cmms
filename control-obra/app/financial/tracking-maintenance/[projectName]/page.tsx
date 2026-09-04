'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { Printer, Plus, ArrowLeft, Users, DollarSign, Clock, Trash2, X, Loader2, Receipt, Pencil } from 'lucide-react';

interface RecordItem {
  id: string;
  project_name: string;
  worker_name: string;
  description: string;
  project_date: string;
  regular_hours: number;
  overtime_hours: number;
  material_cost: number;
  record_type: 'labor' | 'expense';
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectName = decodeURIComponent(params.projectName as string);

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'labor' | 'expense'>('labor');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    worker_name: '',
    description: '',
    project_date: new Date().toISOString().split('T')[0],
    regular_hours: '',
    overtime_hours: '',
    material_cost: ''
  });

  useEffect(() => {
    fetchProjectRecords();
  }, [projectName]);

  const fetchProjectRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_costs')
      .select('*')
      .eq('project_name', projectName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching project records:', error);
    } else {
      const formatted = (data || []).map((item: any) => ({
        ...item,
        record_type: item.material_cost > 0 && item.regular_hours === 0 && item.overtime_hours === 0 ? 'expense' : 'labor'
      }));
      setRecords(formatted);
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Abrir Modal para crear uno NUEVO
  const openModalNew = (type: 'labor' | 'expense') => {
    setModalType(type);
    setEditingRecordId(null);
    setFormData({
      worker_name: '',
      description: '',
      project_date: new Date().toISOString().split('T')[0],
      regular_hours: '',
      overtime_hours: '',
      material_cost: ''
    });
    setIsModalOpen(true);
  };

  // Abrir Modal para EDITAR
  const openModalEdit = (record: RecordItem, type: 'labor' | 'expense') => {
    setModalType(type);
    setEditingRecordId(record.id);
    setFormData({
      worker_name: record.worker_name === 'Expense / Material' ? '' : record.worker_name,
      description: record.description,
      project_date: record.project_date,
      regular_hours: record.regular_hours.toString(),
      overtime_hours: record.overtime_hours.toString(),
      material_cost: record.material_cost.toString()
    });
    setIsModalOpen(true);
  };

 const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const isExpense = modalType === 'expense';
    
    // Le agregamos ": any" para que TypeScript no marque error con Supabase
    const payload: any = {
      project_name: projectName,
      worker_name: isExpense ? 'Expense / Material' : (formData.worker_name || 'General'),
      description: formData.description,
      project_date: formData.project_date,
      regular_hours: isExpense ? 0 : (Number(formData.regular_hours) || 0),
      overtime_hours: isExpense ? 0 : (Number(formData.overtime_hours) || 0),
      material_cost: isExpense ? (Number(formData.material_cost) || 0) : 0,
      tasks_status: 'In Progress'
    };

    if (editingRecordId) {
      // Lógica de ACTUALIZAR (usamos "as any" para evitar alertas de TS)
      const { error } = await (supabase.from('project_costs') as any).update(payload).eq('id', editingRecordId);
      if (error) alert('Error updating: ' + error.message);
    } else {
      // Lógica de INSERTAR
      const { error } = await (supabase.from('project_costs') as any).insert([payload]);
      if (error) alert('Error inserting: ' + error.message);
    }

    setIsModalOpen(false);
    fetchProjectRecords();
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    await supabase.from('project_costs').delete().eq('id', id);
    fetchProjectRecords();
  };

  const handlePrint = () => {
    window.print();
  };

  const laborRecords = records.filter(r => r.regular_hours > 0 || r.overtime_hours > 0 || r.worker_name !== 'Expense / Material');
  const expenseRecords = records.filter(r => r.material_cost > 0 && r.worker_name === 'Expense / Material');

  const totalReg = laborRecords.reduce((acc, curr) => acc + Number(curr.regular_hours), 0);
  const totalOt = laborRecords.reduce((acc, curr) => acc + Number(curr.overtime_hours), 0);
  const totalMaterial = expenseRecords.reduce((acc, curr) => acc + Number(curr.material_cost), 0);

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 print:p-0 print:bg-white font-sans text-slate-200">
      
      <div className="print:hidden">
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/financial/tracking-maintenance')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">{projectName}</h1>
              <p className="text-sm text-slate-400 mt-0.5">Separate tracking for labor hours and material/expense costs.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => openModalNew('labor')}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors border border-sky-500 shadow-lg"
            >
              <Plus size={18} /> Add Worker Hours
            </button>
            <button 
              onClick={() => openModalNew('expense')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors border border-amber-500 shadow-lg"
            >
              <Plus size={18} /> Add Material / Expense
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#00d084] hover:bg-[#00b370] text-slate-900 font-bold rounded-lg transition-colors shadow-lg shadow-[#00d084]/20"
            >
              <Printer size={18} /> Print PDF
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700 shadow-lg">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Labor Hours (Crew)</p>
            <h3 className="text-3xl font-black text-white">{totalReg + totalOt} hrs</h3>
            <p className="text-sm text-sky-400 mt-1 font-medium">{totalReg} Reg / <span className="text-amber-400 font-bold">{totalOt} OT</span></p>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-700 shadow-lg">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Material & Expenses</p>
            <h3 className="text-3xl font-black text-[#00d084]">${totalMaterial.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
            <p className="text-sm text-slate-400 mt-1 font-medium">Accumulated</p>
          </div>
        </div>

        {/* TABLA 1: HORAS */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-lg overflow-hidden mb-8">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <Users size={16} /> Employee Labor Hours
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0f172a] text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Task Description</th>
                  <th className="px-5 py-3 font-semibold text-center">Reg Hours</th>
                  <th className="px-5 py-3 font-semibold text-center">OT Hours</th>
                  <th className="px-5 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-6 text-center text-slate-400">Loading...</td></tr>
                ) : laborRecords.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-6 text-center text-slate-500 italic">No labor hours recorded yet.</td></tr>
                ) : (
                  laborRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 text-slate-400 text-xs">{r.project_date}</td>
                      <td className="px-5 py-3 font-bold text-white">{r.worker_name}</td>
                      <td className="px-5 py-3 text-slate-300">{r.description}</td>
                      <td className="px-5 py-3 text-center text-slate-200 font-semibold">{r.regular_hours}h</td>
                      <td className="px-5 py-3 text-center text-amber-400 font-bold">{r.overtime_hours}h</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openModalEdit(r, 'labor')} className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors">
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

        {/* TABLA 2: GASTOS */}
        <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Receipt size={16} /> Material Expenses & Parts
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#0f172a] text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Expense Detail / Item</th>
                  <th className="px-5 py-3 font-semibold text-right">Cost ($)</th>
                  <th className="px-5 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {loading ? (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-400">Loading...</td></tr>
                ) : expenseRecords.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-500 italic">No material expenses recorded yet.</td></tr>
                ) : (
                  expenseRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 text-slate-400 text-xs">{r.project_date}</td>
                      <td className="px-5 py-3 text-slate-300 font-medium">{r.description}</td>
                      <td className="px-5 py-3 text-right font-bold text-[#00d084]">
                        ${Number(r.material_cost).toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openModalEdit(r, 'expense')} className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 rounded-lg transition-colors">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-lg transition-colors">
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

        {/* MODAL INTELIGENTE DE CREACIÓN Y EDICIÓN */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] rounded-xl border border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="flex justify-between items-center p-5 border-b border-slate-700 bg-slate-800/50">
                <h3 className="text-lg font-bold text-white">
                  {editingRecordId ? 'Edit ' : 'Add '}
                  {modalType === 'labor' ? 'Worker Hours' : 'Material / Expense'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveRecord} className="p-5 space-y-4">
                
                {modalType === 'labor' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Worker Name</label>
                    <input required name="worker_name" value={formData.worker_name} onChange={handleInputChange} type="text" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-white focus:border-sky-500 focus:outline-none" placeholder="e.g. Danny" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">
                    {modalType === 'labor' ? 'Task Description' : 'Expense / Part Description'}
                  </label>
                  <input required name="description" value={formData.description} onChange={handleInputChange} type="text" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-white focus:border-sky-500 focus:outline-none" placeholder={modalType === 'labor' ? 'Assembly, wiring...' : 'Ducting, steel plates, per diem...'} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Date</label>
                    <input required name="project_date" value={formData.project_date} onChange={handleInputChange} type="date" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-white focus:border-sky-500 focus:outline-none" />
                  </div>

                  {modalType === 'expense' && (
                    <div>
                      <label className="block text-xs font-bold text-amber-400 mb-1 uppercase">Expense Cost ($)</label>
                      <input required name="material_cost" value={formData.material_cost} onChange={handleInputChange} type="number" step="0.01" className="w-full bg-[#0f172a] border border-amber-500 rounded-lg p-2.5 text-white focus:outline-none" placeholder="0.00" />
                    </div>
                  )}
                </div>

                {modalType === 'labor' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Regular Hours</label>
                      <input required name="regular_hours" value={formData.regular_hours} onChange={handleInputChange} type="number" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-white focus:border-sky-500 focus:outline-none" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-500 mb-1 uppercase">Overtime Hours (OT)</label>
                      <input required name="overtime_hours" value={formData.overtime_hours} onChange={handleInputChange} type="number" className="w-full bg-[#0f172a] border border-slate-600 rounded-lg p-2.5 text-white focus:border-amber-500 focus:outline-none" placeholder="0" />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-lg font-medium">Cancel</button>
                  <button type="submit" disabled={submitting} className="flex-1 bg-[#00d084] hover:bg-[#00b370] text-slate-900 p-2.5 rounded-lg font-bold flex justify-center items-center gap-2">
                    {submitting && <Loader2 className="animate-spin" size={16} />} {editingRecordId ? 'Update Entry' : 'Save Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* DOCUMENTO IMPRESO (PDF BLANCO) */}
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
            <h2 className="text-xl font-bold text-slate-800 uppercase">Project Financial & Labor Report</h2>
            <p className="text-sm text-slate-500 mt-1">Project: <span className="font-semibold text-slate-700">{projectName}</span></p>
            <p className="text-sm text-slate-500">Issued Date: {new Date().toLocaleDateString('en-US')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
            <p className="text-xs text-sky-600 font-bold uppercase tracking-wider mb-1">Total Labor Hours</p>
            <p className="text-3xl font-black text-sky-700">{totalReg + totalOt} hrs</p>
            <p className="text-xs text-sky-700 mt-1 font-semibold">{totalReg} Regular / {totalOt} Overtime (OT)</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Material & Expenses</p>
            <p className="text-3xl font-black text-emerald-700">${totalMaterial.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
          </div>
        </div>

        {/* TABLA 1 IMPRESA: HORAS */}
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">1. Employee Labor Hours</h3>
        <table className="w-full text-left border-collapse mb-8">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-2.5 text-xs font-bold uppercase">Date</th>
              <th className="p-2.5 text-xs font-bold uppercase">Employee</th>
              <th className="p-2.5 text-xs font-bold uppercase">Task Description</th>
              <th className="p-2.5 text-xs font-bold uppercase text-center">Reg Hours</th>
              <th className="p-2.5 text-xs font-bold uppercase text-center">OT Hours</th>
            </tr>
          </thead>
          <tbody>
            {laborRecords.map((r) => (
              <tr key={r.id} className="border-b border-slate-200">
                <td className="p-2.5 text-sm text-slate-600">{r.project_date}</td>
                <td className="p-2.5 text-sm font-bold text-slate-800">{r.worker_name}</td>
                <td className="p-2.5 text-sm text-slate-600">{r.description}</td>
                <td className="p-2.5 text-sm text-slate-800 font-bold text-center">{r.regular_hours}h</td>
                <td className="p-2.5 text-sm text-amber-600 font-bold text-center">{r.overtime_hours}h</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TABLA 2 IMPRESA: GASTOS */}
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">2. Material Expenses & Parts</h3>
        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-2.5 text-xs font-bold uppercase">Date</th>
              <th className="p-2.5 text-xs font-bold uppercase">Expense Detail</th>
              <th className="p-2.5 text-xs font-bold uppercase text-right">Cost ($)</th>
            </tr>
          </thead>
          <tbody>
            {expenseRecords.map((r) => (
              <tr key={r.id} className="border-b border-slate-200">
                <td className="p-2.5 text-sm text-slate-600">{r.project_date}</td>
                <td className="p-2.5 text-sm text-slate-800 font-medium">{r.description}</td>
                <td className="p-2.5 text-sm text-emerald-700 font-bold text-right">
                  ${Number(r.material_cost).toLocaleString('en-US', {minimumFractionDigits: 2})}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-16 pt-8 flex justify-around print:break-inside-avoid">
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