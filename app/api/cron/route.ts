// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  // 1. Candado de seguridad (Solo bloquea si está en Vercel Producción, permite testeo en Localhost)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Acceso Denegado', { status: 401 });
  }

  try {
    // 2. Averiguar qué día es hoy automáticamente en INGLÉS
    const dias = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Al correr en Vercel (UTC), ajustamos exactamente a la zona horaria de Sonora
    const fechaLocal = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Hermosillo"}));
    const diaIngles = dias[fechaLocal.getDay()]; // Ej: 'Tuesday'

    // 3. Buscar en la tabla plan_maestro buscando en la columna correcta (dia_semana)
    const { data: tareasDeHoy, error: errorLectura } = await supabase
      .from('plan_maestro')
      .select('*')
      .eq('dia_semana', diaIngles); 

    if (errorLectura) throw errorLectura;

    if (!tareasDeHoy || tareasDeHoy.length === 0) {
      return NextResponse.json({ mensaje: `No preventive tasks scheduled for today (${diaIngles}).` });
    }

    // Buscamos la empresa para no tener errores de guardado
    const { data: empresaFallback } = await supabase.from("empresas").select("id").limit(1).single();
    const empresaIdValido = empresaFallback?.id;

    // 4. Empaquetar las tareas
    const nuevasOrdenes = tareasDeHoy.map((plan: any) => {
       const fechaMadrugada = new Date();
       fechaMadrugada.setHours(3, 0, 0, 0);

       return {
         equipo_id: plan.equipo_id,
         empresa_id: empresaIdValido,
         descripcion_falla: `[AUTO-GENERATED] Maintenance per plan: ${plan.Tarea}`,
         tipo_mantenimiento: 'Preventivo',
         estatus: 'Abierta', // 🟢 REGRESAMOS A 'Abierta' PARA PASAR EL CANDADO DE SUPABASE
         creado_at: fechaMadrugada.toISOString()
       };
    });

    // 5. Inyectar las órdenes al Kanban (Tabla ordenes_trabajo)
    const { error: errorInsert } = await supabase
      .from('ordenes_trabajo')
      .insert(nuevasOrdenes);
      
    if (errorInsert) throw errorInsert;

    return NextResponse.json({ 
      exito: true, 
      mensaje: `¡Misión Cumplida! El robot nocturno creó ${nuevasOrdenes.length} órdenes automáticas para el ${diaIngles}.` 
    });

  } catch (error: any) {
    console.error("Falla en el Cron Job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}