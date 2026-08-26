// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Building2, Plus, MapPin, Wallet, ChevronRight, X } from "lucide-react"
import Link from "next/link"

export default function ListaObrasPage() {
  const [proyectos, setProyectos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  // Estados para el Modal de Nueva Obra
  const [mostrarModal, setMostrarModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [nuevoProyecto, setNuevoProyecto] = useState({
    nombre: "",
    cliente: "",
    ubicacion: "",
    presupuesto_estimado: ""
  })

  useEffect(() => {
    cargarProyectos()
  }, [])

  async function cargarProyectos() {
    setCargando(true)
    const { data, error } = await supabase
      .from("proyectos")
      .select("*")
      .order("creado_at", { ascending: false })

    if (data) {
      setProyectos(data)
    }
    setCargando(false)
  }

  const handleCrearProyecto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoProyecto.nombre) return
    setGuardando(true)

    try {
      const { error } = await supabase
        .from("proyectos")
        .insert([{
          nombre: nuevoProyecto.nombre,
          cliente: nuevoProyecto.cliente,
          ubicacion: nuevoProyecto.ubicacion,
          presupuesto_estimado: parseFloat(nuevoProyecto.presupuesto_estimado) || 0,
          estatus: "Activo"
        }])

      if (error) throw error

      setMostrarModal(false)
      setNuevoProyecto({ nombre: "", cliente: "", ubicacion: "", presupuesto_estimado: "" })
      cargarProyectos()
    } catch (err: any) {
      alert("Error al crear la obra: " + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-200 p-4 md:p-8 font-sans pb-24">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Panel de Contratista
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Mis Obras y Proyectos</h1>
          <p className="text-slate-400 mt-1">Selecciona una obra para supervisar gastos, facturas y presupuesto.</p>
        </div>

        <button 
          onClick={() => setMostrarModal(true)} 
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] w-full md:w-auto"
        >
          <Plus size={18} /> Nueva Obra
        </button>
      </div>

      {/* LISTA DE TARJETAS DE PROYECTOS */}
      <div className="max-w-7xl mx-auto">
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
                <div className="bg-[#0B1221] border border-slate-800 group-hover:border-emerald-500/50 rounded-3xl p-6 shadow-lg transition-all relative overflow-hidden flex flex-col justify-between h-full">
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {p.estatus || 'Activo'}
                      </span>
                      <ChevronRight className="text-slate-600 group-hover:text-emerald-400 transition-colors" size={20} />
                    </div>

                    <h3 className="text-xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">{p.nombre}</h3>
                    
                    <p className="text-slate-400 text-sm mb-1 flex items-center gap-1.5">
                      <MapPin size={14} className="text-emerald-500" /> {p.ubicacion || 'Sin ubicación'}
                    </p>
                    <p className="text-slate-500 text-xs mb-6">Cliente: <strong className="text-slate-300">{p.cliente || 'General'}</strong></p>
                  </div>

                  <div className="bg-[#070B14] border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Presupuesto</p>
                      <p className="text-lg font-black text-emerald-400 flex items-center gap-1">
                        <Wallet size={16} /> ${Number(p.presupuesto_estimado || 0).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* VENTANA MODAL PARA NUEVA OBRA */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setMostrarModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Building2 className="text-emerald-500" size={22} /> Registrar Nueva Obra
            </h2>
            
            <form onSubmit={handleCrearProyecto} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre del Proyecto</label>
                <input required type="text" placeholder="Ej. Casa Residencial Sur" value={nuevoProyecto.nombre} onChange={(e) => setNuevoProyecto({...nuevoProyecto, nombre: e.target.value})} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 focus:border-emerald-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Cliente / Propietario</label>
                <input type="text" placeholder="Ej. Ing. Roberto Garza" value={nuevoProyecto.cliente} onChange={(e) => setNuevoProyecto({...nuevoProyecto, cliente: e.target.value})} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 focus:border-emerald-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Ubicación</label>
                <input type="text" placeholder="Ej. Nogales, Sonora" value={nuevoProyecto.ubicacion} onChange={(e) => setNuevoProyecto({...nuevoProyecto, ubicacion: e.target.value})} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 focus:border-emerald-500 outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Presupuesto Estimado ($ MXN)</label>
                <input required type="number" step="0.01" placeholder="0.00" value={nuevoProyecto.presupuesto_estimado} onChange={(e) => setNuevoProyecto({...nuevoProyecto, presupuesto_estimado: e.target.value})} className="w-full bg-[#070B14] border border-slate-700 p-3 rounded-xl text-slate-200 focus:border-emerald-500 outline-none font-black text-lg text-emerald-400" />
              </div>

              <button type="submit" disabled={guardando} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition-all mt-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                {guardando ? "Creando Obra..." : "CREAR PROYECTO"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}