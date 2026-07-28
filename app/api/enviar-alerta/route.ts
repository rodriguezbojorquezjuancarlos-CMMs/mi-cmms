
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
export const dynamic = 'force-dynamic';
// Conectamos con tu llave de Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { equipoNombre, falla, prioridad, solicitante } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'CMMS Alertas <onboarding@resend.dev>', // Correo de prueba que te da Resend
      to: 'juancarlos0157@gmail.com', // <--- PON TU CORREO AQUÍ
      subject: `⚠️ ALERTA ${prioridad}: Falla en ${equipoNombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 600px;">
          <h2 style="color: #e11d48;">Nueva Falla Reportada en Piso</h2>
          <p>Se acaba de generar un nuevo ticket de mantenimiento correctivo.</p>
          <hr style="border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p><strong>Máquina/Equipo:</strong> ${equipoNombre}</p>
          <p><strong>Prioridad:</strong> <span style="color: ${prioridad === 'Alta' ? 'red' : 'orange'}; font-weight: bold;">${prioridad}</span></p>
          <p><strong>Reportó:</strong> ${solicitante}</p>
          <p><strong>Descripción del Problema:</strong></p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; border-left: 4px solid #e11d48;">
            ${falla}
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #64748b;">Este es un mensaje automático del sistema CMMS JBI.</p>
        </div>
      `
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: "Falla interna del servidor" }, { status: 500 });
  }
}