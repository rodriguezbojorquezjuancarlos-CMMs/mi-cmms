// @ts-nocheck
"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Activity, Zap, Server, ChevronRight, Image as ImageIcon } from "lucide-react"

export default function TelemetriaHub() {
  const [equipos, setEquipos] = useState<any[]>([])
  const [telemetria, setTelemetria] = useState<any>({})
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarDatos() {
      // 1. Traer TODO el catálogo de máquinas
      const { data: dataEquipos } = await supabase
        .from('equipos')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (dataEquipos) setEquipos(dataEquipos);

      // 2. Traer lecturas recientes para ver quiénes están conectados
      const { data: dataIoT } = await supabase
        .from('lecturas_iot')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); 

      if (dataIoT) {
        const ultimasLecturas = {};
        dataIoT.forEach(lectura => {
          if (!ultimasLecturas[lectura.maquina_id]) {
            ultimasLecturas[lectura.maquina_id] = lectura;
          }
        });
        setTelemetria(ultimasLecturas);
      }
      
      setCargando(false);
    }

    cargarDatos();

    // 3. Suscripción global (las tarjetas pálpitan en vivo desde este menú general)
    const canalGlobal = supabase
      .channel('telemetria-hub')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lecturas_iot' },
        (payload) => {
          setTelemetria(prev => ({
            ...prev,
            [payload.new.maquina_id]: payload.new
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalGlobal);
    };
  }, []);

  if (cargando) return (
    <div className="min-h-screen bg-[#0b101a] flex flex-col items-center justify-center text-white gap-4">
      <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium">Scanning facility fleet...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b101a] p-6 font-sans text-slate-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            Fleet Telemetry Hub
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Real-time sensor monitoring for all connected assets. Select a machine to view its detailed profile.
          </p>
        </div>

        {/* GRID DE MÁQUINAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {equipos.map(equipo => {
            const dataIoT = telemetria[equipo.id];
            
            // Lógica de Estados
            let estado = 'OFFLINE';
            let colorPunto = 'bg-slate-600';
            let colorBorde = 'border-[#1f2937]';
            
            if (dataIoT) {
              const amps = Number(dataIoT.amperaje_motor);
              if (amps <= 0.5) { 
                estado = 'IDLE'; 
                colorPunto = 'bg-sky-400 shadow-[0_0_10px_#38bdf8]'; 
                colorBorde = 'border-sky-500/30';
              } else if (amps >= 32.0) { 
                estado = 'OVERLOAD'; 
                colorPunto = 'bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse'; 
                colorBorde = 'border-red-500/50';
              } else { 
                estado = 'OPERATING'; 
                colorPunto = 'bg-emerald-500 shadow-[0_0_10px_#10b981]'; 
                colorBorde = 'border-emerald-500/30';
              }
            }

            return (
              <Link href={`/telemetria/${equipo.id}`} key={equipo.id} className="block group">
                <div className={`bg-[#121826] rounded-2xl border ${colorBorde} overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 relative h-full flex flex-col`}>
                  
                  {/* Foto de Portada (Mini) */}
                  <div className="h-32 bg-[#070b14] relative flex items-center justify-center border-b border-[#1f2937]/50">
                    {equipo.imagen_url ? (
                      <img src={equipo.imagen_url} alt={equipo.nombre} className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-700" />
                    )}
                    {/* Badge de Estado Esquina Superior */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                      <div className={`w-2 h-2 rounded-full ${colorPunto}`}></div>
                      <span className="text-[10px] font-bold text-white tracking-wider uppercase">{estado}</span>
                    </div>
                  </div>

                  {/* Info de la Tarjeta */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-white font-bold text-base line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {equipo.nombre}
                      </h3>
                      <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                        <Server className="w-3 h-3" /> {equipo.modelo || 'N/A'}
                      </p>
                    </div>

                    {/* Fila de Datos Rápidos si está conectada */}
                    <div className="mt-5 pt-4 border-t border-[#1f2937]/50 flex justify-between items-center">
                      {dataIoT ? (
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Amps</span>
                            <span className={`font-mono font-bold text-sm ${estado === 'OVERLOAD' ? 'text-red-400' : 'text-emerald-400'}`}>
                              {Number(dataIoT.amperaje_motor).toFixed(1)}A
                            </span>
                          </div>
                          <div className="flex flex-col border-l border-slate-700 pl-4">
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Temp</span>
                            <span className="font-mono font-bold text-sm text-amber-400">
                              {Number(dataIoT.temperatura_olla).toFixed(0)}°C
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs italic">Awaiting Sensor Hookup</span>
                      )}
                      
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                      </div>
                    </div>
                  </div>

                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}