// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"

export default function PerfilEquipoPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [equipo, setEquipo] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [planes, setPlanes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  // Control de pestañas: 'overview', 'historial', 'pm'
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function cargarPerfil() {
      // 1. Datos del equipo
      const { data: dataEquipo } = await supabase.from("equipos").select("*").eq("id", id).single()
      if (dataEquipo) setEquipo(dataEquipo)

      // 2. Historial de Órdenes (Tickets)
      const { data: dataHistorial } = await supabase.from("ordenes_trabajo").select("*").eq("equipo_id", id).order("creado_at", { ascending: false })
      if (dataHistorial) setHistorial(dataHistorial)

      // 3. Plan Maestro (Preventivos)
      const { data: dataPlanes } = await supabase.from("plan_maestro").select("*").eq("equipo_id", id)
      if (dataPlanes) setPlanes(dataPlanes)

      setCargando(false)
    }
    if (id) cargarPerfil()
  }, [id])

  if (cargando) return <div className="p-8 text-emerald-400 font-bold animate-pulse text-center mt-20">Analizando telemetría del equipo...</div>
  if (!equipo) return <div className="p-8 text-red-400 text-center mt-20 font-bold">Equipo no encontrado en el sistema.</div>

  const isOperativo = equipo.estado !== 'Falla' && equipo.estado !== 'Mantenimiento';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER: NAVEGACIÓN Y TÍTULO */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/equipos")} className="p-2 bg-[#0B1221] hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight">Detalles de Activo</h1>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 transition-all flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          Editar Ficha
        </button>
      </div>

      {/* TITULAR DEL EQUIPO (Estilo JWC Nexus) */}
      <div className="bg-[#0B1221] border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black text-white">{equipo.nombre}</h2>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${isOperativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
              <div className={`w-2 h-2 rounded-full ${isOperativo ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`}></div>
              {equipo.estado || 'Operativo'}
            </span>
          </div>
          <p className="text-slate-400 text-sm font-mono">ID: {equipo.id.substring(0,8).toUpperCase()} | S/N: {equipo.numero_serie || 'N/A'}</p>
        </div>
        
        <button onClick={() => router.push("/ordenes")} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Crear OT
        </button>
      </div>

      {/* PESTAÑAS (TABS) */}
      <div className="flex gap-8 border-b border-slate-800 px-2">
        <button onClick={() => setActiveTab('overview')} className={`pb-3 text-sm font-bold transition-all ${activeTab === 'overview' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>Visión General</button>
        <button onClick={() => setActiveTab('historial')} className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'historial' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
          Historial <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">{historial.length}</span>
        </button>
        <button onClick={() => setActiveTab('pm')} className={`pb-3 text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pm' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
          Plan Maestro <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">{planes.length}</span>
        </button>
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <div className="mt-6">
        
        {/* TAB: VISIÓN GENERAL */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#0B1221] border border-slate-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Imagen del Equipo */}
              <div className="col-span-1 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-center p-8 aspect-square relative group">
                {equipo.imagen_url ? (
                  <img src={equipo.imagen_url} alt={equipo.nombre} className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <div className="text-center text-slate-500">
                    <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    <p className="text-sm font-bold">Sin fotografía</p>
                  </div>
                )}
                <button className="absolute bottom-4 right-4 bg-slate-800 p-2 rounded-lg border border-slate-700 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                </button>
              </div>

              {/* Grid de Datos Técnicos */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Ubicación / Área</p>
                  <p className="text-sm text-slate-200 font-medium">{equipo.area || 'Planta Principal'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Fabricante</p>
                  <p className="text-sm text-slate-200 font-medium">{equipo.marca || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Modelo</p>
                  <p className="text-sm text-slate-200 font-medium">{equipo.modelo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Nivel de Criticidad</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${equipo.criticidad === 'Alta' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                    {equipo.criticidad || 'Media'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Potencia / Voltaje</p>
                  <p className="text-sm text-slate-200 font-medium font-mono">480 V / 3 Ph</p> {/* Dato simulado para estilo industrial */}
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Fecha de Instalación</p>
                  <p className="text-sm text-slate-200 font-medium">15 Sep, 2024</p> {/* Dato simulado */}
                </div>
              </div>
            </div>

            {/* Tarjetas Inferiores (Estilos de métricas rápidas) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800 transition-colors">
                <svg className="w-6 h-6 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <h4 className="text-xl font-black text-white">{historial.length}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">OTs Totales</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800 transition-colors">
                <svg className="w-6 h-6 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <h4 className="text-xl font-black text-white">{planes.length}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Rutinas PM</p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-800 transition-colors">
                <svg className="w-6 h-6 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                <h4 className="text-xl font-black text-white">24</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Refacciones</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-500/20 transition-colors">
                <svg className="w-6 h-6 text-emerald-400 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h4 className="text-lg font-black text-emerald-400">En Línea</h4>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">IoT Status</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: HISTORIAL DE ÓRDENES */}
        {activeTab === 'historial' && (
          <div className="bg-[#0B1221] border border-slate-800 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">ID de Ticket</th>
                  <th className="px-6 py-4">Falla / Motivo</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {historial.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay historial de mantenimiento para este equipo.</td></tr>
                ) : (
                  historial.map(orden => (
                    <tr key={orden.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">OT-{orden.id.substring(0,8).toUpperCase()}</td>
                      <td className="px-6 py-4 font-medium truncate max-w-[200px]">{orden.descripcion_falla}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${orden.tipo_mantenimiento === 'Preventivo' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-400'}`}>
                          {orden.tipo_mantenimiento}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${orden.estatus === 'Cerrada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                          {orden.estatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => router.push(`/ordenes/${orden.id}`)} className="text-slate-400 hover:text-emerald-400 transition-colors">
                           <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: PLAN MAESTRO */}
        {activeTab === 'pm' && (
          <div className="bg-[#0B1221] border border-slate-800 rounded-2xl p-6 animate-in slide-in-from-bottom-4 duration-300">
            {planes.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>No hay rutinas preventivas configuradas para este equipo.</p>
                <button onClick={() => router.push('/planeacion')} className="mt-4 text-emerald-400 font-bold hover:underline">Configurar en Plan Maestro</button>
              </div>
            ) : (
              <div className="space-y-4">
                {planes.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{plan.Tarea}</h4>
                        <p className="text-slate-500 text-xs mt-0.5">Día sugerido: {plan.dia_semana || 'Lunes'}</p>
                      </div>
                    </div>
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest">
                      {plan.Frecuencia}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}