// @ts-nocheck
"use client"

import React, { useEffect, useState, use } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { 
  Activity, Zap, Thermometer, Cpu, Hash, ShieldAlert, ArrowLeft, Image as ImageIcon 
} from "lucide-react"

export default function VistaTelemetriaDetalle({ params }: any) {
  // === LA SOLUCIÓN ESTÁ AQUÍ ===
  const resolvedParams = use(params);
  const maquinaId = resolvedParams.id; 
  // =============================

  const [equipo, setEquipo] = useState<any>(null)
  const [telemetria, setTelemetria] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      // 1. Traer datos estáticos de la máquina (Ficha Técnica)
      const { data: dataEquipo } = await supabase
        .from('equipos')
        .select('*')
        .eq('id', maquinaId)
        .single();
      
      if (dataEquipo) setEquipo(dataEquipo);

      // 2. Traer el historial reciente (Últimas 5 lecturas)
      const { data: dataHistorial } = await supabase
        .from('lecturas_iot')
        .select('*')
        .eq('maquina_id', maquinaId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (dataHistorial && dataHistorial.length > 0) {
        setHistorial(dataHistorial);
        setTelemetria(dataHistorial[0]); // La más reciente es la actual
      }
      
      setCargando(false);
    }

    cargarDatos();

    // 3. Suscripción en vivo SOLO para esta máquina
    const canalMaquina = supabase
      .channel(`telemetria-${maquinaId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lecturas_iot', filter: `maquina_id=eq.${maquinaId}` },
        (payload) => {
          setTelemetria(payload.new);
          // Actualizamos el historial empujando el nuevo dato arriba y cortando a 5
          setHistorial(prev => [payload.new, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalMaquina);
    };
  }, [maquinaId]);

  if (cargando) return <div className="min-h-screen bg-[#0b101a] flex items-center justify-center text-white">Loading Asset Data...</div>;
  if (!equipo) return <div className="min-h-screen bg-[#0b101a] flex items-center justify-center text-white">Asset not found.</div>;

  // Lógica de estado igual a la del mapa
  const amps = telemetria ? Number(telemetria.amperaje_motor) : 0;
  let estado = 'OFFLINE';
  let colorEstado = 'bg-slate-500 text-slate-300';
  let glowEstado = 'shadow-[0_0_15px_#64748b]';

  if (telemetria) {
    if (amps <= 0.5) { estado = 'IDLE'; colorEstado = 'bg-sky-500/20 text-sky-400 border-sky-500/50'; glowEstado = 'shadow-[0_0_15px_#0ea5e9]'; }
    else if (amps >= 32.0) { estado = 'OVERLOAD'; colorEstado = 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'; glowEstado = 'shadow-[0_0_20px_#ef4444]'; }
    else { estado = 'OPERATING'; colorEstado = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'; glowEstado = 'shadow-[0_0_15px_#10b981]'; }
  }

  return (
    <div className="min-h-screen bg-[#0b101a] p-6 font-sans text-slate-300">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER Y NAVEGACIÓN */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/telemetria" className="p-2 bg-[#121826] hover:bg-[#1f2937] rounded-lg border border-[#1f2937] transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{equipo.nombre}</h1>
              <p className="text-slate-500 text-sm mt-1">Live Telemetry Profile</p>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-md text-sm font-black tracking-widest border uppercase ${colorEstado} ${glowEstado}`}>
            {estado}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA: FOTO Y DATOS DE PLACA */}
          <div className="space-y-6">
            <div className="bg-[#121826] rounded-2xl border border-[#1f2937] overflow-hidden shadow-xl">
              {/* Contenedor de la foto */}
              <div className="h-64 bg-[#070b14] relative flex items-center justify-center border-b border-[#1f2937]">
                {equipo.imagen_url ? (
                  <img src={equipo.imagen_url} alt={equipo.nombre} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="flex flex-col items-center text-slate-600">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                    <span className="text-sm font-medium">No Image Available</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#121826] to-transparent h-full"></div>
              </div>

              {/* Ficha Técnica Estática */}
              <div className="p-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-400" /> Asset Specifications
                </h3>
                <div className="space-y-3">
                  <FichaItem label="Model" value={equipo.modelo || 'N/A'} />
                  <FichaItem label="Serial Number" value={equipo.num_serie || 'N/A'} />
                  <FichaItem label="Voltage" value={equipo.voltaje || '460V 3~'} />
                  <FichaItem label="Full Load Amps" value={equipo.amperaje_max || '33 A'} />
                  <FichaItem label="Department" value={equipo.area || 'Production'} />
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: SENSORES EN VIVO Y RECORD */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Medidores Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SensorCard 
                icon={<Zap className="w-8 h-8 text-emerald-400" />}
                title="Current Draw"
                value={telemetria ? Number(telemetria.amperaje_motor).toFixed(2) : '--'}
                unit="Amps"
                alert={estado === 'OVERLOAD'}
              />
              <SensorCard 
                icon={<Thermometer className="w-8 h-8 text-amber-400" />}
                title="Cabinet Temp"
                value={telemetria ? Number(telemetria.temperatura_olla).toFixed(1) : '--'}
                unit="°C"
                alert={telemetria && Number(telemetria.temperatura_olla) > 45} // Alerta si pasa de 45 grados
              />
              <SensorCard 
                icon={<Activity className="w-8 h-8 text-sky-400" />}
                title="Vibration"
                value={telemetria ? Number(telemetria.vibracion_x).toFixed(3) : '--'}
                unit="G"
                alert={false}
              />
            </div>

            {/* Historial de Lecturas Recientes */}
            <div className="bg-[#121826] rounded-2xl border border-[#1f2937] p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400" /> Recent Telemetry Logs
                </h3>
                <span className="text-xs text-slate-500 font-mono">Updates every 5s</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1f2937] text-slate-400">
                      <th className="pb-3 font-medium">Timestamp</th>
                      <th className="pb-3 font-medium">Amperage</th>
                      <th className="pb-3 font-medium">Cabinet Temp</th>
                      <th className="pb-3 font-medium">Vibration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((log, idx) => {
                      const isHighAmp = Number(log.amperaje_motor) >= 32.0;
                      return (
                        <tr key={idx} className="border-b border-[#1f2937]/50 last:border-0 hover:bg-[#1e293b]/30 transition-colors">
                          <td className="py-3 text-slate-300 font-mono text-xs">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </td>
                          <td className={`py-3 font-mono font-bold ${isHighAmp ? 'text-red-400' : 'text-emerald-400'}`}>
                            {Number(log.amperaje_motor).toFixed(2)} A
                          </td>
                          <td className="py-3 font-mono text-amber-400">
                            {Number(log.temperatura_olla).toFixed(1)} °C
                          </td>
                          <td className="py-3 font-mono text-sky-400">
                            {Number(log.vibracion_x).toFixed(3)} G
                          </td>
                        </tr>
                      )
                    })}
                    {historial.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500 italic">No telemetry data recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// === Subcomponentes UI ===

function FichaItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#1f2937]/50 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white font-medium text-sm text-right">{value}</span>
    </div>
  )
}

function SensorCard({ icon, title, value, unit, alert }: any) {
  return (
    <div className={`bg-[#121826] rounded-2xl border ${alert ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-[#1f2937] shadow-xl'} p-6 relative overflow-hidden transition-all`}>
      {alert && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>}
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-400 font-medium text-sm">{title}</span>
        <div className={`p-2 rounded-lg ${alert ? 'bg-red-500/10' : 'bg-black/20'}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-4xl font-bold font-mono ${alert ? 'text-red-400' : 'text-white'}`}>{value}</span>
        <span className="text-slate-500 text-sm font-medium">{unit}</span>
      </div>
    </div>
  )
}