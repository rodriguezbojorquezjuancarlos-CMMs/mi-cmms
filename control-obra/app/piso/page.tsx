// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function KanbanPage() {
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarOrdenes() {
      // Traemos todas las órdenes de trabajo con su respectivo equipo
      const { data } = await supabase
        .from("ordenes_trabajo")
        .select("*, equipos(nombre)")
        .order("creado_at", { ascending: false })
      
      if (data) setOrdenes(data)
      setCargando(false)
    }
    cargarOrdenes()
  }, [])

  // Agrupamos las órdenes (Cubre estatus en inglés y español por si quedó basura)
  const openOrders = ordenes.filter(o => !o.estatus || o.estatus === 'Abierta' || o.estatus === 'Open' || o.estatus === 'Pending' || o.estatus === 'Pendiente');
  const inProgressOrders = ordenes.filter(o => o.estatus === 'En Proceso' || o.estatus === 'In Progress' || o.estatus === 'En Progreso');
  const closedOrders = ordenes.filter(o => o.estatus === 'Cerrada' || o.estatus === 'Closed').slice(0, 20); // Solo mostramos las últimas 20 cerradas

  if (cargando) return <div className="p-8 text-emerald-400 font-bold animate-pulse text-center mt-20">Loading Kanban Board...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 min-h-screen relative">
      
      {/* MAGIA CSS: ESTILOS PREMIUM PARA LA BARRA DE DESPLAZAMIENTO */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(11, 18, 33, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.8); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(71, 85, 105, 1); }
      `}} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
            <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Kanban Board</h1>
            <p className="text-slate-400 text-sm mt-1">Live tracking of active work orders</p>
          </div>
        </div>
      </div>

      {/* LAS 3 COLUMNAS DEL KANBAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: TO DO (OPEN) */}
        <div className="bg-[#0B1221] border border-slate-800 rounded-3xl flex flex-col h-[75vh]">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-3xl">
            <h2 className="font-bold text-white flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div> TO DO
            </h2>
            <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">{openOrders.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
            {openOrders.length === 0 ? (
              <p className="text-center text-slate-500 text-sm mt-10">No pending orders.</p>
            ) : openOrders.map(orden => <TarjetaKanban key={orden.id} orden={orden} color="bg-slate-400" />)}
          </div>
        </div>

        {/* COLUMNA 2: IN PROGRESS */}
        <div className="bg-[#0B1221] border border-slate-800 rounded-3xl flex flex-col h-[75vh] shadow-[0_0_30px_rgba(245,158,11,0.05)]">
          <div className="p-5 border-b border-amber-900/30 flex justify-between items-center bg-amber-950/20 rounded-t-3xl">
            <h2 className="font-bold text-amber-400 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div> IN PROGRESS
            </h2>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full">{inProgressOrders.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
             {inProgressOrders.length === 0 ? (
              <p className="text-center text-slate-500 text-sm mt-10">No orders in progress.</p>
            ) : inProgressOrders.map(orden => <TarjetaKanban key={orden.id} orden={orden} color="bg-amber-500" />)}
          </div>
        </div>

        {/* COLUMNA 3: DONE (CLOSED) */}
        <div className="bg-[#0B1221] border border-slate-800 rounded-3xl flex flex-col h-[75vh]">
          <div className="p-5 border-b border-emerald-900/30 flex justify-between items-center bg-emerald-950/20 rounded-t-3xl">
            <h2 className="font-bold text-emerald-400 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> COMPLETED
            </h2>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">{closedOrders.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
             {closedOrders.length === 0 ? (
              <p className="text-center text-slate-500 text-sm mt-10">No completed orders yet.</p>
            ) : closedOrders.map(orden => <TarjetaKanban key={orden.id} orden={orden} color="bg-emerald-500" />)}
          </div>
        </div>

      </div>

      {/* 👇 AQUÍ ESTÁ LA LÍNEA QUE FALTABA: INVOCAMOS EL WIDGET DE IA 👇 */}
      <KinetixAIWidget />

    </div>
  )
}

// COMPONENTE DE LA TARJETA INDIVIDUAL
function TarjetaKanban({ orden, color }: { orden: any, color: string }) {
  const isPreventive = orden.tipo_mantenimiento === 'Preventivo';

  return (
    <Link href={`/ordenes/${orden.id}`} className="block bg-[#121826] border border-slate-800 hover:border-slate-600 rounded-2xl p-4 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
      
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
          isPreventive ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`}>
          {isPreventive ? 'Preventive' : 'Corrective'}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">WO-{orden.id.substring(0,6).toUpperCase()}</span>
      </div>

      <h3 className="text-white font-bold text-sm mb-1">{orden.equipos?.nombre || 'Unknown Machine'}</h3>
      <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">{orden.descripcion_falla || 'No details provided.'}</p>

      <div className="flex justify-between items-center pt-3 border-t border-slate-800/80">
        <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {new Date(orden.creado_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors flex items-center gap-1">
          View <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </span>
      </div>
    </Link>
  )
}

// COMPONENTE DEL ASISTENTE KINETIX AI
function KinetixAIWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [historial, setHistorial] = useState([{ rol: 'ia', texto: 'Hello Juan. I am KINETIX AI. Tell me which equipment is failing and I will generate the report.' }]);
  const [escribiendo, setEscribiendo] = useState(false);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const textoUsuario = mensaje;
    setHistorial(prev => [...prev, { rol: 'usuario', texto: textoUsuario }]);
    setMensaje("");
    setEscribiendo(true);

    try {
      const res = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: textoUsuario })
      });
      const data = await res.json();
      
      setHistorial(prev => [...prev, { rol: 'ia', texto: data.respuesta }]);
    } catch (error) {
      setHistorial(prev => [...prev, { rol: 'ia', texto: 'Network error.' }]);
    } finally {
      setEscribiendo(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[99999] print:hidden">
      {/* Ventana de Chat */}
      {abierto && (
        <div className="bg-[#0B1221] border border-sky-500/30 w-80 h-96 rounded-2xl shadow-[0_0_40px_rgba(14,165,233,0.15)] flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-4 text-white font-bold flex justify-between items-center shadow-md relative z-10">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              KINETIX AI
            </span>
            <button onClick={() => setAbierto(false)} className="hover:text-sky-200"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-[#070b14] custom-scrollbar">
            {historial.map((msg, i) => (
              <div key={i} className={`flex ${msg.rol === 'ia' ? 'justify-start' : 'justify-end'}`}>
                <div className={`p-3 rounded-2xl max-w-[85%] ${msg.rol === 'ia' ? 'bg-slate-800 text-slate-300 rounded-tl-sm border border-slate-700' : 'bg-sky-600 text-white rounded-tr-sm shadow-md'}`}>
                  {msg.texto}
                </div>
              </div>
            ))}
            {escribiendo && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 text-sky-400 p-3 rounded-2xl rounded-tl-sm flex gap-1">
                  <span className="animate-bounce">●</span><span className="animate-bounce delay-100">●</span><span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={enviarMensaje} className="p-3 border-t border-slate-800 bg-[#0B1221] flex gap-2">
            <input type="text" value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Type the fault..." className="flex-1 bg-[#070b14] border border-slate-700 text-slate-200 text-xs rounded-xl px-4 outline-none focus:border-sky-500 transition-colors" />
            <button type="submit" disabled={escribiendo || !mensaje} className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shadow-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      )}

      {/* Botón Burbuja */}
      <button onClick={() => setAbierto(!abierto)} className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:scale-110 transition-all ${abierto ? 'bg-slate-800 border border-slate-700' : 'bg-gradient-to-r from-sky-500 to-indigo-500'}`}>
        {abierto ? <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
      </button>
    </div>
  )
}