// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { mensaje } = await req.json();

    // 1. Prompt estricto
    const prompt = `
      Eres KINETIX AI, el asistente virtual de un sistema CMMS.
      El usuario te va a reportar un problema de mantenimiento.
      Tu trabajo es leer su reporte y extraer el equipo y la falla.
      
      IMPORTANTE: Devuelve SOLO un objeto JSON válido, sin texto extra, sin formato markdown, sin usar \`\`\`json.
      Formato exacto:
      {
        "equipo": "Nombre de la máquina o null si no se entiende",
        "falla": "Resumen claro del problema reportado"
      }
      
      Mensaje del usuario: "${mensaje}"
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Falta la GEMINI_API_KEY en tu archivo .env.local");
    }

    // 🟢 INTENTO A PRUEBA DE FALLOS: Usando "gemini-1.5-flash-latest"
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        throw new Error(`Google API: ${errorText}`);
    }

    const geminiData = await geminiRes.json();
    let iaText = geminiData.candidates[0].content.parts[0].text;
    
    iaText = iaText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let infoProcesada;
    try {
      infoProcesada = JSON.parse(iaText);
    } catch (e) {
      throw new Error(`La IA no devolvió un JSON válido. Texto: ${iaText}`);
    }

    // 3. Buscar la máquina usando .maybeSingle()
    let equipoId = null;
    let nombreEquipoFinal = infoProcesada.equipo;

    if (infoProcesada.equipo && infoProcesada.equipo !== "null") {
      const { data: equipoEncontrado } = await supabase
        .from('equipos')
        .select('id, nombre')
        .ilike('nombre', `%${infoProcesada.equipo}%`)
        .limit(1)
        .maybeSingle();
        
      if (equipoEncontrado) {
        equipoId = equipoEncontrado.id;
        nombreEquipoFinal = equipoEncontrado.nombre;
      }
    }

    const { data: empresa } = await supabase.from("empresas").select("id").limit(1).maybeSingle();

    // 4. Crear la Orden
    const nuevaOrden = {
      equipo_id: equipoId, 
      empresa_id: empresa?.id,
      descripcion_falla: infoProcesada.falla || mensaje,
      tipo_mantenimiento: 'Correctivo',
      estatus: 'Abierta', 
      creado_at: new Date().toISOString()
    };

    const { error: errorInsert } = await supabase.from('ordenes_trabajo').insert([nuevaOrden]);
    
    // 🟢 Si Supabase falla, que nos diga por qué
    if (errorInsert) throw new Error(`Error de Base de Datos: ${errorInsert.message}`);

    // 5. Responder
    if (equipoId) {
      return NextResponse.json({ 
        respuesta: `✅ Entendido. He generado una Orden Correctiva para **${nombreEquipoFinal}**. La falla reportada es: "${infoProcesada.falla}". Ya está en el Kanban.` 
      });
    } else {
      return NextResponse.json({ 
        respuesta: `⚠️ Registré el reporte como una orden general de planta, ya que no detecté el nombre exacto del equipo en tu mensaje. El Kanban ha sido actualizado.` 
      });
    }

  } catch (error: any) {
    // 🟢 AHORA MANDAMOS EL ERROR REAL A LA BURBUJA PARA LEERLO DIRECTO AHÍ
    return NextResponse.json({ respuesta: `❌ ERROR TÉCNICO: ${error.message}` });
  }
}