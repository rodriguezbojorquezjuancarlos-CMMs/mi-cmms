// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function SucursalesPage() {
  const [empresas, setEmpresas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  
  // Esquema exacto de tu base de datos
  const [nombre, setNombre] = useState("")
  const [rfc, setRfc] = useState("")
  const [direccion, setDireccion] = useState("")

  async function cargarEmpresas() {
    const { data } = await supabase.from("empresas").select("*").order("nombre", { ascending: true })
    if (data) setEmpresas(data)
    setCargando(false)
  }

  useEffect(() => { cargarEmpresas() }, [])

  const cerrarModal = () => {
    setMostrarModal(false)
    setNombre("")
    setRfc("")
    setDireccion("")
  }

  async function handleGuardarEmpresa(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)

    const { error } = await supabase.from("empresas").insert([
      { nombre, rfc_o_tax_id: rfc, direccion }
    ])

    if (error) alert("Error: " + error.message)
    else { cerrarModal(); cargarEmpresas(); }
    setGuardando(false)
  }

  if (cargando) return <div className="p-8 text-rose-400 font-bold animate-pulse text-center mt-20">Cargando plantas...</div>

  return (
    <div className="text-slate-100 space-y-12 pb-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-rose-400 font-bold text-xs uppercase tracking-widest mb-1">Estructura Corporativa</p>
          <h1 className="text-3xl font-black tracking-tight text-white">Empresas y Sucursales</h1>
        </div>
        <Button onClick={() => setMostrarModal(true)} className="bg-gradient-to-r from-rose-600 to-pink-500 text-white shadow-lg border border-rose-400/50 py-5 px-6 font-bold rounded-xl">
          + Agregar Empresa
        </Button>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-white/[0.02] text-slate-400 uppercase text-xs font-bold tracking-widest border-b border-white/5">
            <tr>
              <th className="px-8 py-5">Nombre de la Empresa</th>
              <th className="px-8 py-5">RFC / Tax ID</th>
              <th className="px-8 py-5">Dirección</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {empresas.map((emp) => (
              <tr key={emp.id} className="hover:bg-white/[0.02]">
                <td className="px-8 py-5 font-bold text-slate-200">{emp.nombre}</td>
                <td className="px-8 py-5 text-slate-300 font-mono">{emp.rfc_o_tax_id || "N/A"}</td>
                <td className="px-8 py-5 text-slate-400">{emp.direccion || "N/A"}</td>
              </tr>
            ))}
            {empresas.length === 0 && <tr><td colSpan={3} className="px-8 py-12 text-center text-slate-500 italic">No hay empresas registradas.</td></tr>}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-md relative">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-slate-500 hover:text-white bg-black/30 p-2 rounded-full">✕</button>
            <h2 className="text-2xl font-bold text-white mb-6">Nueva Empresa/Sucursal</h2>
            <form onSubmit={handleGuardarEmpresa} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Razón Social o Nombre</label>
                <input required autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-slate-200 outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">RFC o TAX ID</label>
                <input value={rfc} onChange={(e) => setRfc(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-slate-200 outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dirección Completa</label>
                <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-slate-200 outline-none focus:border-rose-500" />
              </div>
              <Button type="submit" disabled={guardando} className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white py-6 rounded-xl font-bold transition-colors">
                {guardando ? "Guardando..." : "Registrar Empresa"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}