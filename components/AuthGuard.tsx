"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

// Rutas a las que un operador SÍ puede entrar aunque escriba la URL a mano.
// Todo lo demás lo rebota al kiosko.
const RUTAS_PERMITIDAS_OPERADOR = ['/kiosko', '/login', '/perfil']

function operadorPuedeVer(pathname: string) {
  return RUTAS_PERMITIDAS_OPERADOR.some(
    (ruta) => pathname === ruta || pathname.startsWith(ruta + '/')
  )
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    setIsAuthorized(false)

    const checkSession = async () => {
      // Leemos si el navegador tiene una sesión activa de Supabase
      const { data: { session } } = await supabase.auth.getSession()

      if (!session && pathname !== '/login') {
        // Si no hay sesión y no está en la página de login, lo rebotamos
        router.replace('/login')
        return
      }

      if (session) {
        // Revisamos el rol en 'perfiles'. Si es 'operador' y está tratando
        // de entrar a algo fuera del kiosko, lo mandamos para allá antes
        // de mostrar nada de la página que intentó abrir.
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id)
          .single()

        const rol = (perfil as any)?.rol?.toLowerCase()

        if (rol === 'operador' && !operadorPuedeVer(pathname)) {
          router.replace('/kiosko')
          return
        }
      }

      // Si todo está en orden, lo dejamos pasar
      setIsAuthorized(true)
    }

    checkSession()

    // Este listener está atento por si el usuario le da a "Cerrar sesión" para sacarlo inmediatamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  // Pantalla de carga temporal para que no haya "parpadeo" del dashboard antes de rebotarlo
  if (!isAuthorized && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-emerald-500 font-bold animate-pulse text-xl">
          Verificando credenciales corporativas...
        </div>
      </div>
    )
  }

  // Si pasa todas las validaciones, mostramos el contenido real
  return <>{children}</>
}