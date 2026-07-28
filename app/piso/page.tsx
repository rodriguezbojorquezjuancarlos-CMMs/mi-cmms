// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function DashboardOperativo() {
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [inventario, setInventario] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  // Estados para la Pantalla de Bienvenida (Splash Screen)
  const [mostrarSaludo, setMostrarSaludo] = useState(true) 
  const [saludoTexto, setSaludoTexto] = useState("Hello")
  const [nombreUsuario, setNombreUsuario] = useState("Juan Carlos") // Tu nombre por defecto

  useEffect(() => {
    // 1. LÓGICA DE BIENVENIDA ÚNICA
    const yaVisto = sessionStorage.getItem('saludoKinetix');
    if (yaVisto) {
      setMostrarSaludo(false); 
    } else {
      sessionStorage.setItem('saludoKinetix', 'true');
      setTimeout(() => setMostrarSaludo(false), 3800); // 3.8 segundos para disfrutar el saludo
    }

    async function cargarOperacion() {
      // Obtener datos del usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.full_name) {
        setNombreUsuario(user.user_metadata.full_name.split(' ')[0]);
      }

      // Determinar la hora local para el saludo
      const hora = new Date().getHours();
      if (hora < 12) setSaludoTexto("Good morning");
      else if (hora < 19) setSaludoTexto("Good afternoon");
      else setSaludoTexto("Good evening");

      // Cargar datos
      const { data: dataOrdenes } = await supabase.from("ordenes_trabajo").select("*, equipos(nombre, area)").order("creado_at", { ascending: false }).limit(30)
      if (dataOrdenes) setOrdenes(dataOrdenes)

      const { data: dataInv } = await supabase.from("refacciones").select("*")
      if (dataInv) setInventario(dataInv)
        
      setCargando(false)
    }
    cargarOperacion()
  }, [])

  const pendientes = ordenes.filter(o => o.estatus === 'Abierta' || o.estatus === 'Pendiente')
  const enProgreso = ordenes.filter(o => o.estatus === 'En Progreso')
  const cerradas = ordenes.filter(o => o.estatus === 'Cerrada').slice(0, 5) 
  const stockBajo = inventario.filter(i => i.cantidad <= (i.stock_minimo || 0))

  const TarjetaOrden = ({ orden }: { orden: any }) => (
    <Link href={`/ordenes/${orden.id}`} className="block bg-slate-900/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 p-4 rounded-2xl transition-all group shadow-lg cursor-pointer relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${orden.tipo_mantenimiento === 'Preventivo' ? 'bg-indigo-500' : 'bg-red-500'}`}></div>
      <div className="flex justify-between items-start mb-2 pl-2">
        <p className="text-xs font-mono font-bold text-slate-400 group-hover:text-white transition-colors">WO-{orden.id.substring(0,6).toUpperCase()}</p>
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${orden.tipo_mantenimiento === 'Preventivo' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-400'}`}>
          {orden.tipo_mantenimiento === 'Preventivo' ? 'PM' : 'CM'}
        </span>
      </div>
      <p className="font-bold text-white text-sm pl-2 mb-1">{orden.equipos?.nombre || "General Equipment"}</p>
      <p className="text-xs text-slate-400 pl-2 line-clamp-2 leading-relaxed">{orden.descripcion_falla}</p>
    </Link>
  )

  return (
    <>
      {/* PANTALLA DE CARGA Y BIENVENIDA (SPLASH SCREEN BLINDADO) */}
      {mostrarSaludo && (
        <div className={`fixed inset-0 z-[99999] bg-[#070B14] flex flex-col items-center justify-center transition-opacity duration-1000 ${cargando ? 'opacity-100' : 'opacity-95'}`}>
          
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 to-transparent pointer-events-none"></div>

          {/* LOGO KINETIX PRO EXACTO */}
          <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.3)] mb-8 animate-bounce">
            <svg className="w-14 h-14 text-[#070B14]" fill="currentColor" viewBox="0 0 24 24">
               <path d="M13 2L3 14h9l-1 8 10-12h-9l2-8z" />
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight animate-in slide-in-from-bottom-5 duration-700">
            {saludoTexto}, {nombreUsuario}!
          </h1>
          
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white/40 mb-8 animate-in slide-in-from-bottom-5 duration-700 delay-150">
            KINETIX <span className="text-emerald-500/40 font-medium">Pro</span>
          </h2>
          
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-5 h-5 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-400/80 font-bold tracking-widest uppercase text-sm">Synchronizing operations at JBI...</p>
          </div>
        </div>
      )}

      {/* DASHBOARD OPERATIVO NORMAL */}
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <div className="flex justify-between items-end mb-6 mt-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1">Operations Floor</h1>
            <p className="text-slate-400 text-sm">Crew monitoring, warehouse alerts, and real-time tickets</p>
          </div>
          <Link href="/ordenes" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all text-sm">
            Create New Order →
          </Link>
        </div>

        {/* MÉTRICAS Y ALERTAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <div className="bg-[#0B1221] border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center font-black text-xl">{pendientes.length}</div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">In Queue</p><p className="text-white font-bold text-sm">Open Tickets</p></div>
          </div>
          <div className="bg-[#0B1221] border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-xl animate-pulse">{enProgreso.length}</div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Floor</p><p className="text-white font-bold text-sm">Active Techs</p></div>
          </div>
          <div className="bg-[#0B1221] border border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-xl">{cerradas.length}</div>
            <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shift</p><p className="text-white font-bold text-sm">Completed WOs</p></div>
          </div>
          <Link href="/inventario" className="bg-amber-900/20 hover:bg-amber-900/40 border border-amber-500/30 p-5 rounded-2xl flex items-center gap-4 shadow-xl transition-colors group cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-xl">{stockBajo.length}</div>
            <div><p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest">Warehouse Alert</p><p className="text-amber-400 font-bold text-sm group-hover:text-amber-300">Low Stock</p></div>
          </Link>
        </div>

        {/* TABLERO TÁCTICO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[550px]">
            <h3 className="text-red-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Pending
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {pendientes.map(orden => <TarjetaOrden key={orden.id} orden={orden} />)}
              {pendientes.length === 0 && <p className="text-slate-600 text-sm text-center mt-10 font-bold">No pending orders.</p>}
            </div>
          </div>
          <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[550px]">
            <h3 className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div> In Progress
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {enProgreso.map(orden => <TarjetaOrden key={orden.id} orden={orden} />)}
              {enProgreso.length === 0 && <p className="text-slate-600 text-sm text-center mt-10 font-bold">No active work.</p>}
            </div>
          </div>
          <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col h-[550px]">
            <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              ✓ Recently Completed
            </h3>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {cerradas.map(orden => <TarjetaOrden key={orden.id} orden={orden} />)}
              {cerradas.length === 0 && <p className="text-slate-600 text-sm text-center mt-10 font-bold">No recent closures.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}