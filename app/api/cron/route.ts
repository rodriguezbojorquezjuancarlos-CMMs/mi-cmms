// @ts-nocheck
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Esta función se ejecutará automáticamente cuando se visite la URL del Cron
export async function GET() {
  try {
    // 1. Buscamos TODOS los planes de mantenimiento registrados
    const { data: planes, error: errorPlanes } = await supabase
      .from("plan_maestro")
      .select("*, equipos(id, empresa_id, nombre)")

    if (errorPlanes || !planes) {
      return NextResponse.json({ error: "No se pudieron leer los planes" }, { status: 500 })
    }

    let creadas = 0;

    // 2. Por cada plan maestro, generamos su Orden de Trabajo automática
    for (const plan of planes) {
      const empresaId = plan.equipos?.empresa_id;
      if (!empresaId) continue;

      // Creamos la OT
      const { data: nuevaOT, error: errorOT } = await supabase.from("ordenes_trabajo").insert([
        {
          empresa_id: empresaId,
          equipo_id: plan.equipo_id,
          tipo_mantenimiento: 'Preventivo',
          estatus: 'Abierta',
          prioridad: 'Media',
          descripcion_falla: `Rutina Automática: ${plan.Tarea}`,
          fecha_programada: new Date().toISOString(),
          solicitante: "Sistema Automático"
        }
      ] as any).select().single();

      if (nuevaOT) {
        creadas++;
        
        // 3. Le asignamos su checklist si existe una plantilla
        const { data: plantillas } = await supabase
          .from("plantillas_tareas")
          .select("*")
          .eq("equipo_id", plan.equipo_id);

        if (plantillas && plantillas.length > 0) {
          const tareasParaInsertar = plantillas.map(p => ({
            orden_id: nuevaOT.id,
            tarea: p.tarea
          }));
          await supabase.from("checklist_tareas").insert(tareasParaInsertar as any);
        }
      }
    }

    return NextResponse.json({ 
      mensaje: "Mantenimiento Preventivo generado con éxito", 
      ordenes_creadas: creadas 
    }, { status: 200 })

  } catch (error) {
    return NextResponse.json({ error: "Falla en el servidor" }, { status: 500 })
  }
}