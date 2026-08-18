// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Wallet, Hammer, Pickaxe, Receipt, Download, FileText, Image as ImageIcon, CheckCircle, Clock } from "lucide-react"

export default function DashboardTijuana() {
  const [gastos, setGastos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  // Métricas calculadas
  const [metricas, setMetricas] = useState({
    total: 0,
    materiales: 0,
    albanil: 0,
    miscelaneas: 0,
    pendientes: 0
  })

  useEffect(() => {
    cargarGastos()
  }, [])

  async function cargarGastos() {
    setCargando(true)
    const { data, error } = await supabase
      .from("gastos_tijuana")
      .select("*")
      .order("fecha", { ascending: false })

    if (data) {
      setGastos(data)
      
      // Calcular todos los totales para las tarjetas
      let tot = 0, mat = 0, alb = 0, misc = 0, pend = 0;
      
      data.forEach(g => {
        const monto = Number(g.monto)
        tot += monto
        if (g.categoria === 'Materiales') mat += monto
        if (g.categoria === 'Albañil') alb += monto
        if (g.categoria === 'Misceláneas') misc += monto
        if (g.estatus === 'Pendiente') pend++
      })

      setMetricas({ total: tot, materiales: mat, albanil: alb, miscelaneas: misc, pendientes: pend })
    }
    setCargando(false)
  }

  // Función rápida para que Rafael apruebe los gastos con 1 clic
  const aprobarGasto = async (id: string) => {
    const { error } = await supabase
      .from("gastos_tijuana")
      .update({ estatus: 'Aprobado' })
      .eq("id", id)
      
    if (!error) cargarGastos()
  }

  // Porcentajes para la barra visual
  const porcMateriales = metricas.total > 0 ? (metricas.materiales / metricas.total) * 100 : 0
  const porcAlbanil = metricas.total > 0 ? (metricas.albanil / metricas.total) * 100 : 0
  const porcMisc = metricas.total > 0 ? (metricas.miscelaneas / metricas.total) * 100 : 0

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200 p-4 md:p-8 font-sans pb-24">
      
      {/* HEADER GERENCIAL */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Proyecto Activo
            </span>
            <span className="text-slate-500 text-sm font-bold">Tijuana, B.C.</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Control Financiero</h1>
          <p className="text-slate-400 mt-1">Supervisión de gastos, facturas y flujo de capital.</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-bold transition-colors border border-slate-700">
            <FileText size={18} /> Exportar Excel
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Download size={18} /> Generar PDF
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet size={64} /></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Gasto Total Acumulado</p>
            <h3 className="text-4xl font-black text-white">${metricas.total.toLocaleString('es-MX')}</h3>
          </div>
          
          <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-500 group-hover:opacity-20 transition-opacity"><Hammer size={64} /></div>
            <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">Mano de Obra (Albañil)</p>
            <h3 className="text-3xl font-black text-white">${metricas.albanil.toLocaleString('es-MX')}</h3>
          </div>

          <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-amber-500 group-hover:opacity-20 transition-opacity"><Pickaxe size={64} /></div>
            <p className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-1">Materiales e Insumos</p>
            <h3 className="text-3xl font-black text-white">${metricas.materiales.toLocaleString('es-MX')}</h3>
          </div>

          <div className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mb-1">Tickets por Revisar</p>
            <h3 className="text-3xl font-black text-white flex items-center gap-3">
              {metricas.pendientes} <span className="text-sm font-medium text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">Pendientes</span>
            </h3>
          </div>
        </div>

        {/* BARRA DE DISTRIBUCIÓN VISUAL */}
        <div className="bg-[#0B1221] border border-slate-800 p-6 rounded-3xl shadow-lg">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Receipt size={18} className="text-slate-400"/> Distribución del Presupuesto</h3>
          <div className="w-full h-4 rounded-full flex overflow-hidden bg-slate-800">
            <div style={{ width: `${porcAlbanil}%` }} className="bg-emerald-500 h-full"></div>
            <div style={{ width: `${porcMateriales}%` }} className="bg-amber-500 h-full"></div>
            <div style={{ width: `${porcMisc}%` }} className="bg-purple-500 h-full"></div>
          </div>
          <div className="flex gap-6 mt-4 text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> <span className="text-slate-400">Albañil ({porcAlbanil.toFixed(1)}%)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> <span className="text-slate-400">Materiales ({porcMateriales.toFixed(1)}%)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> <span className="text-slate-400">Misceláneas ({porcMisc.toFixed(1)}%)</span></div>
          </div>
        </div>

        {/* TABLA DE GASTOS Y TICKETS */}
        <div className="bg-[#0B1221] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
            <h2 className="text-lg font-black text-white">Historial de Gastos y Comprobantes</h2>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-6 py-5">Fecha</th>
                  <th className="px-6 py-5">Concepto</th>
                  <th className="px-6 py-5">Categoría</th>
                  <th className="px-6 py-5">Registrado por</th>
                  <th className="px-6 py-5 text-right">Monto</th>
                  <th className="px-6 py-5 text-center">Ticket</th>
                  <th className="px-8 py-5 text-center">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {cargando ? (
                  <tr><td colSpan={7} className="p-12 text-center text-blue-400 animate-pulse font-bold">Cargando registros financieros...</td></tr>
                ) : gastos.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-500">No hay gastos registrados aún.</td></tr>
                ) : (
                  gastos.map(g => (
                    <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-5 text-slate-400 font-mono text-xs">{new Date(g.fecha).toLocaleDateString('es-MX')}</td>
                      <td className="px-6 py-5 font-bold text-white">{g.concepto}</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest 
                          ${g.categoria === 'Materiales' ? 'bg-amber-500/10 text-amber-400' : 
                            g.categoria === 'Albañil' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {g.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-slate-400">{g.registrado_por}</td>
                      <td className="px-6 py-5 text-right font-black text-white text-lg">${Number(g.monto).toLocaleString('es-MX')}</td>
                      
                      {/* Visualizador de Ticket */}
                      <td className="px-6 py-5 text-center">
                        {g.evidencia_url ? (
                          <a href={g.evidencia_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors">
                            <ImageIcon size={14} /> Ver Ticket
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs font-bold uppercase">Sin Ticket</span>
                        )}
                      </td>

                      {/* Estatus y Aprobación */}
                      <td className="px-8 py-5 text-center">
                        {g.estatus === 'Aprobado' ? (
                          <span className="flex items-center justify-center gap-1 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                            <CheckCircle size={14} /> Aprobado
                          </span>
                        ) : (
                          <button onClick={() => aprobarGasto(g.id)} className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors w-full shadow-lg">
                            <Clock size={14} /> Aprobar
                          </button>
                        )}
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
  )
}