import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Sidebar from "@/components/Sidebar"
import NotificadorGlobal from "@/components/NotificadorGlobal"
import AuthGuard from "@/components/AuthGuard"
import "./globals.css"

// Cargamos la fuente moderna
const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kinetix Pro",
  description: "Corporate Maintenance Management System",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#070B14] text-slate-200 antialiased selection:bg-emerald-500/30 selection:text-emerald-200`}>
        
        <AuthGuard>
          
          {/* 1. RESTAURAMOS EL FLEX AQUÍ PARA QUE ESTÉN LADO A LADO */}
          <div className="flex min-h-screen">
            
            <Sidebar />
            
            {/* 2. CONTENIDO PRINCIPAL 
                - flex-1: Toma el resto del espacio disponible al lado del Sidebar.
                - min-w-0: EL TRUCO MÁGICO. Evita que las tablas fuercen a la pantalla a estirarse, 
                           activando el scroll horizontal perfecto en móviles.
            */}
            <main className="flex-1 min-w-0 flex flex-col transition-all duration-300">
              
              {/* 
                3. w-full y max-w-[1920px]: Usa todo el espacio que le da flex-1,
                con un límite súper amplio para que los monitores gigantes luzcan el SCADA.
              */}
              <div className="p-4 pt-20 md:p-8 md:pt-8 w-full max-w-[1920px] mx-auto overflow-x-hidden flex-1">
                {children}
              </div>

            </main>
          </div>

          <NotificadorGlobal />
        </AuthGuard>
        
      </body>
    </html>
  )
}