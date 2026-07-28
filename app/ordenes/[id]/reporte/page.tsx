// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"

export default function OrdenUnificada() {
  const { id } = useParams()
  const router = useRouter()
  
  const [orden, setOrden] = useState<any>(null)
  const [tareas, setTareas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [subiendoFoto, setSubiendoFoto] = useState<string | null>(null)

  useEffect(() => {
    async function cargarDatos() {
      const { data: dataOrden, error } = await supabase
        .from("ordenes_trabajo")
        .select("*, equipos(nombre, marca, modelo, numero_serie, codigo_control, area)")
        .eq("id", id)
        .single()
      
      if (error) console.error("Error loading order:", error)

      if (dataOrden) {
        setOrden(dataOrden)
        const { data: dataTareas } = await supabase
          .from("checklist_tareas")
          .select("*")
          .eq("orden_id", id)
          .order("id", { ascending: true })
          
        if (dataTareas) setTareas(dataTareas)
      }
      setCargando(false)
    }
    if (id) cargarDatos()
  }, [id])

  // Funciones interactivas para el técnico (Autoguardado)
  const actualizarTarea = async (tareaId: number, campo: string, valor: any) => {
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, [campo]: valor } : t))
    await supabase.from("checklist_tareas").update({ [campo]: valor }).eq("id", tareaId)
  }

  const manejarSubidaFoto = async (e: React.ChangeEvent<HTMLInputElement>, tareaId: number) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendoFoto(tareaId.toString())
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `evidencias-checklist/${fileName}`

    try {
      const { error: uploadError } = await supabase.storage.from('evidencias').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = await supabase.storage.from('evidencias').getPublicUrl(filePath)
      await actualizarTarea(tareaId, 'foto_url', publicUrl)
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("There was an error uploading the photographic evidence.")
    } finally {
      setSubiendoFoto(null)
    }
  }

  if (cargando) return <div className="p-12 text-slate-400 font-bold text-center mt-20 animate-pulse">Loading workstation...</div>
  if (!orden) return <div className="p-12 text-red-500 text-center mt-20 font-bold">Work order not found.</div>

  const folio = orden.id.split('-')[0].toUpperCase()
  const fechaGeneracion = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  
  const formatearHora = (fechaIso: string) => {
    if (!fechaIso) return "Not recorded";
    return new Date(fechaIso).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const calcularDuracion = (inicio: string, fin: string) => {
    if (!inicio || !fin) return "N/A";
    const diff = new Date(fin).getTime() - new Date(inicio).getTime();
    if (diff <= 0) return "00h 00m";
    const horas = Math.floor(diff / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);
    return `${horas.toString().padStart(2, '0')}h${minutos.toString().padStart(2, '0')}m`;
  }

  const fotosPasos = tareas.filter(t => t.foto_url).map(t => ({ titulo: `Step: ${t.tarea}`, url: t.foto_url }))
  const todasLasFotos = orden.evidencia_url ? [...fotosPasos, { titulo: "Final Evidence (Global)", url: orden.evidencia_url }] : fotosPasos

  return (
    <div className="min-h-screen bg-slate-200 overflow-y-auto flex flex-col items-center py-10 print:py-0 print:bg-white custom-scrollbar">
      
      {/* BOTONES FLOTANTES (Se ocultan al imprimir) */}
      <div className="fixed top-6 left-6 print:hidden z-50">
        <button onClick={() => router.back()} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-2xl hover:bg-slate-800 transition-all border border-slate-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Go Back
        </button>
      </div>

      <div className="fixed top-6 right-6 print:hidden z-50">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-[0_10px_25px_rgba(37,99,235,0.4)] flex items-center gap-2 hover:bg-blue-500 transition-all border border-blue-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          Save PDF / Print
        </button>
      </div>

      {/* --- PANEL INTERACTIVO DEL TÉCNICO EN PISO (SE OCULTA AL IMPRIMIR) --- */}
      <div className="w-[21.5cm] bg-[#0B1221] p-6 rounded-2xl shadow-xl mb-10 print:hidden border border-slate-800">
        <h3 className="text-white font-black text-xl flex items-center gap-2 mb-4">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          Execution Panel (Floor Technician)
        </h3>
        
        <div className="bg-[#070B14] border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/50">
          {tareas.map((tarea) => (
            <div key={tarea.id} className={`p-4 transition-colors ${tarea.completada ? 'bg-emerald-950/10' : 'hover:bg-slate-900/50'}`}>
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => actualizarTarea(tarea.id, 'completada', !tarea.completada)}
                  className={`flex-shrink-0 mt-1 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                    tarea.completada ? 'bg-emerald-500 border-emerald-500 text-[#0B1221] shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-800 border-slate-600 text-transparent'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </button>
                
                <div className="flex-1 space-y-3">
                  <p className={`text-sm font-medium transition-all ${tarea.completada ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {tarea.tarea}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Add note or finding..." 
                        value={tarea.comentario || ''}
                        onChange={(e) => actualizarTarea(tarea.id, 'comentario', e.target.value)}
                        className="w-full bg-[#0B1221] border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2.5 focus:border-emerald-500 outline-none placeholder-slate-600"
                      />
                    </div>
                    <div className="flex-shrink-0">
                      {tarea.foto_url ? (
                        <a href={tarea.foto_url} target="_blank" rel="noreferrer" className="h-full px-4 py-2.5 flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold">
                          View Photo
                        </a>
                      ) : (
                        <label className="h-full px-4 py-2.5 flex items-center gap-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-700">
                          {subiendoFoto === tarea.id.toString() ? 'Uploading...' : '📸 Take Photo'}
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => manejarSubidaFoto(e, tarea.id)} disabled={subiendoFoto === tarea.id.toString()} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ------------------------------------------------------------- */}

      {/* DOCUMENTO TAMAÑO CARTA (Se imprime perfectamente con los datos actualizados) */}
      <div className="bg-white w-[21.5cm] min-h-[27.9cm] relative shadow-[0_20px_50px_rgba(0,0,0,0.2)] print:shadow-none print:w-full">
        
        {/* CINTA SUPERIOR */}
        <div className="bg-slate-900 text-white px-10 py-8 flex justify-between items-center print:bg-slate-900 print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center font-black text-2xl tracking-tighter border-2 border-blue-400">
              JBI
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase leading-none">JBI Manufacturing</h1>
              <p className="text-blue-400 font-bold text-[10px] tracking-[0.2em] uppercase mt-1">Maintenance Division - Nogales Plant</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Work Order ID</p>
            <p className="text-2xl font-bold font-mono text-white leading-none">WO-{folio}</p>
          </div>
        </div>

        {/* CUERPO DEL DOCUMENTO */}
        <div className="p-10 text-slate-900">
          
          <div className="flex justify-between items-end mb-8 pb-4 border-b-2 border-slate-200">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Maintenance Report</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Operational validation and accountability document.</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-500 uppercase">Issue Date</p>
              <p className="text-sm font-semibold">{fechaGeneracion}</p>
            </div>
          </div>

          {/* SECCIÓN 1: DATOS DEL EQUIPO */}
          <div className="mb-6">
            <div className="bg-slate-100 border-l-4 border-blue-600 px-4 py-2 mb-4 print:bg-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">1. Asset Identification</h3>
            </div>
            <div className="grid grid-cols-4 gap-4 px-2">
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Equipment Name</p>
                <p className="text-base font-black text-slate-900">{orden.equipos?.nombre || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Code (Tag)</p>
                <p className="text-sm font-mono font-bold bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200">{orden.equipos?.codigo_control || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Area / Location</p>
                <p className="text-sm font-semibold">{orden.equipos?.area || "Main Plant"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Make & Model</p>
                <p className="text-sm font-semibold">{orden.equipos?.marca || "N/A"} - {orden.equipos?.modelo || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Serial Number</p>
                <p className="text-sm font-mono font-medium">{orden.equipos?.numero_serie || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: DETALLES DEL SERVICIO & TIEMPOS */}
          <div className="mb-6">
            <div className="bg-slate-100 border-l-4 border-blue-600 px-4 py-2 mb-4 print:bg-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">2. Service Metrics (Wrench Time)</h3>
            </div>
            
            <div className="flex gap-4 mb-4 px-2">
               <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex-1 print:bg-blue-50" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                 <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Work Type</p>
                 <p className="text-sm font-black text-slate-900 uppercase">{orden.tipo_mantenimiento === 'Preventivo' ? 'Preventive' : 'Corrective'}</p>
               </div>
               <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex-1">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Start Time</p>
                 <p className="text-sm font-mono font-semibold text-slate-800">{formatearHora(orden.hora_inicio)}</p>
               </div>
               <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex-1">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">End Time</p>
                 <p className="text-sm font-mono font-semibold text-slate-800">{formatearHora(orden.hora_fin)}</p>
               </div>
               <div className="bg-slate-800 text-white p-3 rounded-lg flex-1 text-center print:bg-slate-800 print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Labor Time</p>
                 <p className="text-lg font-black">{calcularDuracion(orden.hora_inicio, orden.hora_fin)}</p>
               </div>
            </div>

            <div className="px-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Problem Description / Assigned Instruction</p>
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 min-h-[60px] text-sm text-slate-700 font-medium">
                {orden.descripcion_falla}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: CHECKLIST DE TAREAS */}
          {tareas.length > 0 && (
            <div className="mb-6">
              <div className="bg-slate-100 border-l-4 border-blue-600 px-4 py-2 mb-4 print:bg-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">3. Protocol Execution (Checklist)</h3>
              </div>
              <div className="px-2">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 w-12">Status</th>
                      <th className="py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Completed Activity</th>
                      <th className="py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Additional Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tareas.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-3 text-center">
                          {t.completada ? (
                            <div className="w-5 h-5 bg-emerald-100 text-emerald-600 border border-emerald-300 rounded mx-auto flex items-center justify-center print:bg-emerald-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>✓</div>
                          ) : (
                            <div className="w-5 h-5 bg-slate-100 border border-slate-300 rounded mx-auto"></div>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-slate-800">{t.tarea}</td>
                        <td className="py-3 pr-4 text-slate-500 italic text-xs">{t.comentario || "No remarks."}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECCIÓN 4: ANEXO FOTOGRÁFICO */}
          {todasLasFotos.length > 0 && (
            <div className="mb-6 break-inside-avoid">
              <div className="bg-slate-100 border-l-4 border-blue-600 px-4 py-2 mb-4 print:bg-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">4. Photographic Annex / Evidence</h3>
              </div>
              <div className="grid grid-cols-2 gap-6 px-2">
                {todasLasFotos.slice(0,4).map((foto, idx) => (
                  <div key={idx} className="border-2 border-slate-200 p-2 rounded-xl bg-white shadow-sm">
                    <div className="h-48 rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-200">
                      {foto.url ? (
                        <img 
                          src={foto.url} 
                          alt="Evidence" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://placehold.co/400x300?text=Error+loading'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs uppercase font-bold tracking-widest">No image</div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center truncate px-2">{foto.titulo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FIRMAS Y PIE DE PÁGINA */}
          <div className="mt-20 pt-8 border-t-2 border-slate-200 px-8 flex justify-between break-inside-avoid">
            <div className="text-center w-64">
              <div className="border-b-2 border-slate-800 mb-2 h-16 relative"></div>
              <p className="font-black text-sm uppercase text-slate-900">Technician Signature</p>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Maintenance Executor</p>
            </div>
            
            <div className="text-center w-64">
              <div className="border-b-2 border-slate-800 mb-2 h-16"></div>
              <p className="font-black text-sm uppercase text-slate-900">Sign-off / Approval</p>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Management / Supervision</p>
            </div>
          </div>

          <div className="mt-12 text-center text-[9px] text-slate-400 font-bold tracking-widest uppercase">
            CONFIDENTIAL DOCUMENT • GENERATED BY KINETIX PRO CMMS • {new Date().getFullYear()}
          </div>

        </div>
      </div>
    </div>
  )
}