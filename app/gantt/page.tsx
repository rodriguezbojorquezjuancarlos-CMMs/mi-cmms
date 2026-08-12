// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function GanttPage() {
  const router = useRouter()
  const [planes, setPlanes] = useState<any[]>([])
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  const mesesAnio = [
    { nombre: 'Jan', semanas: [1, 2, 3, 4] },
    { nombre: 'Feb', semanas: [5, 6, 7, 8] },
    { nombre: 'Mar', semanas: [9, 10, 11, 12, 13] },
    { nombre: 'Apr', semanas: [14, 15, 16, 17] },
    { nombre: 'May', semanas: [18, 19, 20, 21, 22] },
    { nombre: 'Jun', arraySemanas: [23, 24, 25, 26] }, // Alias interno para mapeo
    { nombre: 'Jul', semanas: [27, 28, 29, 30] },
    { nombre: 'Aug', semanas: [31, 32, 33, 34, 35] },
    { nombre: 'Sep', semanas: [36, 37, 38, 39] },
    { nombre: 'Oct', semanas: [40, 41, 42, 43, 44] },
    { nombre: 'Nov', semanas: [45, 46, 47, 48] },
    { nombre: 'Dec', semanas: [49, 50, 51, 52] }
  ]

  // Fix rápido para el alias de Junio
  mesesAnio[5].semanas = [23, 24, 25, 26];

  // FUNCIÓN BLINDADA CONTRA FECHAS
  const getNumeroSemana = (fechaStr: string) => {
    if (!fechaStr) return -1; 
    try {
      const date = new Date(fechaStr);
      if (isNaN(date.getTime())) return -1;
      date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    } catch (e) {
      return -1;
    }
  }

  const semanaActual = getNumeroSemana(new Date().toISOString());

  useEffect(() => {
    async function cargarCronograma() {
      const { data: dataPlanes } = await supabase.from("plan_maestro").select("*, equipos(nombre)").order("equipo_id", { ascending: true })
      if (dataPlanes) setPlanes(dataPlanes)

      // Filtramos por Preventivo (que es la palabra clave en tu base de datos para este módulo)
      const { data: dataOrdenes } = await supabase.from("ordenes_trabajo").select("id, equipo_id, estatus, creado_at, descripcion_falla").eq("tipo_mantenimiento", "Preventivo")
      if (dataOrdenes) setOrdenes(dataOrdenes)
      
      setCargando(false)
    }
    cargarCronograma()
  }, [])

  // 👇 AHORA ENTIENDE INGLÉS NATIVO 👇
  const checarSiEsProgramado = (frecuencia: string, semana: number) => {
    const f = frecuencia?.toLowerCase() || 'monthly'
    if (f === 'weekly') return true;
    if (f === 'bi-weekly') return semana % 2 !== 0; // Semanas impares (1, 3, 5...)
    const semanasMes = [1, 5, 9, 14, 18, 23, 27, 31, 36, 40, 45, 49]; 
    if (f === 'monthly') return semanasMes.includes(semana);
    if (f === 'quarterly') return [1, 14, 27, 40].includes(semana);
    if (f === 'biannual') return [1, 27].includes(semana);
    if (f === 'annual') return semana === 1;
    return false;
  }

  if (cargando) return <div className="p-8 text-emerald-400 font-bold animate-pulse text-center mt-20">Analyzing annual maintenance schedule...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* HEADER CORPORATIVO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Gantt Schedule (Master Plan)</h1>
            <p className="text-slate-400 text-sm mt-1">Annual weekly control. Click on records to open reports and evidence.</p>
          </div>
        </div>

        <div className="flex gap-4 bg-[#0B1221] border border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-300 shadow-xl">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Completed</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-sm animate-pulse"></div> In Progress</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 border border-slate-600 border-dashed rounded-sm"></div> Scheduled</div>
        </div>
      </div>

      <div className="bg-[#0B1221] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
        <div className="overflow-x-auto relative z-10 custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 sticky left-0 bg-[#0B1221] z-30 w-72 shadow-[4px_0_15px_rgba(0,0,0,0.5)] border-r border-slate-800">
                  Machine & Activity
                </th>
                {mesesAnio.map((mes) => (
                  <th key={mes.nombre} colSpan={mes.semanas.length} className="px-2 py-4 text-center border-l border-slate-800">
                    {mes.nombre}
                  </th>
                ))}
              </tr>
            </thead>

            <thead className="bg-slate-900/40 text-slate-500 text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-6 py-2.5 sticky left-0 bg-[#0B1221] z-30 shadow-[4px_0_15px_rgba(0,0,0,0.5)] border-r border-slate-800 text-xs text-slate-400">
                  Frequency
                </th>
                {mesesAnio.map((mes) => (
                  mes.semanas.map(semana => (
                    <th key={semana} className={`py-2 text-center min-w-[36px] border-l border-slate-800/80 ${semana === semanaActual ? 'bg-indigo-500/20 text-indigo-300 font-black' : ''}`}>
                      W{semana}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {planes.length === 0 ? (
                <tr><td colSpan={53} className="px-8 py-12 text-center text-slate-500 italic">No master plans registered.</td></tr>
              ) : (
                planes.map((plan) => (
                  <tr key={plan.id} className="hover:bg-white/[0.02] transition-colors group">
                    
                    <td className="px-6 py-4 sticky left-0 bg-[#0B1221] group-hover:bg-[#0D1526] transition-colors z-20 shadow-[4px_0_15px_rgba(0,0,0,0.4)] border-r border-slate-800">
                      <div className="font-bold text-white text-sm truncate w-64">{plan.equipos?.nombre || "No equipment"}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-400 truncate w-40">{plan.Tarea}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                          {plan.Frecuencia}
                        </span>
                      </div>
                    </td>

                    {mesesAnio.map((mes) => (
                      mes.semanas.map(semana => {
                        const esProgramado = checarSiEsProgramado(plan.Frecuencia, semana);
                        
                        const otDeLaSemana = ordenes.find(o => {
                          const isSameEquipo = o.equipo_id === plan.equipo_id;
                          const isSameTask = o.descripcion_falla && plan.Tarea && o.descripcion_falla.toLowerCase().includes(plan.Tarea.toLowerCase());
                          const isSameWeek = getNumeroSemana(o.creado_at) === semana;
                          return isSameEquipo && isSameTask && isSameWeek;
                        });

                        // Iniciales del día en inglés (MO, TU, WE...)
                        const diaCorto = plan.dia_semana ? plan.dia_semana.substring(0, 2).toUpperCase() : '';

                        return (
                          <td key={semana} className={`p-1.5 border-l border-slate-800/50 relative ${semana === semanaActual ? 'bg-indigo-500/10' : ''}`}>
                            
                            {otDeLaSemana ? (
                              <div 
                                onClick={() => router.push(`/ordenes/${otDeLaSemana.id}`)}
                                title={`View Report: ${otDeLaSemana.estatus === 'Closed' || otDeLaSemana.estatus === 'Cerrada' ? 'Closed' : 'Open'}`}
                                className={`w-full h-8 rounded-lg shadow-md relative z-10 flex items-center justify-center cursor-pointer transition-transform hover:scale-125 border ${
                                  otDeLaSemana.estatus === 'Closed' || otDeLaSemana.estatus === 'Cerrada'
                                    ? 'bg-emerald-600 border-emerald-400/50 shadow-emerald-900/40 text-white' 
                                    : 'bg-amber-600 border-amber-400/50 shadow-amber-900/40 animate-pulse text-white'
                                }`}
                              >
                                {(otDeLaSemana.estatus === 'Closed' || otDeLaSemana.estatus === 'Cerrada') && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                            ) : esProgramado ? (
                              <div className="w-full h-8 border border-slate-700 border-dashed bg-slate-900/50 rounded-lg relative z-10 flex items-center justify-center text-[9px] font-bold text-slate-500" title={`Scheduled for ${plan.dia_semana}`}>
                                {diaCorto}
                              </div>
                            ) : null}
                          </td>
                        )
                      })
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}