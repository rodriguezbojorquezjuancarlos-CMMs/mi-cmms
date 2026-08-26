// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Plus, ChevronRight, MapPin, Building2 } from "lucide-react"

export default function ListaObrasPage() {
  const [proyectos, setProyectos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarProyectos()
  }, [])

  async function cargarProyectos() {
    setCargando(true)
    const { data } = await supabase
      .from("proyectos")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) setProyectos(data)
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Panel de Contratista
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-2">Mis Obras y Proyectos</h1>
            <p className="text-slate-400 text-sm mt-1">Selecciona una obra para supervisar gastos, facturas y presupuesto.</p>
          </div>

          <Link href={"/obras/nueva" as any} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Plus size={20} /> Nueva Obra
          </Link>
        </div>

        {/* LISTA DE OBRAS */}
        {cargando ? (
          <div className="text-center py-20 text-emerald-400 font-bold animate-pulse">Cargando tus obras...</div>
        ) : proyectos.length === 0 ? (
          <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            No hay obras registradas. Haz clic en "Nueva Obra" para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((p) => (
              <Link href={`/obras/${p.id}` as any} key={p.id} className="group">
                <div className="bg-[#0B1221] border border-slate-800 group-hover:border-emerald-500/50 rounded-3xl p-6 shadow-lg transition-all relative overflow-hidden flex flex-col justify-between h-56">
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.estatus || 'Activo'}
                      </span>
                      <ChevronRight className="text-slate-600 group-hover:text-emerald-400 transition-colors" size={20} />
                    </div>

                    <h3 className="text-xl font-black text-white mb-1 group-hover:text-emerald-400 transition-colors">{p.nombre}</h3>
                    <p className="text-slate-400 text-xs flex items-center gap-1">
                      <MapPin size={13} className="text-emerald-500" /> {p.ubicacion || 'Sin ubicación'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-500">Cliente</p>
                      <p className="text-sm font-bold text-slate-200">{p.cliente || 'General'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Presupuesto</p>
                      <p className="text-sm font-black text-emerald-400">${Number(p.presupuesto_estimado || 0).toLocaleString('es-MX')}</p>
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}