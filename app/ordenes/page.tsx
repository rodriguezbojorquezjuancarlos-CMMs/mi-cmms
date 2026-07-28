// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todas') // 'todas', 'preventivo', 'correctivo'

  useEffect(() => {
    async function cargarOrdenes() {
      const { data } = await supabase
        .from("ordenes_trabajo")
        .select("*, equipos(nombre)")
        .order("creado_at", { ascending: false })
      
      if (data) setOrdenes(data)
      setCargando(false)
    }
    cargarOrdenes()
  }, [])

  // Filtrado en tiempo real (Logic remains in Spanish for DB match)
  const ordenesFiltradas = ordenes.filter(orden => {
    if (filtro === 'preventivo') return orden.tipo_mantenimiento === 'Preventivo';
    if (filtro === 'correctivo') return orden.tipo_mantenimiento !== 'Preventivo'; // Todo lo que no sea PM
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER CORPORATIVO */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Work Orders</h1>
            <p className="text-slate-400 text-sm mt-1">Operational management center and ticket tracking</p>
          </div>
        </div>
        
        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-4">
          {/* BOTÓN HACIA EL PLAN MAESTRO */}
          <Link href="/planeacion" className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/30 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Master Plan
          </Link>
          
          <Link href="/reportar" className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Report Urgent Fault
          </Link>
        </div>
      </div>

      {/* PANEL DE CONTROL / LISTA DE ÓRDENES */}
      <div className="bg-[#0B1121] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Pestañas visuales de filtrado (AHORA FUNCIONALES) */}
        <div className="flex gap-6 px-8 py-5 border-b border-slate-800 text-sm font-bold text-slate-400">
          <button onClick={() => setFiltro('todas')} className={`pb-1 transition-colors ${filtro === 'todas' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-white'}`}>All Orders</button>
          <button onClick={() => setFiltro('preventivo')} className={`pb-1 transition-colors ${filtro === 'preventivo' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-white'}`}>Preventive</button>
          <button onClick={() => setFiltro('correctivo')} className={`pb-1 transition-colors flex items-center gap-2 ${filtro === 'correctivo' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-white'}`}>
            Corrective <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[10px]">New</span>
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-8 py-4">ID / Equipment</th>
                <th className="px-6 py-4">Ticket Type</th>
                <th className="px-6 py-4">Fault / Activity to perform</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-8 py-4 text-right">Execution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {cargando ? (
                <tr><td colSpan={5} className="p-8 text-center text-emerald-400 animate-pulse font-bold">Loading operational database...</td></tr>
              ) : ordenesFiltradas.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No work orders in this category.</td></tr>
              ) : (
                ordenesFiltradas.map(orden => {
                  
                  // Traducción visual rápida para el estatus
                  let estatusVisual = orden.estatus;
                  if (orden.estatus === 'Cerrada') estatusVisual = 'Closed';
                  if (orden.estatus === 'En Proceso' || orden.estatus === 'En Progreso') estatusVisual = 'In Progress';
                  if (orden.estatus === 'Abierta') estatusVisual = 'Open';
                  if (orden.estatus === 'Pendiente') estatusVisual = 'Pending';
                  if (!orden.estatus) estatusVisual = 'Pending';

                  return (
                    <tr key={orden.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-white text-base truncate max-w-[200px] md:max-w-none">{orden.equipos?.nombre || 'Unknown Equipment'}</div>
                        <div className="text-xs text-slate-500 font-mono mt-1">WO-{orden.id.substring(0,6).toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-5">
                        {orden.tipo_mantenimiento === 'Preventivo' ? (
                           <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest">
                             Preventive
                           </span>
                        ) : (
                           <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest">
                             Corrective
                           </span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-xs md:max-w-md truncate text-slate-300 font-medium">
                          {orden.descripcion_falla || 'No detailed description'}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            orden.estatus === 'Cerrada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                            (orden.estatus === 'En Proceso' || orden.estatus === 'En Progreso') ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
                            'bg-slate-800 text-slate-400 border-slate-700'
                         }`}>
                           {estatusVisual}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link href={`/ordenes/${orden.id}`} className="inline-flex items-center gap-2 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 hover:border-emerald-500 px-5 py-2.5 rounded-lg text-xs font-bold transition-all group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}