"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Trash2, Pencil, UserCog, Power } from "lucide-react"

export default function EmpleadosKioskoPage() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  const [nombre, setNombre] = useState("")
  const [numeroEmpleado, setNumeroEmpleado] = useState("")
  const [editandoId, setEditandoId] = useState<number | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    setCargando(true)
    const { data } = await supabase
      .from("empleados_kiosko")
      .select("*")
      .order("nombre", { ascending: true })
    if (data) setEmpleados(data)
    setCargando(false)
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre || numeroEmpleado.length === 0) return alert("Fill in name and employee number")

    const payload = { nombre, numero_empleado: numeroEmpleado }

    const { error } = editandoId
      ? await supabase.from("empleados_kiosko").update(payload).eq("id", editandoId)
      : await supabase.from("empleados_kiosko").insert([payload])

    if (error) {
      alert(error.code === '23505'
        ? "That employee number is already in use by someone else."
        : "Error saving: " + error.message)
    } else {
      cancelarEdicion()
      cargarDatos()
    }
  }

  function empezarEdicion(emp: any) {
    setEditandoId(emp.id)
    setNombre(emp.nombre)
    setNumeroEmpleado(emp.numero_empleado)
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setNombre("")
    setNumeroEmpleado("")
  }

  async function alternarActivo(emp: any) {
    const { error } = await supabase
      .from("empleados_kiosko")
      .update({ activo: !emp.activo })
      .eq("id", emp.id)
    if (error) return alert("Error: " + error.message)
    cargarDatos()
  }

  async function borrar(id: number) {
    if (!window.confirm("Delete this employee permanently? (Their past kiosk usage history stays on record either way — consider deactivating instead if they might come back.)")) return
    const { error } = await supabase.from("empleados_kiosko").delete().eq("id", id)
    if (error) return alert("Error deleting: " + error.message)
    setEmpleados(empleados.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <UserCog className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Kiosk Employee Directory</h1>
          <p className="text-slate-400 text-sm mt-1">Employee numbers used to log part usage at the Operator Kiosk — no login account needed for these.</p>
        </div>
      </div>

      {/* FORMULARIO DE ALTA / EDICIÓN */}
      <div className={`bg-[#0B1121] border rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-colors ${editandoId ? 'border-amber-500/40' : 'border-slate-800'}`}>
        {editandoId && (
          <div className="mb-6 text-amber-400 text-sm font-bold">✏️ Editing employee #{editandoId}</div>
        )}
        <form onSubmit={guardar} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="e.g. Juan Pérez"
              className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Employee Number (4 digits)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={numeroEmpleado}
              onChange={(e) => setNumeroEmpleado(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 1001"
              className="w-full bg-[#070B14] border border-slate-700 p-4 rounded-xl text-white focus:border-indigo-500 outline-none font-mono tracking-widest"
            />
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
              {editandoId ? 'Update Employee' : '+ Add Employee'}
            </button>
            {editandoId && (
              <button type="button" onClick={cancelarEdicion} className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-all">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABLA */}
      <div className="bg-[#0B1121] border border-slate-800 rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-black tracking-widest">
            <tr>
              <th className="px-6 py-4 text-left">Name</th>
              <th className="px-6 py-4 text-left">Employee #</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {cargando ? (
              <tr><td colSpan={4} className="p-8 text-center text-indigo-400 animate-pulse font-bold">Loading...</td></tr>
            ) : empleados.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">No employees yet — add the first one above.</td></tr>
            ) : (
              empleados.map((emp) => (
                <tr key={emp.id} className={`hover:bg-slate-900/50 ${!emp.activo ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4 font-bold text-white">{emp.nombre}</td>
                  <td className="px-6 py-4 font-mono tracking-widest text-slate-300">{emp.numero_empleado}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase ${emp.activo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/40 text-slate-400'}`}>
                      {emp.activo ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => alternarActivo(emp)} title={emp.activo ? 'Deactivate' : 'Activate'} className="text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 p-2.5 rounded-lg transition-colors border border-transparent hover:border-amber-500/30">
                        <Power size={16} />
                      </button>
                      <button onClick={() => empezarEdicion(emp)} title="Edit" className="text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 p-2.5 rounded-lg transition-colors border border-transparent hover:border-indigo-500/30">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => borrar(emp.id)} title="Delete" className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-2.5 rounded-lg transition-colors border border-transparent hover:border-rose-500/30">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}