// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { lecTocaEnFecha } from '@/lib/recurrencia';

export async function GET(request: Request) {
  // 1. Candado de seguridad (Solo bloquea si está en Vercel Producción, permite testeo en Localhost)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Acceso Denegado', { status: 401 });
  }

  try {
    // 2. Fecha de hoy, ajustada a la zona horaria de Sonora
    const fechaLocal = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Hermosillo" }));

    // 3. Traemos TODOS los planes maestros y calculamos en código quién
    //    le toca hoy — usando Fecha_inicio + Frecuencia, NO solo el día
    //    de la semana. Antes esto disparaba TODOS los planes cuyo día
    //    de la semana coincidiera con hoy, sin importar si eran
    //    semanales, trimestrales o anuales — por eso un plan "Annual"
    //    se estaba generando cada semana.
    const { data: todosLosPlanes, error: errorLectura } = await supabaseAdmin
      .from('plan_maestro')
      .select('*');

    if (errorLectura) throw errorLectura;

    const planesQueTocanHoy = (todosLosPlanes || []).filter((plan: any) =>
      lecTocaEnFecha(plan.Fecha_inicio, plan.Frecuencia, fechaLocal)
    );

    if (planesQueTocanHoy.length === 0) {
      return NextResponse.json({ mensaje: `No preventive tasks due today (${fechaLocal.toDateString()}).` });
    }

    const { data: empresaFallback } = await supabaseAdmin.from("empresas").select("id").limit(1).single();
    const empresaIdValido = empresaFallback?.id;

    const nuevasOrdenes = planesQueTocanHoy.map((plan: any) => {
      const fechaMadrugada = new Date();
      fechaMadrugada.setHours(3, 0, 0, 0);

      return {
        equipo_id: plan.equipo_id,
        empresa_id: empresaIdValido,
        descripcion_falla: `[AUTO-GENERATED] Maintenance per plan: ${plan.Tarea}`,
        tipo_mantenimiento: 'Preventivo',
        estatus: 'Abierta',
        creado_at: fechaMadrugada.toISOString()
      };
    });

    const { error: errorInsert } = await supabaseAdmin
      .from('ordenes_trabajo')
      .insert(nuevasOrdenes);

    if (errorInsert) throw errorInsert;

    return NextResponse.json({
      exito: true,
      mensaje: `¡Misión Cumplida! Se generaron ${nuevasOrdenes.length} órdenes automáticas para el ${fechaLocal.toDateString()}, según la frecuencia real de cada plan.`
    });

  } catch (error: any) {
    console.error("Falla en el Cron Job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}