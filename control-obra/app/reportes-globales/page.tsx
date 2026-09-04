'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Printer, FileText, Filter } from 'lucide-react'; 

export default function GlobalReports() {
  const [tipoReporte, setTipoReporte] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [datosReporte, setDatosReporte] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  const handleGenerarReporte = async () => {
    setCargando(true);
    try {
      let query = supabase
        .from('ordenes_trabajo')
        .select('id, descripcion_falla, estatus, tipo_mantenimiento, creado_at, equipos(nombre)'); 

      // Las opciones internas de la BD siguen en español
      if (tipoReporte !== 'Todos') {
        query = query.eq('tipo_mantenimiento', tipoReporte);
      }

      if (fechaInicio) {
        query = query.gte('creado_at', `${fechaInicio}T00:00:00Z`);
      }
      if (fechaFin) {
        query = query.lte('creado_at', `${fechaFin}T23:59:59Z`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Database error details:", error);
        throw error;
      }
      
      setDatosReporte(data || []);
    } catch (error: any) {
      console.error("Failed to fetch:", error);
      alert(`Database error: ${error?.message || 'Check the console'}`);
    } finally {
      setCargando(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 print:p-0 print:bg-white">
      
      {/* 1. CONTROL PANEL */}
      <div className="print:hidden mb-8 bg-[#0f172a] p-6 rounded-xl shadow-lg border border-slate-800 text-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <Filter className="text-[#00d084]" />
          <h2 className="text-xl font-bold text-white tracking-wide">Global Reports Generator</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Maintenance Type</label>
            <select 
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 focus:ring-2 focus:ring-[#00d084] focus:outline-none"
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
            >
              <option value="Todos">All Records</option>
              <option value="Preventivo">Preventive</option>
              <option value="Correctivo">Corrective</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
            <input 
              type="date" 
              className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-[#00d084] focus:outline-none"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">End Date</label>
            <input 
              type="date" 
              className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-lg p-2.5 focus:ring-2 focus:ring-[#00d084] focus:outline-none"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleGenerarReporte}
              disabled={cargando}
              className="flex-1 bg-slate-700 text-white p-2.5 rounded-lg font-medium hover:bg-slate-600 flex justify-center items-center gap-2 transition-colors disabled:opacity-50">
              <FileText size={18} /> {cargando ? 'Loading...' : 'Generate'}
            </button>
            <button 
              onClick={handleImprimir}
              className="flex-1 bg-[#00d084] text-slate-900 p-2.5 rounded-lg font-bold hover:bg-[#00b370] flex justify-center items-center gap-2 transition-colors shadow-lg shadow-[#00d084]/20">
              <Printer size={18} /> Print PDF
            </button>
          </div>
        </div>
      </div>

      {/* 2. OFFICIAL WHITE DOCUMENT */}
      <div className="max-w-5xl mx-auto bg-white p-10 shadow-2xl rounded-sm print:shadow-none print:p-0 print:w-full">
        
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-[#00d084] rounded-sm"></div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">KINETIX <span className="font-light">Pro</span></h1>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">JBI Manufacturing Operations</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800 uppercase">Executive Summary</h2>
            <p className="text-sm text-slate-500 mt-1">
              Category: <span className="font-semibold text-slate-700">
                {tipoReporte === 'Todos' ? 'All Records' : tipoReporte === 'Preventivo' ? 'Preventive' : 'Corrective'}
              </span>
            </p>
            <p className="text-sm text-slate-500">
              Period: {fechaInicio ? fechaInicio : 'Historical'} to {fechaFin ? fechaFin : 'Present'}
            </p>
            <p className="text-sm text-slate-500">Issued Date: {new Date().toLocaleDateString('en-US')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Work Orders</p>
            <p className="text-3xl font-black text-slate-800">{datosReporte.length}</p>
          </div>
          <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Completed</p>
            <p className="text-3xl font-black text-emerald-600">
              {datosReporte.filter(ot => ot.estatus === 'Completada' || ot.estatus === 'Cerrada').length}
            </p>
          </div>
          <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100">
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Pending / Open</p>
            <p className="text-3xl font-black text-amber-500">
              {datosReporte.filter(ot => ot.estatus !== 'Completada' && ot.estatus !== 'Cerrada').length}
            </p>
          </div>
        </div>

        <table className="w-full text-left border-collapse mb-10">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-3 text-xs font-bold uppercase tracking-wider rounded-tl-md">WO #</th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider">Date</th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider">Asset / Equipment</th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider">Issue Description</th>
              <th className="p-3 text-xs font-bold uppercase tracking-wider rounded-tr-md">Status</th>
            </tr>
          </thead>
          <tbody>
            {datosReporte.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 italic border-b border-slate-200">
                  No records found. Select a filter and press "Generate".
                </td>
              </tr>
            ) : (
              datosReporte.map((orden) => {
                const isCompleted = orden.estatus === 'Completada' || orden.estatus === 'Cerrada';
                
                return (
                  <tr key={orden.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-3 text-sm text-slate-800 font-bold">#{String(orden.id).substring(0,6)}</td>
                    <td className="p-3 text-sm text-slate-600">{new Date(orden.creado_at).toLocaleDateString('en-US')}</td>
                    <td className="p-3 text-sm text-slate-600 font-medium">{orden.equipos?.nombre || 'N/A'}</td>
                    <td className="p-3 text-sm text-slate-600">{orden.descripcion_falla || 'No description provided'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        isCompleted 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isCompleted ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="mt-24 pt-8 flex justify-around print:break-inside-avoid">
          <div className="text-center w-56">
            <div className="border-b-2 border-slate-800 mb-2 h-8"></div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Shift Supervisor</p>
          </div>
          <div className="text-center w-56">
            <div className="border-b-2 border-slate-800 mb-2 h-8"></div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Plant Management</p>
          </div>
        </div>

      </div>
    </div>
  );
}