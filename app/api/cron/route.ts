import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  // 1. Candado de seguridad para que solo Vercel pueda correr esto
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Acceso Denegado', { status: 401 });
  }

  try {
    // 2. Averiguar qué día es hoy automáticamente
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Al correr en Vercel (UTC), ajustamos a la zona horaria local de Sonora
    const fechaLocal = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Hermosillo"}));
    const diaEspanol = dias[fechaLocal.getDay()]; // Ej: 'Lunes'

    // 3. Buscar en la tabla plan_maestro las tareas que tocan hoy
    // Usamos .ilike para buscar la palabra (ej. "Lunes") dentro de la columna Tarea
    const { data: tareasDeHoy, error: errorLectura } = await supabase
      .from('plan_maestro')
      .select('*')
      .ilike('Tarea', `%${diaEspanol}%`); 

    if (errorLectura) throw errorLectura;

    if (!tareasDeHoy || tareasDeHoy.length === 0) {
      return NextResponse.json({ mensaje: `No hay preventivos programados para hoy ${diaEspanol}` });
    }

   // 4. Empaquetar las tareas en el formato que pide el Kanban
    const nuevasOrdenes = (tareasDeHoy as any[]).map((plan: any) => ({
      equipo_id: plan.equipo_id,
      descripcion: `[AUTO] ${plan.Tarea}`,
      tipo_mantenimiento: 'Preventivo',
      estatus: 'Abierta'
    }));

    // 5. Inyectar las órdenes al Kanban (Tabla ordenes_trabajo)
    const { error: errorInsert } = await supabase
      .from('ordenes_trabajo')
      .insert(nuevasOrdenes as any);
    if (errorInsert) throw errorInsert;

    return NextResponse.json({ 
      exito: true, 
      mensaje: `¡Listo! Se crearon ${nuevasOrdenes.length} órdenes para el ${diaEspanol}.` 
    });

  } catch (error: any) {
    console.error("Falla en el Cron Job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}