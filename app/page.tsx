// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function CommandCenterPage() {
  const [ordenes, setOrdenes] = useState<any[]>([])
  const [equipos, setEquipos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  const [telemetria, setTelemetria] = useState<any>({})
  const [mostrarSaludo, setMostrarSaludo] = useState(true) 
  const [saludoTexto, setSaludoTexto] = useState("Hello")
  const [nombreUsuario, setNombreUsuario] = useState("Executive") 

  useEffect(() => {
    const yaVisto = sessionStorage.getItem('saludoKinetix');
    if (yaVisto) {
      setMostrarSaludo(false); 
    } else {
      sessionStorage.setItem('saludoKinetix', 'true');
      setTimeout(() => setMostrarSaludo(false), 3800); 
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

      // Consultas a BD (Se mantienen en español para no romper la conexión)
      const { data: dataOrdenes } = await supabase.from("ordenes_trabajo").select("*, equipos(nombre, area)").order("creado_at", { ascending: false }).limit(50)
      if (dataOrdenes) setOrdenes(dataOrdenes)

      const { data: dataEquipos } = await supabase.from("equipos").select("*").order("nombre", { ascending: true })
      if (dataEquipos) setEquipos(dataEquipos)
        
      setCargando(false)
    }
    
    inicializar()

    // Jalar telemetría del ESP32/Wokwi
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
    const intervaloIot = setInterval(fetchTelemetria, 5000);
    
    return () => clearInterval(intervaloIot);
  }, [])

  const obtenerEstadoMaquina = (equipoId: string) => {
    if (!equipoId) return 'OPERATING'; 
    // Lógica interna se mantiene en español para empatar con la BD
    const ordenesActivas = ordenes.filter(o => o.equipo_id === equipoId && (o.estatus === 'Abierta' || o.estatus === 'Pendiente' || o.estatus === 'En Progreso'));
    if (ordenesActivas.length === 0) return 'OPERATING';
    const fallaCritica = ordenesActivas.find(o => o.tipo_mantenimiento !== 'Preventivo');
    if (fallaCritica) return 'DOWN';
    return 'MAINTENANCE';
  }

  // 📍 COORDENADAS EXACTAS
  const maquinasLayout = [
    { id: 'id-panel-saw', nombre: 'Panel Saw', x: 10, y: 15 },
    { id: '123e4567-e89b-12d3-a456-426614174000', nombre: 'CNC Router #1 (Weeke)', x: 28, y: 15 },
    { id: 'id-router-2', nombre: 'CNC Router #2', x: 42, y: 15 },
    { id: 'id-dowel', nombre: 'CNC Dowel Drill', x: 55, y: 15 },
    { id: 'id-edgebander', nombre: 'Edge Bander', x: 65, y: 15 },
    { id: 'id-unisand', nombre: 'Unisand', x: 82, y: 75 }
  ];

  // Lógica interna se mantiene en español
  const fallasActivas = ordenes.filter(o => o.tipo_mantenimiento !== 'Preventivo' && o.estatus !== 'Cerrada')
  const tecnicosActivos = ordenes.filter(o => o.estatus === 'En Progreso').length

  return (
    <>
      {mostrarSaludo && (
        <div className={`fixed inset-0 z-[99999] bg-[#070B14] flex flex-col items-center justify-center transition-opacity duration-1000 ${cargando ? 'opacity-100' : 'opacity-95'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 to-transparent pointer-events-none"></div>
          <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.3)] mb-8 animate-bounce">
            <svg className="w-14 h-14 text-[#070B14]" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l2-8z" /></svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight animate-in slide-in-from-bottom-5 duration-700">
            {saludoTexto}, {nombreUsuario}!
          </h1>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white/40 mb-8 animate-in slide-in-from-bottom-5 duration-700 delay-150">
            KINETIX <span className="text-emerald-500/40 font-medium">Pro</span>
          </h2>
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-5 h-5 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-400/80 font-bold tracking-widest uppercase text-sm">Synchronizing plant telemetry...</p>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-in fade-in duration-700 pb-20">
        
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4 pt-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">System Online</span>
              </div>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">JBI Corporate</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Command Center</h1>
            <p className="text-slate-400 text-sm mt-1">SCADA satellite supervision & live operations status</p>
          </div>
          <div className="flex gap-3">
            <Link href="/piso" className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              View Kanban Board
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0B1221] border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform"></div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Network Health</p>
            <h3 className="text-2xl font-black text-white flex items-center gap-2"><span className="text-emerald-500">100</span>%</h3>
          </div>
          <div className="bg-[#0B1221] border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Floor Technicians</p>
            <h3 className="text-2xl font-black text-white flex items-center gap-2"><span className="text-amber-500">{tecnicosActivos}</span></h3>
          </div>
          <div className="bg-[#0B1221] border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-all">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Critical Alerts</p>
            <h3 className="text-2xl font-black text-white flex items-center gap-2"><span className="text-red-500">{fallasActivas.length}</span></h3>
          </div>
          <div className="bg-[#0B1221] border border-slate-800 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Assets</p>
            <h3 className="text-2xl font-black text-white flex items-center gap-2"><span className="text-blue-500">{equipos.length}</span></h3>
          </div>
        </div>

        {/* MAPA DE PLANTA REAL */}
        <div className="bg-[#0B1221] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col">
          
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-black text-xl">Plant Layout (Live Telemetry)</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Topographical mapping of IoT assets</p>
            </div>
            <div className="flex gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div> Operating
              </span>
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse"></div> Down
              </span>
              <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></div> Maintenance
              </span>
            </div>
          </div>

          {/* CONTENEDOR DE LA IMAGEN AUTOCAD */}
          <div className="w-full relative bg-[#070B14] border border-slate-700 rounded-2xl shadow-inner mt-4">
            
            <img 
              src="/plano.png" 
              alt="JBI Plant Layout" 
              className="w-full h-auto object-contain opacity-80 mix-blend-screen rounded-2xl"
              style={{ minHeight: '500px' }}
            />

            {/* PUNTOS DE LAS MÁQUINAS */}
            {cargando ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-emerald-500 font-bold animate-pulse backdrop-blur-sm rounded-2xl">
                Connecting to ESP32...
              </div>
            ) : (
              maquinasLayout.map((maquina) => {
                const estado = obtenerEstadoMaquina(maquina.id);
                const dataIoT = telemetria[maquina.id];

                let colorLED = 'bg-emerald-500 shadow-[0_0_15px_#10b981]';
                let animation = '';
                let colorBorder = 'border-emerald-400';

                if (estado === 'DOWN') {
                  colorLED = 'bg-red-500 shadow-[0_0_20px_#ef4444]';
                  animation = 'animate-pulse';
                  colorBorder = 'border-red-400';
                } else if (estado === 'MAINTENANCE') {
                  colorLED = 'bg-amber-500 shadow-[0_0_15px_#f59e0b]';
                  colorBorder = 'border-amber-400';
                }

                return (
                  <div 
                    key={maquina.id}
                    className="absolute group cursor-crosshair z-20"
                    style={{ left: `${maquina.x}%`, top: `${maquina.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    {/* FOCO LED REDISEÑADO */}
                    <div className="relative flex items-center justify-center w-10 h-10 bg-[#070B14]/90 rounded-full border border-slate-500/50 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-110">
                      {estado === 'DOWN' && <div className={`absolute inset-0 rounded-full ${colorLED} opacity-40 animate-ping`}></div>}
                      <div className={`w-3.5 h-3.5 rounded-full ${colorLED} ${animation} border-2 ${colorBorder} transition-colors duration-500`}></div>
                    </div>

                    {/* TOOLTIP FLOTANTE */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-60 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] transform group-hover:-translate-y-2">
                      <div className="bg-[#1e293b] border border-slate-500 p-4 rounded-xl shadow-[0_25px_50px_rgba(0,0,0,0.95)] flex flex-col relative">
                        <p className="text-sky-400 font-black text-sm uppercase tracking-wider mb-3 border-b border-slate-600 pb-2">{maquina.nombre}</p>
                        
                        {/* Datos de Sensores */}
                        {dataIoT ? (
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-bold tracking-wide">Amperage:</span>
                              <span className="text-emerald-400 font-mono bg-[#070B14] border border-slate-700 px-2 py-1 rounded shadow-inner">{Number(dataIoT.amperaje_motor).toFixed(2)} A</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-bold tracking-wide">Glue Pot Temp:</span>
                              <span className="text-amber-400 font-mono bg-[#070B14] border border-slate-700 px-2 py-1 rounded shadow-inner">{Number(dataIoT.temperatura_olla).toFixed(1)} °C</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-bold tracking-wide">Vibration:</span>
                              <span className="text-sky-400 font-mono bg-[#070B14] border border-slate-700 px-2 py-1 rounded shadow-inner">{Number(dataIoT.vibracion_x).toFixed(3)} G</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-[10px] font-mono mb-4 mt-2 text-center italic bg-[#070B14] py-3 rounded-lg border border-slate-800/50">
                            Waiting for telemetry...
                          </div>
                        )}

                        {/* Badge de Mantenimiento */}
                        <div className={`py-2 rounded-md text-[10px] font-black uppercase tracking-widest text-center border ${
                          estado === 'DOWN' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                          estado === 'MAINTENANCE' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                        }`}>
                          {estado === 'DOWN' ? 'Active Fault' : estado}
                        </div>
                      </div>
                      
                      {/* Flechita del tooltip */}
                      <div className="w-4 h-4 bg-[#1e293b] border-b border-r border-slate-500 transform rotate-45 absolute -bottom-2 left-1/2 -translate-x-1/2 z-[-1]"></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

        </div>
      </div>
    </>
  )
}