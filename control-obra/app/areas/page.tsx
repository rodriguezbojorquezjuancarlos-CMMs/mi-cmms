// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function AreasPage() {
  const [areas, setAreas] = useState<any[]>([])
  const [empresas, setEmpresas] = useState<any[]>([]) // Para el select
  const [cargando, setCargando] = useState(true)
  
  const [mostrarModal, setMostrarModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  
  // Esquema exacto de la base de datos
  const [nombre, setNombre] = useState("")
  const [codigoArea, setCodigoArea] = useState("")
  const [empresaId, setEmpresaId] = useState("")

  async function cargarDatos() {
    // Traemos áreas uniendo con la tabla de empresas para mostrar a quién pertenece
    const { data: dataAreas } = await supabase.from("areas").select("*, empresas(nombre)").order("creado_at", { ascending: false })
    if (dataAreas) setAreas(dataAreas)

    // Traemos las empresas para el selector del formulario
    const { data: dataEmpresas } = await supabase.from("empresas").select("id, nombre")
    if (dataEmpresas) setEmpresas(dataEmpresas)
    
    setCargando(false)
  }

  useEffect(() => { cargarDatos() }, [])

  const cerrarModal = () => {
    setMostrarModal(false)
    setNombre("")
    setCodigoArea("")
    setEmpresaId("")
  }

  async function handleGuardarArea(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)

    const { error } = await supabase.from("areas").insert([
      { nombre, codigo_area: codigoArea, empresa_id: empresaId || null }
    ])

    if (error) alert("Error: " + error.message)
    else { cerrarModal(); cargarDatos(); }
    setGuardando(false)
  }

  if (cargando) return <div className="p-8 text-emerald-400 font-bold animate-pulse text-center mt-20">Cargando áreas...</div>

  return (
    <div className="text-slate-100 space-y-12 pb-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">Distribución Física</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Áreas y Departamentos</h1>
        </div>
        <Button onClick={() => setMostrarModal(true)} className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg border border-emerald-400/50 py-5 px-6 font-bold rounded-xl">
          + Nueva Área
        </Button>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/[0.02] text-slate-400 uppercase text-xs font-bold tracking-widest border-b border-white/5">
            <tr>
              <th className="px-8 py-5">Código de Área</th>
              <th className="px-8 py-5">Nombre del Departamento</th>
              <th className="px-8 py-5">Pertenece a Planta/Empresa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {areas.map((area) => (
              <tr key={area.id} className="hover:bg-white/[0.02]">
                <td className="px-8 py-5 font-bold text-emerald-400 font-mono">{area.codigo_area || "N/A"}</td>
                <td className="px-8 py-5 font-bold text-slate-200">{area.nombre}</td>
                <td className="px-8 py-5 text-slate-400">{area.empresas?.nombre || "Sin Asignar"}</td>
              </tr>
            ))}
            {areas.length === 0 && <tr><td colSpan={3} className="px-8 py-12 text-center text-slate-500 italic">No hay áreas registradas.</td></tr>}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-md relative">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-black/30 p-2 rounded-full">✕</button>
            <h2 className="text-2xl font-bold text-white mb-6">Registrar Nueva Área</h2>
            <form onSubmit={handleGuardarArea} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Planta / Empresa</label>
                <select required value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-slate-200 outline-none focus:border-emerald-500 appearance-none">
                  <option value="" className="bg-slate-900">Seleccionar...</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id} className="bg-slate-900">{emp.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre del Área</label>
                <input required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Ensamblaje, Pintura..." className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-slate-200 outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Código de Área</label>
                <input value={codigoArea} onChange={(e) => setCodigoArea(e.target.value)} placeholder="Ej. AREA-01" className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-slate-200 outline-none focus:border-emerald-500 font-mono" />
              </div>

              <Button type="submit" disabled={guardando} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-xl font-bold transition-colors">
                {guardando ? "Guardando..." : "Guardar Área"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}