// @ts-nocheck
"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ControlTiempoOrden({ 
  ordenId, 
  estadoInicial = 'pendiente',
  horaInicioDB = null,
  horaFinDB = null,
  ordenCerrada = false
}: { 
  ordenId: string, 
  estadoInicial?: string,
  horaInicioDB?: string | null,
  horaFinDB?: string | null,
  ordenCerrada?: boolean
}) {
  const [estado, setEstado] = useState(estadoInicial);
  const [cargando, setCargando] = useState(false);
  const [horaInicio, setHoraInicio] = useState<string | null>(horaInicioDB);
  const [horaFin, setHoraFin] = useState<string | null>(horaFinDB);

  useEffect(() => {
    if (horaInicioDB) setHoraInicio(horaInicioDB);
    if (horaFinDB) setHoraFin(horaFinDB);
    if (estadoInicial) setEstado(estadoInicial);
  }, [horaInicioDB, horaFinDB, estadoInicial]);

  // LA SOLUCIÓN REAL: Le inyectamos la "Z" a la fuerza si Supabase se la quitó.
  // Así Javascript siempre sabe que es hora de servidor y hace la conversión a tu hora local sin fallar.
  const parseDateSafe = (dateString: string | null) => {
    if (!dateString || String(dateString).trim() === '') return null;
    
    let cleaned = String(dateString).replace(' ', 'T');
    if (!cleaned.endsWith('Z')) {
      cleaned += 'Z';
    }
    
    const d = new Date(cleaned);
    return isNaN(d.getTime()) ? null : d;
  };

  // Cálculo limpio usando solo milisegundos nativos. Cero matemáticas raras.
  const calcularDuracion = () => {
    const inicio = parseDateSafe(horaInicio);
    const fin = parseDateSafe(horaFin);
    
    if (!inicio || !fin) return null;

    let diffMs = fin.getTime() - inicio.getTime();
    if (diffMs < 0) diffMs = Math.abs(diffMs); // Por seguridad
    
    const totalMinutos = Math.floor(diffMs / 60000);
    const hrs = Math.floor(totalMinutos / 60);
    const mins = totalMinutos % 60;
    
    if (hrs === 0 && mins === 0) return "< 1m";
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m`;
  };

  const iniciarTrabajo = async () => {
    setCargando(true);
    const ahora = new Date().toISOString(); 
    
    try {
      const { error } = await supabase
        .from('ordenes_trabajo')
        .update({ hora_inicio: ahora, estado_tiempo: 'en_progreso' })
        .eq('id', ordenId);
      
      if (error) throw error;

      setHoraInicio(ahora);
      setEstado('en_progreso');
    } catch (error) {
      console.error("Error al iniciar:", error);
      alert("Hubo un error al iniciar el tiempo.");
    } finally {
      setCargando(false);
    }
  };

  const terminarTrabajo = async () => {
    setCargando(true);
    const ahora = new Date().toISOString();
    
    try {
      const { error } = await supabase
        .from('ordenes_trabajo')
        .update({ hora_fin: ahora, estado_tiempo: 'terminada' })
        .eq('id', ordenId);
      
      if (error) throw error;

      setHoraFin(ahora);
      setEstado('terminada');
    } catch (error) {
      console.error("Error al terminar:", error);
      alert("Hubo un error al detener el tiempo.");
    } finally {
      setCargando(false);
    }
  };

  const formatoHora = (isoString: string) => {
    const date = parseDateSafe(isoString);
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const duracion = calcularDuracion();
  
  const inicioValido = parseDateSafe(horaInicio);
  const finValido = parseDateSafe(horaFin);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
      
      <div className="text-center sm:text-left">
        <p className="text-sm text-slate-400 font-medium">Cronómetro de Labor</p>
        <p className="font-bold text-white text-lg">Tiempo de Ejecución</p>
        
        {inicioValido && (
          <p className="text-xs text-emerald-400 mt-1">
            ▶ Inició: {formatoHora(horaInicio)} 
            {finValido && <span className="text-rose-400 ml-2">■ Terminó: {formatoHora(horaFin)}</span>}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {(ordenCerrada || estado === 'terminada') ? (
          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-700 py-2 px-5 rounded-xl shadow-inner">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Tiempo Total</p>
              <p className={`font-black text-xl ${duracion ? 'text-emerald-400' : 'text-slate-500'}`}>
                {duracion || "Incompleto"}
              </p>
            </div>
            <svg className={`w-8 h-8 ${duracion ? 'text-emerald-500/50' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        ) : (
          <>
            {estado === 'pendiente' && (
              <button onClick={iniciarTrabajo} disabled={cargando} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50">
                {cargando ? 'Guardando...' : <>▶ Iniciar Trabajo</>}
              </button>
            )}

            {estado === 'en_progreso' && (
              <button onClick={terminarTrabajo} disabled={cargando} className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:opacity-50">
                {cargando ? 'Procesando...' : <>■ Terminar Trabajo</>}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}