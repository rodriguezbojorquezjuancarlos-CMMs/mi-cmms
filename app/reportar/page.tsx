// @ts-nocheck
"use client"

import { useEffect, useState, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { useSearchParams } from "next/navigation"


function FormularioReporte() {
  const searchParams = useSearchParams()
  const equipoParam = searchParams.get("equipo")
  
  // Nuevos estados para cargar los catálogos
  const [equipos, setEquipos] = useState<any[]>([])
  const [empresas, setEmpresas] = useState<any[]>([])
  
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [enviadoExito, setEnviadoExito] = useState(false)

  // Campos del formulario
  const [solicitante, setSolicitante] = useState("")
  const [falla, setFalla] = useState("")
  const [prioridad, setPrioridad] = useState("Media")
  
  // IDs seleccionados
  const [equipoSeleccionado, setEquipoSeleccionado] = useState("")
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("")

  useEffect(() => {
    async function cargarDatos() {
      // 1. Traer lista de Plantas/Sucursales
      const { data: dataEmpresas } = await supabase.from("empresas").select("*").order("nombre")
      if (dataEmpresas) {
        setEmpresas(dataEmpresas)
        // Auto-seleccionar si solo hay 1 planta en la base de datos
        if (dataEmpresas.length === 1) {
          setEmpresaSeleccionada(dataEmpresas[0].id)
        }
      }

      // 2. Traer lista de Equipos
      const { data: dataEquipos } = await supabase.from("equipos").select("*").order("nombre")
      if (dataEquipos) {
        setEquipos(dataEquipos)
      }

      // 3. Si escaneó el QR, pre-llenar la máquina
      if (equipoParam) {
        setEquipoSeleccionado(equipoParam)
      }

      setCargando(false)
    }
    cargarDatos()
  }, [equipoParam])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validaciones de seguridad
    if (!empresaSeleccionada) return alert("⚠️ Please select the Branch/Plant")
    if (!equipoSeleccionado) return alert("⚠️ Please select an Equipment from the list")

    setEnviando(true)

    // 1. Guardar la orden en Supabase (Ahora sí incluye empresa_id y equipo_id)
    const { error } = await supabase.from("ordenes_trabajo").insert([{
      equipo_id: equipoSeleccionado,
      empresa_id: empresaSeleccionada, 
      tipo_mantenimiento: 'Correctivo',
      estatus: 'Abierta',
      prioridad,
      descripcion_falla: falla,
      solicitante,
      fecha_programada: new Date().toISOString()
    }])

    if (error) {
      alert("Error saving ticket: " + error.message)
      setEnviando(false)
      return
    }

    // 2. Mandar el correo electrónico de alerta
    try {
      const equipoObj = equipos.find(eq => eq.id === equipoSeleccionado)
      await fetch('/api/enviar-alerta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipoNombre: equipoObj ? equipoObj.nombre : 'Unknown Equipment',
          falla: falla,
          prioridad: prioridad,
          solicitante: solicitante
        })
      })
    } catch (err) {
      console.log("Ticket saved to DB, but there was an error sending the email alert", err)
    }

    setEnviando(false)
    setEnviadoExito(true)
  }

  if (cargando) return <div className="p-8 text-white text-center mt-20 font-bold animate-pulse">Loading modules...</div>

  if (enviadoExito) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl shadow-emerald-900/20">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Report Submitted!</h2>
          <p className="text-slate-400 mb-6">The maintenance team has been notified and the order now appears on the main board.</p>
          <button onClick={() => window.location.reload()} className="text-emerald-400 font-bold text-sm hover:text-emerald-300 transition-colors">Submit another report</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-rose-900/50">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Report Fault</h1>
          <p className="text-slate-400 text-sm mt-1">Generate corrective maintenance ticket</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SELECTOR DE PLANTA */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Branch / Plant</label>
              <select required value={empresaSeleccionada} onChange={(e) => setEmpresaSeleccionada(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3.5 rounded-xl focus:border-rose-500 outline-none text-slate-200 appearance-none text-sm">
                <option value="" className="bg-slate-900 text-slate-500">Select...</option>
                {empresas.map(emp => <option key={emp.id} value={emp.id} className="bg-slate-900">{emp.nombre}</option>)}
              </select>
            </div>

            {/* SELECTOR DE MÁQUINA */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Equipment with fault</label>
              <select required value={equipoSeleccionado} onChange={(e) => setEquipoSeleccionado(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3.5 rounded-xl focus:border-rose-500 outline-none text-slate-200 appearance-none text-sm">
                <option value="" className="bg-slate-900 text-slate-500">Select...</option>
                {equipos.map(eq => <option key={eq.id} value={eq.id} className="bg-slate-900">{eq.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Your Name / Operator</label>
            <input required value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="E.g., John Doe" className="w-full bg-black/40 border border-white/10 p-4 rounded-xl focus:border-rose-500 outline-none text-slate-200" />
          </div>

       <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} className="w-full bg-black/40 border border-white/10 p-4 rounded-xl focus:border-rose-500 outline-none text-slate-200 appearance-none">
              <option value="Baja" className="bg-slate-900 text-slate-300">Low (Doesn't affect production)</option>
              <option value="Media" className="bg-slate-900 text-amber-400 font-bold">Medium (Partial failure)</option>
              <option value="Alta" className="bg-slate-900 text-rose-500 font-bold">High (Machine down)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">What is failing?</label>
            <textarea required value={falla} onChange={(e) => setFalla(e.target.value)} placeholder="Describe the noise, alarm, or visible problem..." className="w-full bg-black/40 border border-white/10 p-4 rounded-xl focus:border-rose-500 outline-none text-slate-200 min-h-[100px] resize-none" />
          </div>

          <button type="submit" disabled={enviando} className="w-full mt-4 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white py-5 text-lg font-bold rounded-xl transition-all shadow-lg shadow-rose-900/30">
            {enviando ? "Generating ticket..." : "Submit Urgent Report"}
          </button>
        </form>
      </div>
    </div>
  )
}
export default function ReportarPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading form...</div>}>
      <FormularioReporte />
    </Suspense>
  )
}