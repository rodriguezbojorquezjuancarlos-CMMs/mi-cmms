import { createClient } from '@supabase/supabase-js'

// ⚠️ SOLO PARA USO DEL LADO DEL SERVIDOR (Route Handlers en app/api/*).
// NUNCA importes este archivo desde un componente "use client" ni
// expongas SUPABASE_SERVICE_ROLE_KEY con el prefijo NEXT_PUBLIC_ —
// esta llave se salta TODAS las políticas de RLS por diseño.
//
// Se usa aquí porque /api/ia y /api/cron son procesos de confianza
// del propio sistema (el bot de IA y el cron de mantenimientos
// preventivos), no peticiones de un usuario navegando — no tienen
// una sesión de navegador que RLS pueda verificar.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!serviceRoleKey) {
  console.error('⚠️ Falta SUPABASE_SERVICE_ROLE_KEY en tus variables de entorno.')
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
})