// Fuente única de verdad: qué rol puede entrar a qué módulo.
// Sidebar.tsx la usa para decidir qué links MOSTRAR.
// AuthGuard.tsx la usa para decidir si de verdad te deja ENTRAR,
// aunque escribas la URL directo en el navegador.
// Cambia los roles AQUÍ una sola vez y se refleja en los dos lugares
// — así nunca se vuelven a desincronizar entre sí.

export const RUTAS_POR_ROL: { ruta: string; roles: string[] }[] = [
  { ruta: '/', roles: ['admin', 'supervisor', 'gerente', 'directivo'] },
  { ruta: '/piso', roles: ['admin', 'supervisor', 'gerente', 'tecnico', 'directivo'] },
  { ruta: '/directivo', roles: ['admin', 'supervisor', 'gerente', 'directivo'] },
  { ruta: '/financial', roles: ['admin', 'supervisor', 'gerente', 'directivo'] },
  { ruta: '/projects/upcoming', roles: ['admin', 'supervisor', 'gerente', 'directivo'] },
  { ruta: '/ordenes', roles: ['admin', 'supervisor', 'gerente', 'tecnico', 'directivo'] },
  { ruta: '/planeacion', roles: ['admin', 'supervisor', 'gerente', 'directivo'] }, // 🆕 antes no tenía ninguna regla — cualquiera que le diera clic desde Work Orders entraba
  { ruta: '/gantt', roles: ['admin', 'supervisor', 'gerente', 'directivo'] },
  { ruta: '/inventario', roles: ['admin', 'supervisor', 'gerente', 'directivo'] },
  { ruta: '/kiosko', roles: ['admin', 'supervisor', 'gerente', 'tecnico', 'directivo', 'operador'] },
  { ruta: '/empleados', roles: ['admin', 'supervisor', 'gerente', 'directivo'] },
  { ruta: '/equipos', roles: ['admin', 'supervisor', 'gerente', 'tecnico', 'directivo'] },
  { ruta: '/reportes-globales', roles: ['admin', 'supervisor', 'gerente', 'directivo'] },
  { ruta: '/custom-report', roles: ['admin', 'supervisor', 'gerente', 'tecnico', 'directivo'] },
  { ruta: '/telemetria', roles: ['admin', 'supervisor', 'gerente', 'directivo'] },
]

export function rolesDe(ruta: string): string[] {
  // Coincidencia más específica primero (ej. '/financial/tracking-maintenance'
  // debe ganarle a '/financial' si ambas aplican) — mismo criterio que usa
  // rutaPermitidaParaRol(), para que nunca queden rutas "huérfanas" con
  // roles vacíos por no tener una entrada exacta.
  const reglasQueAplican = RUTAS_POR_ROL.filter(
    r => ruta === r.ruta || ruta.startsWith(r.ruta + '/')
  )
  if (reglasQueAplican.length === 0) return []
  return [...reglasQueAplican].sort((a, b) => b.ruta.length - a.ruta.length)[0].roles
}

// Rutas a las que CUALQUIER rol autenticado puede entrar — no son
// "módulos" con permisos propios, son utilitarias.
export const RUTAS_LIBRES = ['/login', '/perfil']

/**
 * ¿Puede este rol entrar a `pathname`? Usada por AuthGuard para
 * bloquear la navegación real, no solo esconder el link del menú.
 */
export function rutaPermitidaParaRol(pathname: string, rol: string | null | undefined): boolean {
  if (!rol) return true // rol aún no cargado: no bloqueamos para evitar falsos rebotes
  if (RUTAS_LIBRES.some(r => pathname === r || pathname.startsWith(r + '/'))) return true

  // Soporta subrutas: /equipos/[id], /financial/tracking-maintenance/[proyecto], etc.
  const reglasQueAplican = RUTAS_POR_ROL.filter(
    r => pathname === r.ruta || pathname.startsWith(r.ruta + '/')
  )
  if (reglasQueAplican.length === 0) return true // ruta sin regla definida todavía: no bloqueamos por default

  // La regla más específica gana (ruta más larga)
  const reglaMasEspecifica = [...reglasQueAplican].sort((a, b) => b.ruta.length - a.ruta.length)[0]
  return reglaMasEspecifica.roles.map(r => r.toLowerCase()).includes(rol.toLowerCase())
}

/** A dónde mandar a alguien que no tiene permiso para ver la ruta actual. */
export function rutaSeguraParaRol(rol: string | null | undefined): string {
  const r = (rol || '').toLowerCase()
  if (r === 'operador') return '/kiosko'
  if (r === 'tecnico') return '/ordenes'
  if (r === 'admin' || r === 'supervisor' || r === 'gerente' || r === 'directivo') return '/'
  return '/login'
}