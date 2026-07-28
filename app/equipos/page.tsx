// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { QRCodeSVG } from 'qrcode.react'

export default function EquiposPage() {
  const [equipos, setEquipos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  // Estados para el Expediente (Modal)
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<any | null>(null)
  const [historialOTs, setHistorialOTs] = useState<any[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  useEffect(() => {
    async function cargarEquipos() {
      // Traemos los equipos ordenados por nombre
      const { data } = await supabase.from("equipos").select("*").order("nombre", { ascending: true })
      if (data) setEquipos(data)
      setCargando(false)
    }
    cargarEquipos()
  }, [])

  // Función para abrir el expediente de la máquina
  const abrirExpediente = async (equipo: any) => {
    setEquipoSeleccionado(equipo)
    setCargandoHistorial(true)
    
    // Buscamos todo el historial de fallas y mantenimientos de esta máquina exacta
    const { data } = await supabase
      .from("ordenes_trabajo")
      .select("id, estatus, tipo_mantenimiento, creado_at, descripcion_falla")
      .eq("equipo_id", equipo.id)
      .order("creado_at", { ascending: false })
      .limit(10)
      
    if (data) setHistorialOTs(data)
    setCargandoHistorial(false)
  }

  // Función para imprimir solo la etiqueta QR
  const imprimirEtiqueta = () => {
    window.print();
  }

  if (cargando) return <div className="p-8 text-emerald-400 font-bold animate-pulse text-center mt-20">Synchronizing plant assets...</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 print:p-0 print:m-0">
      
      {/* HEADER DE LA VISTA (Se oculta al imprimir) */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8 border-b border-slate-800 pb-6 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Asset Inventory</h1>
            <p className="text-slate-400 text-sm mt-1">Machinery management, technical history, and QR Code generation</p>
          </div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 text-sm">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Register Asset
        </button>
      </div>

      {/* TABLA PRINCIPAL DE EQUIPOS (Se oculta al imprimir) */}
      <div className="bg-[#0B1221] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden print:hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Code / Machine</th>
                <th className="px-6 py-4">Make & Model</th>
                <th className="px-6 py-4 text-center">Criticality</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {equipos.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-600 font-bold">No equipment registered.</td></tr>
              ) : (
                equipos.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white text-base">{eq.nombre}</p>
                      <p className="text-xs font-mono font-bold text-blue-400 mt-0.5">{eq.codigo_control || "NO CODE"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-300">{eq.marca || "N/A"} - {eq.modelo || "N/A"}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">SN: {eq.numero_serie || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border bg-amber-500/10 text-amber-400 border-amber-500/30">
                         MEDIUM
                       </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Operating
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => abrirExpediente(eq)}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-all text-xs flex items-center gap-2 ml-auto"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DEL EXPEDIENTE CLÍNICO (Se oculta al imprimir) */}
      {equipoSeleccionado && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 print:hidden">
          <div className="bg-[#0B1221] border-l border-slate-700 w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            
            {/* Cabecera del Modal */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/50">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border bg-blue-500/10 text-blue-400 border-blue-500/30">
                    Technical Record
                  </span>
                  <span className="text-slate-400 text-xs font-mono">{equipoSeleccionado.codigo_control}</span>
                </div>
                <h2 className="text-2xl font-black text-white">{equipoSeleccionado.nombre}</h2>
                <p className="text-sm text-slate-400 mt-1">{equipoSeleccionado.marca} - {equipoSeleccionado.modelo}</p>
              </div>
              <button onClick={() => setEquipoSeleccionado(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Contenido del Modal (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Sección QR y Ficha */}
              <div className="bg-[#070B14] border border-slate-800 p-5 rounded-2xl flex gap-6 items-center">
                <div className="bg-white p-3 rounded-xl shadow-lg shrink-0">
                  <QRCodeSVG 
                    value={`https://yourdomain.com/report?equipo=${equipoSeleccionado.id}`} 
                    size={100} 
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold mb-2 text-sm uppercase tracking-widest">Physical Identification</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">QR code label for direct floor reporting. Operators can scan it with their smartphone camera to instantly open a fault ticket.</p>
                  <button onClick={imprimirEtiqueta} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-lg border border-slate-600 transition-colors text-sm flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Industrial Label
                  </button>
                </div>
              </div>

              {/* Historial Clínico de la Máquina */}
              <div>
                <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Technical History (Last 10 WOs)
                </h3>
                
                {cargandoHistorial ? (
                  <div className="text-center py-8 text-slate-500 text-sm font-bold animate-pulse">Fetching records...</div>
                ) : historialOTs.length === 0 ? (
                  <div className="text-center py-8 bg-slate-900/30 border border-slate-800 rounded-xl text-slate-500 text-sm font-bold">Clean record. No maintenance registered yet.</div>
                ) : (
                  <div className="space-y-3">
                    {historialOTs.map(ot => (
                      <Link href={`/ordenes/${ot.id}`} key={ot.id} className="block bg-slate-900/50 hover:bg-slate-800 border border-slate-800 p-4 rounded-xl transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                            ot.tipo_mantenimiento === 'Preventivo' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}>
                            {ot.tipo_mantenimiento}
                          </span>
                          <span className="text-xs font-mono text-slate-500">{new Date(ot.creado_at).toLocaleDateString('en-US')}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{ot.descripcion_falla || "General Maintenance"}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500">STATUS:</span>
                          <span className={`text-xs font-bold ${ot.estatus === 'Cerrada' ? 'text-emerald-500' : 'text-amber-500'}`}>{ot.estatus}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          VISTA DE IMPRESIÓN EXCLUSIVA (Solo se ve al darle Ctrl+P) 
          ========================================================= */}
      {equipoSeleccionado && (
        <div className="hidden print:flex flex-col items-center justify-center w-full h-screen bg-white text-black p-10">
          
          <div className="border-4 border-black w-[10cm] h-[15cm] rounded-2xl flex flex-col items-center justify-between p-6 bg-white relative">
            
            {/* Cabecera Etiqueta */}
            <div className="w-full text-center border-b-2 border-black pb-4 mb-4">
              <h1 className="text-2xl font-black tracking-tighter mb-1">JBI MANUFACTURING</h1>
              <p className="text-xs font-bold uppercase tracking-widest">Controlled Asset • Nogales Plant</p>
            </div>

            {/* Código QR Gigante */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
              <QRCodeSVG 
                value={`https://yourdomain.com/report?equipo=${equipoSeleccionado.id}`} 
                size={220} 
                level="H"
                includeMargin={false}
              />
              <p className="mt-6 text-sm font-bold uppercase tracking-widest text-center max-w-[200px]">Scan to report a fault or request support</p>
            </div>

            {/* Pie de Etiqueta (Specs de la máquina) */}
            <div className="w-full bg-slate-100 border-2 border-black rounded-xl p-4 text-center mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-600">Equipment Name</p>
              <h2 className="text-xl font-black uppercase leading-tight mb-3">{equipoSeleccionado.nombre}</h2>
              
              <div className="grid grid-cols-2 gap-2 text-left border-t border-slate-300 pt-2">
                <div>
                  <p className="text-[8px] font-bold uppercase">Tag Code</p>
                  <p className="text-sm font-mono font-bold">{equipoSeleccionado.codigo_control || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase">Serial No.</p>
                  <p className="text-sm font-mono font-bold">{equipoSeleccionado.numero_serie || "N/A"}</p>
                </div>
              </div>
            </div>
            
            <p className="absolute -bottom-6 text-[8px] font-bold tracking-widest uppercase text-slate-400">
              KINETIX PRO ASSET MANAGEMENT
            </p>
          </div>
        </div>
      )}

    </div>
  )
}