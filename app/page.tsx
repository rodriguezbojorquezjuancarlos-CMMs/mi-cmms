// @ts-nocheck
"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase" // Ajusta esta ruta según la estructura de tu proyecto
import Link from "next/link"
import {
  Package, Layers, Zap, Wifi, Wrench, Activity, AlertCircle, CheckCircle2, ChevronRight, Plus, Minus, Maximize
} from "lucide-react"

export default function CommandCenterPage() {
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [equipos, setEquipos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [telemetria, setTelemetria] = useState<any>({})
  const [mostrarSaludo, setMostrarSaludo] = useState(true) 
  const [saludoTexto, setSaludoTexto] = useState("Hello")
  const [nombreUsuario, setNombreUsuario] = useState("Executive") 
  
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D")
  const [zoomLevel, setZoomLevel] = useState(1.1)

  useEffect(() => {
    // Manejo del saludo inicial
    const yaVisto = sessionStorage.getItem('saludoKinetixClean');
    if (yaVisto) {
      setMostrarSaludo(false); 
    } else {
      sessionStorage.setItem('saludoKinetixClean', 'true');
      setTimeout(() => setMostrarSaludo(false), 2500); 
    }

    async function inicializar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.full_name) {
        setNombreUsuario(user.user_metadata.full_name.split(' ')[0]);
      }

      const hora = new Date().getHours();
      if (hora < 12) setSaludoTexto("Good morning");
      else if (hora < 19) setSaludoTexto("Good afternoon");
      else setSaludoTexto("Good evening");

      const { data: dataOrdenes } = await supabase.from("ordenes_trabajo").select("*, equipos(nombre, area)").order("creado_at", { ascending: false }).limit(50)
      if (dataOrdenes) setOrdenes(dataOrdenes)

      const { data: dataEquipos } = await supabase.from("equipos").select("*").order("nombre", { ascending: true })
      if (dataEquipos) setEquipos(dataEquipos)
        
      setCargando(false)
    }
    
    inicializar()

    // 1. Traer la última telemetría al cargar
    const fetchTelemetria = async () => {
      const { data } = await supabase
        .from('lecturas_iot')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (data && data.length > 0) {
        const datosPorMaquina = {};
        data.forEach(lectura => {
          if (!datosPorMaquina[lectura.maquina_id]) {
            datosPorMaquina[lectura.maquina_id] = lectura;
          }
        });
        setTelemetria(datosPorMaquina);
      }
    };

    fetchTelemetria();

    // 2. Suscripción a Supabase Realtime (WebSockets)
    const canalIoT = supabase
      .channel('telemetria-en-vivo')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'lecturas_iot' 
        },
        (payload) => {
          // Actualiza al instante solo la máquina que mandó el dato nuevo
          setTelemetria((prev) => ({
            ...prev,
            [payload.new.maquina_id]: payload.new
          }));
        }
      )
      .subscribe();

    // Limpiamos el canal al salir de la página
    return () => {
      supabase.removeChannel(canalIoT);
    };
  }, [])

  // Estado base basado puramente en Órdenes de Trabajo (CMMS)
  const obtenerEstadoBaseMaquina = (equipoId: string) => {
    if (!equipoId) return 'OPERATING'; 
    const ordenesActivas = ordenes.filter(o => o.equipo_id === equipoId && (o.estatus === 'Abierta' || o.estatus === 'Pendiente' || o.estatus === 'En Progreso'));
    if (ordenesActivas.length === 0) return 'OPERATING';
    const fallaCritica = ordenesActivas.find(o => o.tipo_mantenimiento !== 'Preventivo');
    if (fallaCritica) return 'DOWN';
    return 'MAINTENANCE';
  }

  // UUID REAL ASIGNADO A LA PANEL SAW
const maquinasLayout = [
    { id: '65d5a5df-89bd-4107-877a-6d41bb7fe3b9', nombre: 'CNC Panel Saw', x: 10, y: 15 },
    { id: '123e4567-e89b-12d3-a456-426614174000', nombre: 'CNC Router #1 (Weeke)', x: 28, y: 15 },
    { id: 'id-router-2', nombre: 'CNC Router #2', x: 42, y: 15 },
    { id: 'id-edgebander', nombre: 'Edge Bander', x: 65, y: 15 },
    { id: 'id-dowel', nombre: 'CNC Dowell Drill', x: 78, y: 15 } /* <-- Ahora está a la derecha del 65 */
  ];

  const fallasActivas = ordenes.filter(o => o.tipo_mantenimiento !== 'Preventivo' && o.estatus !== 'Cerrada')
  const tecnicosActivos = ordenes.filter(o => o.estatus === 'En Progreso').length

  const ordAbiertas = ordenes.filter(o => o.estatus === 'Abierta' || o.estatus === 'Pendiente').length;
  const ordProgreso = tecnicosActivos;
  const ordCerradas = ordenes.filter(o => o.estatus === 'Cerrada').length;
  const totalOrdenes = ordenes.length || 1; 

  const layoutTransform = viewMode === '3D' 
    ? `rotateX(60deg) rotateZ(-45deg) scale(${0.85 * zoomLevel}) translateY(16px)`
    : `scale(${zoomLevel})`;

  return (
    <div className="w-full text-slate-300 font-sans animate-in fade-in duration-700 bg-[#0b101a] min-h-screen">
      
      {mostrarSaludo && (
        <div className={`fixed inset-0 z-[99999] bg-[#0b101a] flex flex-col items-center justify-center transition-opacity duration-700 ${cargando ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">KINETIX</h1>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-500 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Loading workspace...</p>
          </div>
        </div>
      )}

      <div className="space-y-6 pb-20 pt-6 px-2 md:px-6 max-w-[1700px] mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-slate-800/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs font-medium">
              <span>JBI Corporate</span>
              <ChevronRight className="w-3 h-3" />
              <span>Nogales Plant</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-200">Command Center</span>
            </div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">
              Plant Telemetry Overview
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/piso" className="bg-white hover:bg-slate-100 text-slate-900 px-5 py-2.5 rounded-lg transition-colors text-sm font-bold flex items-center gap-2 shadow-sm">
              <Layers className="w-4 h-4" />
              Kanban Board
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <KpiCard title="Total Assets" value={equipos.length || 0} subtitle="Active Inventory" color="blue" icon={<Package className="w-5 h-5 text-blue-300" />} />
          <KpiCard title="System Status" value="100%" subtitle="All systems nominal" color="green" icon={<Wifi className="w-5 h-5 text-green-400" />} />
          <KpiCard title="Active Faults" value={fallasActivas.length} subtitle={fallasActivas.length > 0 ? "Requires attention" : "No critical issues"} color="red" icon={<Zap className="w-5 h-5 text-red-400" />} />
          <KpiCard title="Techs on Floor" value={tecnicosActivos} subtitle="Assigned to work orders" color="yellow" icon={<Wrench className="w-5 h-5 text-yellow-400" />} />
        </div>

        {/* SECCIÓN CENTRAL: MAPA + MEDIDORES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          
          <div className="lg:col-span-8 bg-[#121826] border border-[#1f2937] rounded-2xl flex flex-col shadow-xl z-20 relative">
            
            {/* Header del Mapa */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-[#1f2937] bg-[#121826] rounded-t-2xl z-30 relative">
              <div className="flex items-center gap-3">
                <h2 className="text-white font-medium text-lg">Facility Layout</h2>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest border border-blue-500/30 uppercase animate-pulse">Live</span>
              </div>
              
              <div className="flex bg-[#0b101a] rounded-lg border border-[#1f2937] p-1">
                <button onClick={() => setViewMode('2D')} className={`px-4 py-1.5 text-xs font-bold transition-colors rounded-md ${viewMode === '2D' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>2D Map</button>
                <button onClick={() => setViewMode('3D')} className={`px-4 py-1.5 text-xs font-bold transition-colors rounded-md ${viewMode === '3D' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>3D View</button>
              </div>
            </div>

            {/* CONTENEDOR DEL PLANO */}
            <div className="flex-1 relative bg-[#070b14] min-h-[600px] w-full rounded-b-2xl flex items-center justify-center overflow-hidden p-4">
              
              {/* CONTROLES DE ZOOM FLOTANTES */}
              <div className="absolute right-6 bottom-6 flex flex-col gap-2 z-[999999] bg-[#0b101a]/80 p-2 rounded-xl border border-slate-700/50 backdrop-blur-md">
                <button onClick={() => setZoomLevel(p => Math.min(p + 0.3, 4.0))} className="w-10 h-10 bg-[#1e293b] hover:bg-blue-600 border border-slate-600 rounded-lg flex items-center justify-center text-white transition-all shadow-lg">
                  <Plus className="w-5 h-5" />
                </button>
                <button onClick={() => setZoomLevel(1.1)} className="w-10 h-10 bg-[#1e293b] hover:bg-blue-600 border border-slate-600 rounded-lg flex items-center justify-center text-white transition-all shadow-lg" title="Reset Zoom">
                  <Maximize className="w-4 h-4" />
                </button>
                <button onClick={() => setZoomLevel(p => Math.max(p - 0.3, 0.5))} className="w-10 h-10 bg-[#1e293b] hover:bg-blue-600 border border-slate-600 rounded-lg flex items-center justify-center text-white transition-all shadow-lg">
                  <Minus className="w-5 h-5" />
                </button>
              </div>

              <div 
                className="relative transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] w-full max-w-5xl perspective-container"
                style={{ transform: layoutTransform }}
              >
                
                <img src="/plano.png" alt="Layout" className="w-full h-auto opacity-85 block relative z-10" />

                {maquinasLayout.map((maquina) => {
                  let estado = obtenerEstadoBaseMaquina(maquina.id); 
                  const dataIoT = telemetria[maquina.id];

                  // === FUSIÓN DE LÓGICA: CMMS + IoT ===
                  if (estado === 'OPERATING') {
                    if (!dataIoT) {
                      estado = 'OFFLINE';
                    } else {
                      const amps = Number(dataIoT.amperaje_motor);
                      if (amps <= 0.5) { 
                        estado = 'IDLE'; 
                      } else if (amps >= 32.0) { // CALIBRADO CON PLACA DE HOLZMA HPP 350
                        estado = 'OVERLOAD'; 
                      } else { 
                        estado = 'CUTTING'; 
                      }
                    }
                  }

                  // === ASIGNACIÓN DINÁMICA DE COLORES ===
                  let dotColor = 'bg-slate-600 shadow-[0_0_10px_#475569]';
                  let pulseClass = '';
                  let label = 'Offline / No Data';
                  let labelColor = 'bg-slate-500/20 text-slate-400';

                  if (estado === 'DOWN') {
                    dotColor = 'bg-rose-600 shadow-[0_0_20px_#e11d48]';
                    pulseClass = 'animate-ping opacity-60';
                    label = 'Critical Fault';
                    labelColor = 'bg-rose-500/20 text-rose-400';
                  } else if (estado === 'MAINTENANCE') {
                    dotColor = 'bg-amber-500 shadow-[0_0_15px_#f59e0b]';
                    label = 'Maintenance';
                    labelColor = 'bg-amber-500/20 text-amber-400';
                  } else if (estado === 'OVERLOAD') {
                    dotColor = 'bg-red-500 shadow-[0_0_25px_#ef4444]';
                    pulseClass = 'animate-pulse';
                    label = 'OVERLOAD WARNING';
                    labelColor = 'bg-red-500/30 text-red-400 font-black border border-red-500/50 uppercase';
                  } else if (estado === 'CUTTING') {
                    dotColor = 'bg-emerald-500 shadow-[0_0_15px_#10b981]';
                    label = 'Operating';
                    labelColor = 'bg-emerald-500/20 text-emerald-400';
                  } else if (estado === 'IDLE') {
                    dotColor = 'bg-sky-400 shadow-[0_0_15px_#38bdf8]';
                    label = 'Idle (Standby)';
                    labelColor = 'bg-sky-500/20 text-sky-400';
                  }

                  // Posicionamiento inteligente del Tooltip
                  const isTooTop = maquina.y < 35; 
                  const isTooLeft = maquina.x < 25;
                  const isTooRight = maquina.x > 75;

                  const tooltipYClass = isTooTop 
                    ? 'top-[calc(100%+10px)] group-hover:translate-y-0 translate-y-[-10px]' 
                    : 'bottom-[calc(100%+10px)] group-hover:translate-y-0 translate-y-4'; 
                  
                  const tooltipXClass = isTooLeft 
                    ? 'left-0' 
                    : isTooRight ? 'right-0' : 'left-1/2 -translate-x-1/2';

                  return (
                    <div 
                      key={maquina.id}
                      className="absolute group cursor-crosshair z-40 hover:z-[99999]" 
                      style={{ left: `${maquina.x}%`, top: `${maquina.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      {/* Punto de Máquina con Halo */}
                      <div className="relative flex items-center justify-center w-14 h-14 bg-black/60 rounded-full shadow-[0_0_20px_black] border border-white/10 transition-transform group-hover:scale-125">
                        { (estado === 'DOWN' || estado === 'OVERLOAD') && 
                          <div className={`absolute w-8 h-8 rounded-full ${dotColor} ${pulseClass}`}></div> 
                        }
                        <div className={`w-4 h-4 rounded-full ${dotColor} border-[3px] border-[#070b14] z-10`}></div>
                      </div>

                      {/* Tooltip HUD */}
                      <div className={`absolute ${tooltipYClass} ${tooltipXClass} w-60 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[99999] ${viewMode === '3D' ? 'counter-rotate-inner' : ''} transform`}>
                        <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-slate-600 rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-3 relative">
                          
                          <p className="text-white font-bold text-sm mb-2 pb-1.5 border-b border-slate-600">
                            {maquina.nombre}
                          </p>
                          
                          {dataIoT ? (
                            <table className="w-full text-xs font-mono my-2">
                              <tbody>
                                <tr>
                                  <td className="text-slate-400 py-1">Amperage</td>
                                  <td className={`${estado === 'OVERLOAD' ? 'text-red-400 animate-pulse' : 'text-emerald-400'} font-bold text-right`}>
                                    {Number(dataIoT.amperaje_motor).toFixed(2)} A
                                  </td>
                                </tr>
                                <tr>
                                  <td className="text-slate-400 py-1">Cabinet Temperature</td>
                                  <td className="text-amber-400 font-bold text-right">{Number(dataIoT.temperatura_olla).toFixed(1)} °C</td>
                                </tr>
                                <tr>
                                  <td className="text-slate-400 py-1">Vibration</td>
                                  <td className="text-sky-400 font-bold text-right">{Number(dataIoT.vibracion_x).toFixed(3)} G</td>
                                </tr>
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-slate-500 text-xs mb-3 font-mono text-center py-3 bg-black/30 rounded border border-slate-700/50">
                              Awaiting Telemetry...
                            </div>
                          )}

                          {/* La etiqueta de estado final */}
                          <div className={`mt-2 py-1.5 rounded text-[11px] font-black tracking-widest text-center ${labelColor}`}>
                            {label}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Panel Derecho: Rendimiento */}
          <div className="lg:col-span-4 flex flex-col gap-6 relative z-10">
            <div className="bg-[#121826] border border-[#1f2937] rounded-2xl p-6 shadow-xl">
              <h3 className="text-white font-medium mb-6">Real-Time Performance</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <CircularGauge value={92} max={100} label="PM Compliance" subLabel="Goal: 95%" color="#22c55e" format="%" />
                <CircularGauge value={fallasActivas.length > 0 ? 1.8 : 0} max={5} label="Avg MTTR" subLabel="Goal: < 2 hrs" color="#3b82f6" format="h" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <MiniGauge value={tecnicosActivos} label="Active Techs" color="#eab308" unit="Users" />
                <MiniGauge value={ordenes.length} label="Work Orders" color="#a855f7" unit="YTD" />
              </div>
            </div>

            <div className="bg-[#121826] border border-[#1f2937] rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-white font-medium">Attention Required</h3>
                <span className="text-xs font-medium text-slate-400">{fallasActivas.length} Issues</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">
                {fallasActivas.slice(0,4).map((falla, i) => (
                  <div key={i} className="bg-[#0b101a] hover:bg-slate-800/80 transition-colors p-4 rounded-xl border border-[#1f2937] flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-slate-200 text-sm font-bold">{falla.equipos?.nombre || 'Unknown Asset'}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{falla.descripcion}</p>
                    </div>
                  </div>
                ))}
                {fallasActivas.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mb-3" />
                    <p className="text-sm font-medium text-slate-300">All Systems Clear</p>
                    <p className="text-xs text-slate-500 mt-1">No pending critical issues.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Paneles Inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#121826] border border-[#1f2937] rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-white font-medium mb-6">Work Order Distribution</h2>
              <div className="space-y-4">
                <LegendItem color="bg-slate-400" label="Open / Pending" value={ordAbiertas} />
                <LegendItem color="bg-blue-500" label="In Progress" value={ordProgreso} />
                <LegendItem color="bg-emerald-500" label="Completed" value={ordCerradas} />
              </div>
            </div>
            <div className="w-32 h-32 relative shrink-0 ml-6">
              <CleanDonutChart pOpen={(ordAbiertas/totalOrdenes)*100} pProg={(ordProgreso/totalOrdenes)*100} pClosed={(ordCerradas/totalOrdenes)*100} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white font-semibold text-2xl">{ordenes.length}</span>
                <span className="text-xs text-slate-500">Total</span>
              </div>
            </div>
          </div>

          <div className="bg-[#121826] border border-[#1f2937] rounded-2xl p-6 lg:col-span-2 shadow-xl">
            <h2 className="text-white font-medium mb-6">Common Failure Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <CleanProgress code="MECH" label="Bearing Wear" pct={28} color="bg-slate-400" />
              <CleanProgress code="ELEC" label="Sensor Calibration" pct={42} color="bg-blue-500" />
              <CleanProgress code="PNEU" label="Air Pressure Drop" pct={15} color="bg-amber-500" />
              <CleanProgress code="HYDR" label="Fluid Low Level" pct={10} color="bg-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .counter-rotate-inner { 
          transform: rotateZ(45deg) rotateX(-60deg) translateY(-20px) translateZ(30px) !important; 
          transform-origin: bottom center;
        }
        .perspective-container { transform-style: preserve-3d; perspective: 1200px; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #374151; }
      `}} />
    </div>
  )
}

// === COMPONENTES SECUNDARIOS (NO TOCAR) ===

function KpiCard({ title, value, subtitle, color, icon }: any) {
  const bgColors = {
    blue: "bg-gradient-to-br from-[#1e3a8a] to-[#172554] border-blue-900/50",
    green: "bg-gradient-to-br from-[#14532d] to-[#052e16] border-green-900/50",
    red: "bg-gradient-to-br from-[#7f1d1d] to-[#450a0a] border-red-900/50",
    yellow: "bg-gradient-to-br from-[#713f12] to-[#422006] border-yellow-900/50",
  };
  return (
    <div className={`${bgColors[color as keyof typeof bgColors]} border rounded-2xl p-5 relative overflow-hidden shadow-lg`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-white font-medium text-sm">{title}</h3>
        <div className="p-1.5 bg-black/20 rounded-lg">{icon}</div>
      </div>
      <div className="mt-4">
        <p className="text-4xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

function CircularGauge({ value, max, label, subLabel, color, format }: any) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / max) * circumference;
  return (
    <div className="flex flex-col items-center">
      <span className="text-gray-400 text-xs mb-3">{label}</span>
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white font-bold text-xl">{value}<span className="text-sm font-normal ml-0.5">{format}</span></span>
        </div>
      </div>
      <span className="text-gray-500 text-[10px] mt-2">{subLabel}</span>
    </div>
  );
}

function MiniGauge({ value, label, color, unit }: any) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 h-14 mb-2">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="28" cy="28" r={radius} fill="none" stroke="#1f2937" strokeWidth="4" />
          <circle cx="28" cy="28" r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference * 0.3} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-white font-bold text-lg">{value}</span>
          <span className="text-gray-500 text-[8px]">{unit}</span>
        </div>
      </div>
      <span className="text-gray-400 text-xs text-center">{label}</span>
    </div>
  );
}

function LegendItem({ color, label, value }: any) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
        <span className="text-slate-300">{label}</span>
      </div>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function CleanDonutChart({ pOpen, pProg, pClosed }: { pOpen: number, pProg: number, pClosed: number }) {
  const circ = 251.2;
  const openDash = (pOpen / 100) * circ;
  const progDash = (pProg / 100) * circ;
  const closedDash = (pClosed / 100) * circ;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-md">
      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1e293b" strokeWidth="8" />
      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#94a3b8" strokeWidth="8" strokeDasharray={`${openDash} ${circ}`} strokeDashoffset="0" className="transition-all duration-1000" strokeLinecap="round" />
      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="8" strokeDasharray={`${progDash} ${circ}`} strokeDashoffset={-openDash} className="transition-all duration-1000" strokeLinecap="round" />
      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="8" strokeDasharray={`${closedDash} ${circ}`} strokeDashoffset={-(openDash + progDash)} className="transition-all duration-1000" strokeLinecap="round" />
    </svg>
  );
}

function CleanProgress({ code, label, pct, color }: { code: string, label: string, pct: number, color: string }) {
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-300 text-sm font-medium">{label}</span>
        <span className="text-slate-400 text-xs font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}