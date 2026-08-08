"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from "@/lib/supabase"
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const [menuAbierto, setMenuAbierto] = useState(false); 
  const [colapsado, setColapsado] = useState(false); 
  
  // Estados para la Despedida
  const [mostrandoDespedida, setMostrandoDespedida] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("Juan Carlos");
  
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 🔴 SEGURO ANTI-BUGS: Si cambias de página, apagamos la despedida
    setMostrandoDespedida(false);

    async function obtenerUsuario() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.user_metadata?.full_name) {
        setNombreUsuario(user.user_metadata.full_name.split(' ')[0]);
      }
    }
    obtenerUsuario();
  }, [pathname]); // <-- Al detectar cambio de ruta, se resetea

  if (pathname === '/login') {
    return null;
  }

  // LÓGICA DE CIERRE DE SESIÓN CON PANTALLA DE DESPEDIDA
  const cerrarSesion = async () => {
    setMostrandoDespedida(true); // Levanta el telón oscuro
    sessionStorage.removeItem('saludoKinetix'); // Limpiamos caché
    
    // Esperamos 2.5 segundos para que lea el mensaje, cerramos sesión y mandamos al login
    setTimeout(async () => {
      await supabase.auth.signOut();
      setMostrandoDespedida(false); 
      router.replace("/login");
    }, 2500);
  };

  // 🌍 MENÚ TRADUCIDO AL INGLÉS (Las rutas internas '/ruta' se quedan igual para no romper los links)
// 🌍 MENÚ TRADUCIDO AL INGLÉS (Las rutas internas '/ruta' se quedan igual para no romper los links)
  const navLinks = [
    { nombre: 'Command Center', ruta: '/', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { nombre: 'Kanban Board (Floor)', ruta: '/piso', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /> },
    { nombre: 'Executive Dashboard', ruta: '/directivo', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    { nombre: 'Work Orders', ruta: '/ordenes', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /> },
    { nombre: 'Gantt Schedule', ruta: '/gantt', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    { nombre: 'Inventory (Spares)', ruta: '/inventario', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
    { nombre: 'Equipment & Assets', ruta: '/equipos', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /> },
    
    // NUEVO BOTÓN DE TELEMETRÍA
    // NUEVO BOTÓN DE TELEMETRÍA (Directo al Hub general)
    { nombre: 'Live Telemetry', ruta: '/telemetria', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12h-4l-3 9L9 3l-3 9H3" /> },
  ];

  return (
    <>
      {/* PANTALLA COMPLETA DE DESPEDIDA - TRADUCIDA */}
      {mostrandoDespedida && (
        <div className="fixed inset-0 z-[9999] bg-[#070B14] flex flex-col items-center justify-center animate-in fade-in duration-500">
           {/* LOGO KINETIX GRIS PARA DESPEDIDA */}
           <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(30,41,59,0.5)] mb-6">
              <svg className="w-12 h-12 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l2-8z" />
              </svg>
           </div>
           <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Session securely closed</h1>
           <p className="text-slate-400 font-medium tracking-wide">Thank you for using KINETIX Pro, {nombreUsuario}.</p>
           
           <div className="mt-8 flex gap-2">
             <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
             <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
             <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
           </div>
        </div>
      )}

      {/* Botón hamburguesa - CELULARES */}
      <button
        className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-[#0B1121] text-white rounded-md shadow-lg border border-slate-700"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        {menuAbierto ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        )}
      </button>

      {menuAbierto && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setMenuAbierto(false)} />
      )}

      {/* BARRA LATERAL PRINCIPAL */}
      <aside className={`
        fixed top-0 left-0 h-screen bg-[#0B1121] border-r border-slate-800 flex flex-col z-50
        transition-all duration-300 ease-in-out whitespace-nowrap shadow-2xl
        ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:sticky md:top-0
        ${colapsado ? 'w-20' : 'w-72'}
      `}>
         
         <button 
           onClick={() => setColapsado(!colapsado)}
           className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-emerald-500 rounded-full items-center justify-center text-slate-900 border-4 border-[#070B14] hover:bg-emerald-400 transition-colors z-50 shadow-lg"
           title={colapsado ? "Expand menu" : "Collapse menu"}
         >
           <svg className={`w-3 h-3 transition-transform duration-300 ${colapsado ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
             <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
           </svg>
         </button>

         <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 mt-14 md:mt-0 custom-scrollbar">
             
             {/* LOGO KINETIX ORIGINAL */}
             <div className={`flex items-center mb-10 mt-2 transition-all duration-300 ${colapsado ? 'justify-center' : 'pl-2 gap-3'}`}>
                <div className="w-10 h-10 min-w-[40px] rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                  {/* EL RAYO EXACTO */}
                  <svg className="w-6 h-6 text-[#0B1121]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l2-8z" />
                  </svg>
                </div>
                {!colapsado && (
                  <h2 className="text-2xl font-black tracking-tight text-white animate-in fade-in duration-300">
                    KINETIX <span className="text-emerald-500 font-medium">Pro</span>
                  </h2>
                )}
             </div>

             <ul className="space-y-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.ruta;
                  return (
                    <li key={link.nombre} title={colapsado ? link.nombre : ""}>
                      <Link 
                        href={link.ruta} 
                        onClick={() => setMenuAbierto(false)} 
                        className={`flex items-center rounded-xl transition-all duration-200 border group ${
                          colapsado ? 'justify-center p-3' : 'gap-4 p-3.5'
                        } ${
                          isActive 
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]' 
                            : 'border-transparent hover:bg-slate-800/50'
                        }`}
                      >
                        <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          {link.icon}
                        </svg>
                        
                        {!colapsado && (
                          <span className={`font-semibold text-sm transition-colors animate-in fade-in ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {link.nombre}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
             </ul>
         </div>

         {/* PERFIL DE USUARIO Y BOTÓN DE SALIDA */}
         <div className="p-4 border-t border-slate-800/80 bg-slate-900/20">
            <div className={`flex items-center rounded-xl transition-all ${colapsado ? 'justify-center' : 'justify-between hover:bg-slate-800/50 p-2 cursor-pointer'}`}>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 min-w-[40px] rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-sm tracking-widest shadow-lg uppercase">
                    {nombreUsuario.substring(0, 2)}
                  </div>
                  {!colapsado && (
                    <div className="animate-in fade-in">
                      <p className="text-sm font-bold text-white">{nombreUsuario}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Online</span>
                      </div>
                    </div>
                  )}
               </div>
               
               <button 
                 onClick={cerrarSesion}
                 title="Sign Out" 
                 className={`${colapsado ? 'hidden' : 'flex'} p-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-colors group`}
               >
                 <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
               </button>
            </div>
            
            {colapsado && (
              <button 
                onClick={cerrarSesion}
                title="Sign Out" 
                className="mt-4 w-full flex justify-center p-3 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
              >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
              </button>
            )}
         </div>

      </aside>
    </>
  )
}