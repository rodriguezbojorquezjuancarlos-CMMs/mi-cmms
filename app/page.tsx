// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Plus, ChevronRight, MapPin, Trash2, X } from "lucide-react"

export default function Home() {
  const [proyectos, setProyectos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [nuevoNombre, setNuevoNombre] = useState("")
  const [nuevoCliente, setNuevoCliente] = useState("")
  const [nuevaUbicacion, setNuevaUbicacion] = useState("")
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState("")
  const [mostrarModal, setMostrarModal] = useState(false)
  const [guardando, setGuardando] = useState(false)

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

  const crearProyecto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoNombre) return
    setGuardando(true)

    try {
      const { error } = await supabase
        .from("proyectos")
        .insert([{
          nombre: nuevoNombre,
          cliente: nuevoCliente,
          ubicacion: nuevaUbicacion,
          presupuesto_estimado: parseFloat(nuevoPresupuesto) || 0,
          estatus: "Activo"
        }])

      if (error) throw error

      setNuevoNombre("")
      setNuevoCliente("")
      setNuevaUbicacion("")
      setNuevoPresupuesto("")
      setMostrarModal(false)
      cargarProyectos()
    } catch (err: any) {
      alert("Error al crear obra: " + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminarProyecto = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm("¿Estás seguro de eliminar esta obra?")) return

    const { error } = await supabase.from("proyectos").delete().eq("id", id)
    if (!error) cargarProyectos()
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Control Financiero de Obras
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-2">Todas Mis Obras</h1>
            <p className="text-slate-400 text-sm mt-1">Selecciona una obra para ver su detalle financiero y control de gastos.</p>
          </div>

          <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Plus size={20} /> Nueva Obra
          </button>
        </div>

        {/* LISTA DE OBRAS */}
        {cargando ? (
          <div className="text-center py-20 text-emerald-400 font-bold animate-pulse">Cargando tus obras...</div>
        ) : proyectos.length === 0 ? (
          <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            No hay obras registradas aún. Haz clic en "Nueva Obra" para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((p) => (
              <Link href={`/obras/${p.id}` as any} key={p.id} className="group">
                <div className="bg-[#0B1221] border border-slate-800 group-hover:border-emerald-500/50 rounded-3xl p-6 shadow-lg transition-all relative overflow-hidden flex flex-col justify-between h-56">
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        p.estatus === 'En Pausa' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        p.estatus === 'Terminado' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {p.estatus || 'Activo'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => eliminarProyecto(p.id, e)} className="text-slate-600 hover:text-red-400 p-1 transition-colors">
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight className="text-slate-600 group-hover:text-emerald-400 transition-colors" size={20} />
                      </div>
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

        {/* MODAL NUEVA OBRA */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setMostrarModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={24} /></button>
              <h2 className="text-xl font-black text-white mb-6">Registrar Nueva Obra</h2>
              
              <form onSubmit={crearProyecto} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre de la Obra</label>
                  <input required type="text" placeholder="Ej. Casa Tijuana" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cliente / Propietario</label>
                  <input type="text" placeholder="Ej. Familia Pérez" value={nuevoCliente} onChange={(e) => setNuevoCliente(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Ubicación</label>
                  <input type="text" placeholder="Ej. Tijuana, B.C." value={nuevaUbicacion} onChange={(e) => setNuevaUbicacion(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Presupuesto Asignado ($ MXN)</label>
                  <input required type="number" step="0.01" placeholder="150000" value={nuevoPresupuesto} onChange={(e) => setNuevoPresupuesto(e.target.value)} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-emerald-400 font-black text-lg outline-none" />
                </div>
                <button type="submit" disabled={guardando} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl mt-6">
                  {guardando ? "Creando..." : "CREAR OBRA"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}