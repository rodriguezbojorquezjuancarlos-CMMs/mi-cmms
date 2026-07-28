"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function NotificadorGlobal() {
  const [alerta, setAlerta] = useState<{ area: string, falla: string, solicitante: string } | null>(null)

  useEffect(() => {
    // Escuchamos a la base de datos en tiempo real
    const canal = supabase.channel('alertas_globales')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'ordenes_trabajo' }, 
        (payload) => {
          const nuevaOT = payload.new;
          
          // Filtramos solo Correctivos o prioridad Alta
          if (nuevaOT.tipo_mantenimiento === 'Correctivo' || nuevaOT.prioridad === 'Alta') {
            setAlerta({
              area: nuevaOT.area_destino,
              falla: nuevaOT.descripcion_falla,
              solicitante: nuevaOT.solicitante
            });
            
            // La notificación desaparece sola después de 10 segundos
            setTimeout(() => setAlerta(null), 10000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(canal); }
  }, [])

  // Si no hay alerta, el componente es invisible
  if (!alerta) return null;

  return (
    <div className="fixed top-8 right-8 z-50 animate-in slide-in-from-right-10 fade-in duration-500">
      <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] p-5 rounded-2xl max-w-sm flex gap-4 items-start relative">
        
        {/* Ícono de alerta */}
        <div className="bg-emerald-500/20 p-3 rounded-full flex-shrink-0">
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Contenido */}
        <div>
          <h3 className="font-bold text-emerald-400 text-lg mb-1 tracking-wide">
            Nueva Alerta: {alerta.area}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            {alerta.falla}
          </p>
          <div className="mt-3 inline-block bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            <p className="text-xs text-slate-400">
              Reportado por: <span className="text-slate-200 font-bold">{alerta.solicitante}</span>
            </p>
          </div>
        </div>

        {/* Botón de cerrar manual */}
        <button 
          onClick={() => setAlerta(null)} 
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}