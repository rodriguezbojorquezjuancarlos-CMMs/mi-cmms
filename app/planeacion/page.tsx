// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function PlaneacionPage() {
  const [equipos, setEquipos] = useState<any[]>([])
  const [planes, setPlanes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [generandoId, setGenerandoId] = useState<string | null>(null)

  // Estados del formulario (Internal values kept in Spanish for DB)
  const [equipoId, setEquipoId] = useState("")
  const [tarea, setTarea] = useState("")
  const [frecuencia, setFrecuencia] = useState("Mensual")
  const [diaSugerido, setDiaSugerido] = useState("Lunes")

  // Visual dictionaries for rendering English text
  const freqMap: Record<string, string> = {
    'Semanal': 'Weekly',
    'Mensual': 'Monthly',
    'Trimestral': 'Quarterly',
    'Semestral': 'Biannual',
    'Anual': 'Annual'
  }

  const dayMap: Record<string, string> = {
    'Lunes': 'Monday',
    'Martes': 'Tuesday',
    'Miércoles': 'Wednesday',
    'Jueves': 'Thursday',
    'Viernes': 'Friday',
    'Sábado': 'Saturday',
    'Domingo': 'Sunday'
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: dataEquipos } = await supabase.from("equipos").select("*")
    if (dataEquipos) setEquipos(dataEquipos)

    const { data: dataPlanes } = await supabase.from("plan_maestro").select("*, equipos(nombre)").order("id", { ascending: false })
    if (dataPlanes) setPlanes(dataPlanes)
    
    setCargando(false)
  }

  async function guardarPlan(e: React.FormEvent) {
    e.preventDefault()
    if (!equipoId || !tarea) return alert("Please fill in all required fields")

    const { error } = await supabase.from("plan_maestro").insert([
      { equipo_id: equipoId, Tarea: tarea, Frecuencia: frecuencia, dia_semana: diaSugerido }
    ])

    if (error) {
      alert("Error saving: " + error.message)
    } else {
      setTarea("")
      cargarDatos() 
    }
  }

// FUNCIÓN BLINDADA PARA UUID MULTI-EMPRESA
  async function generarOTManual(plan: any) {
    setGenerandoId(plan.id)
    
    try {
      // 1. Primero averiguamos a qué empresa pertenece este equipo
      const { data: equipo } = await supabase
        .from("equipos")
        .select("empresa_id")
        .eq("id", plan.equipo_id)
        .single()
      
      let empresaIdValido = equipo?.empresa_id;

      // 2. Si el equipo NO tiene empresa asignada, buscamos el UUID de tu primera empresa real
      if (!empresaIdValido) {
        const { data: empresaFallback } = await supabase.from("empresas").select("id").limit(1).single();
        empresaIdValido = empresaFallback?.id;
      }

      // Si de plano no hay ninguna empresa en la base de datos, frenamos aquí
      if (!empresaIdValido) {
         alert("❌ Error: You don't have any company created in your 'empresas' Supabase table.");
         setGenerandoId(null);
         return;
      }
      
      // 3. Armamos la orden inyectando el empresa_id correcto (UUID real)
      const nuevaOrden = {
        equipo_id: plan.equipo_id,
        empresa_id: empresaIdValido,
        tipo_mantenimiento: 'Preventivo',
        descripcion_falla: `Maintenance per plan: ${plan.Tarea}`,
        estatus: 'Abierta'
      }

      // 4. La mandamos a Supabase
      const { error } = await supabase.from("ordenes_trabajo").insert([nuevaOrden])
      
      if (error) {
        alert("❌ Error generating the order: " + error.message)
      } else {
        alert(`✅ Preventive Order successfully generated for ${plan.equipos?.nombre}!`)
      }
    } catch (err: any) {
      alert("❌ Unexpected error: " + err.message)
    } finally {
      setGenerandoId(null)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Master Planning</h1>
            <p className="text-slate-400 text-sm mt-1">Configure preventive routines for your equipment</p>
          </div>
        </div>
        
        <Link href="/ordenes" className="bg-[#0B1121] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Orders
        </Link>
      </div>

      {/* FORMULARIO DE ALTA */}
      <div className="bg-[#0B1121] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <form onSubmit={guardarPlan} className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Equipment</label>
              <select value={equipoId} onChange={(e) => setEquipoId(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-white focus:border-indigo-500 outline-none cursor-pointer">
                <option value="">Select an equipment...</option>
                {equipos.map(eq => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Task Name</label>
              <input type="text" value={tarea} onChange={(e) => setTarea(e.target.value)} placeholder="E.g., Oil Change / Quarterly PM" className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-white focus:border-indigo-500 outline-none placeholder:text-slate-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Frequency</label>
              <select value={frecuencia} onChange={(e) => setFrecuencia(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-white focus:border-indigo-500 outline-none cursor-pointer">
                <option value="Semanal" className="bg-slate-900">Weekly</option>
                <option value="Mensual" className="bg-slate-900">Monthly</option>
                <option value="Trimestral" className="bg-slate-900">Quarterly</option>
                <option value="Semestral" className="bg-slate-900">Biannual</option>
                <option value="Anual" className="bg-slate-900">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Suggested Day</label>
              <select value={diaSugerido} onChange={(e) => setDiaSugerido(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-white focus:border-indigo-500 outline-none cursor-pointer">
                <option value="Lunes" className="bg-slate-900">Monday</option>
                <option value="Martes" className="bg-slate-900">Tuesday</option>
                <option value="Miércoles" className="bg-slate-900">Wednesday</option>
                <option value="Jueves" className="bg-slate-900">Thursday</option>
                <option value="Viernes" className="bg-slate-900">Friday</option>
                <option value="Sábado" className="bg-slate-900">Saturday</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            + Save Maintenance Plan
          </button>
        </form>
      </div>

      {/* TABLA DE PLANES */}
      <div className="bg-[#0B1121] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-8 py-5">Equipment / Asset</th>
                <th className="px-6 py-5">Scheduled Task</th>
                <th className="px-6 py-5 text-center">Frequency</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {cargando ? (
                <tr><td colSpan={4} className="p-8 text-center text-indigo-400 animate-pulse font-bold">Loading preventive routines...</td></tr>
              ) : planes.map(plan => (
                <tr key={plan.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5 font-bold text-white text-base truncate max-w-[200px]">{plan.equipos?.nombre || 'Unknown'}</td>
                  <td className="px-6 py-5 font-medium truncate max-w-[250px]">
                    {plan.Tarea}
                    <div className="text-xs text-slate-500 mt-1">Day: {dayMap[plan.dia_semana] || plan.dia_semana || 'Unassigned'}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {freqMap[plan.Frecuencia] || plan.Frecuencia}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button 
                      onClick={() => generarOTManual(plan)} 
                      disabled={generandoId === plan.id}
                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 px-5 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {generandoId === plan.id ? 'Generating...' : 'Generate Manual WO'}
                    </button>
                  </td>
                </tr>
              ))}
              {planes.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">No master plans registered.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}