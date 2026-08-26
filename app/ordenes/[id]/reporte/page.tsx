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

  if (cargando) return <div className="p-12 text-slate-400 font-bold text-center mt-20 animate-pulse">Loading report...</div>
  if (!orden) return <div className="p-12 text-red-500 text-center mt-20 font-bold">Work order not found.</div>

  const folio = orden.id.split('-')[0].toUpperCase()
  
  // 🟢 FORZAR ZONA HORARIA SONORA 🟢
  const OpcionesFecha: Intl.DateTimeFormatOptions = { 
    timeZone: 'America/Hermosillo',
    year: 'numeric', month: 'long', day: 'numeric' 
  };
  
  const OpcionesHora: Intl.DateTimeFormatOptions = { 
    timeZone: 'America/Hermosillo',
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit', hour12: true 
  };

  const fechaGeneracion = new Date().toLocaleDateString('en-US', OpcionesFecha)
  
  // 👇 EL PARCHE: Forzamos la "Z" para que siempre empiece como UTC antes de convertir a Sonora 👇
  const parsearHoraSegura = (fechaString: string) => {
    if (!fechaString) return null;
    let segura = fechaString;
    // Si Supabase le quitó la 'Z', se la regresamos
    if (!segura.endsWith('Z') && !segura.includes('+') && segura.length > 10) {
      segura += 'Z';
    }
    return new Date(segura);
  }

  const formatearHora = (fechaIso: string) => {
    const fecha = parsearHoraSegura(fechaIso);
    if (!fecha) return "Not recorded";
    return fecha.toLocaleString('en-US', OpcionesHora);
  }

  const calcularDuracion = (inicio: string, fin: string) => {
    const dInicio = parsearHoraSegura(inicio);
    const dFin = parsearHoraSegura(fin);
    if (!dInicio || !dFin) return "N/A";
    
    const diff = dFin.getTime() - dInicio.getTime();
    if (diff <= 0) return "00h 00m";
    const horas = Math.floor(diff / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);
    return `${horas.toString().padStart(2, '0')}h ${minutos.toString().padStart(2, '0')}m`;
  }

  const fotosPasos = tareas.filter(t => t.foto_url).map(t => ({ titulo: `Step: ${t.tarea}`, url: t.foto_url }))
  const todasLasFotos = orden.evidencia_url ? [...fotosPasos, { titulo: "Final Evidence", url: orden.evidencia_url }] : fotosPasos

  return (
    <div className="min-h-screen bg-slate-200 overflow-y-auto flex flex-col items-center py-10 print:py-0 print:bg-white custom-scrollbar">
      
      {/* BOTONES FLOTANTES */}
      <div className="fixed top-6 left-6 print:hidden z-50">
        <button onClick={() => router.back()} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-2xl hover:bg-slate-800 transition-all border border-slate-700 flex items-center gap-2">
          Go Back
        </button>
      </div>

      <div className="fixed top-6 right-6 print:hidden z-50">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl flex items-center gap-2 hover:bg-blue-500 transition-all border border-blue-400">
          Save PDF / Print
        </button>
      </div>

      {/* DOCUMENTO TAMAÑO CARTA */}
      <div className="bg-white w-[21.5cm] min-h-[27.9cm] relative shadow-[0_20px_50px_rgba(0,0,0,0.2)] print:shadow-none print:w-full">
        
        {/* CINTA SUPERIOR */}
        <div className="bg-[#0B1221] text-white px-10 py-8 flex justify-between items-center print:bg-[#0B1221] print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-lg flex items-center justify-center font-black text-2xl tracking-tighter border-2 border-blue-400">
              JBI
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase leading-none">JBI Manufacturing</h1>
              <p className="text-blue-400 font-bold text-[10px] tracking-[0.2em] uppercase mt-1">Maintenance Division - Global Operations</p>
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
               <div className="bg-[#0B1221] text-white p-3 rounded-lg flex-1 text-center print:bg-[#0B1221] print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
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
            
            {/* ACCIONES TOMADAS POR EL TÉCNICO */}
            {orden.acciones_tomadas && (
              <div className="px-2 mt-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Actions Taken</p>
                <div className="border border-slate-200 rounded-lg p-4 bg-white min-h-[60px] text-sm text-slate-700 font-medium whitespace-pre-wrap">
                  {orden.acciones_tomadas}
                </div>
              </div>
            )}
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

          {/* SECCIÓN 4: CONSUMIBLES UTILIZADOS */}
          <div className="mb-6 break-inside-avoid">
            <div className="bg-slate-100 border-l-4 border-blue-600 px-4 py-2 mb-4 print:bg-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">4. Parts & Consumables Used</h3>
            </div>
            <div className="px-2">
              <div className="border border-slate-200 rounded-lg p-4 min-h-[60px] text-sm text-slate-700 font-medium whitespace-pre-wrap">
                {orden.materiales_utilizados || "No parts or consumables were recorded for this work order."}
              </div>
            </div>
          </div>

          {/* SECCIÓN 5: ANEXO FOTOGRÁFICO */}
          {todasLasFotos.length > 0 && (
            <div className="mb-6 break-inside-avoid">
              <div className="bg-slate-100 border-l-4 border-blue-600 px-4 py-2 mb-4 print:bg-slate-100" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">5. Photographic Annex / Evidence</h3>
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