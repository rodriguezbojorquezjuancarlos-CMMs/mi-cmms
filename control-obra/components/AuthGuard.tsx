"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      // Leemos si el navegador tiene una sesión activa de Supabase
      const { data: { session } } = await supabase.auth.getSession()

      if (!session && pathname !== '/login') {
        // Si no hay sesión y no está en la página de login, lo rebotamos
        router.replace('/login')
      } else {
        // Si todo está en orden, lo dejamos pasar
        setIsAuthorized(true)
      }
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