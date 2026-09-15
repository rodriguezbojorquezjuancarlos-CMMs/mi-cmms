// Lógica central de recurrencia para el Planeador de Mantenimientos
// Preventivos. Un solo lugar que decide "¿le toca a este plan en tal
// fecha?" — así el Cron (que genera las órdenes reales) y el Gantt
// (que las dibuja) siempre están de acuerdo entre sí.
//
// Cada plan tiene su propia Fecha_inicio (ancla). Eso es justo lo que
// permite balancear la carga: si dos máquinas son "Quarterly" pero
// arrancaron en fechas distintas, sus mantenimientos caen en semanas
// distintas — no todas el mismo día.

const INTERVALO_DIAS: Record<string, number> = {
  'Weekly': 7,
  'Bi-weekly': 14,
}

const INTERVALO_MESES: Record<string, number> = {
  'Monthly': 1,
  'Quarterly': 3,
  'Biannual': 6,
  'Annual': 12,
}

export const FRECUENCIAS = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Biannual', 'Annual']

function soloFecha(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function diffDias(a: Date, b: Date): number {
  return Math.round((soloFecha(b).getTime() - soloFecha(a).getTime()) / 86400000)
}

function parseFechaLocal(fechaStr: string): Date {
  // 'YYYY-MM-DD' interpretado en hora local, NO en UTC (evita el
  // clásico bug de que una fecha se "recorra" un día por la zona horaria).
  const [y, m, d] = fechaStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/**
 * ¿Le toca a este plan ejecutarse exactamente en `fecha`, dado que
 * arrancó en `fechaInicioStr`? Nunca antes de la fecha de inicio.
 */
export function lecTocaEnFecha(fechaInicioStr: string | null | undefined, frecuencia: string, fecha: Date): boolean {
  if (!fechaInicioStr) return false
  const inicio = soloFecha(parseFechaLocal(fechaInicioStr))
  const objetivo = soloFecha(fecha)
  if (objetivo < inicio) return false

  if (INTERVALO_DIAS[frecuencia]) {
    return diffDias(inicio, objetivo) % INTERVALO_DIAS[frecuencia] === 0
  }

  const meses = INTERVALO_MESES[frecuencia] || 1

  if (objetivo.getDate() !== inicio.getDate()) {
    // Meses cortos: si el plan arrancó el día 31 y el mes actual no
    // tiene día 31, lo tratamos como el último día de ese mes.
    const ultimoDiaMesObjetivo = new Date(objetivo.getFullYear(), objetivo.getMonth() + 1, 0).getDate()
    const esUltimoDiaValido = inicio.getDate() > ultimoDiaMesObjetivo && objetivo.getDate() === ultimoDiaMesObjetivo
    if (!esUltimoDiaValido) return false
  }

  const mesesTranscurridos = (objetivo.getFullYear() - inicio.getFullYear()) * 12 + (objetivo.getMonth() - inicio.getMonth())
  return mesesTranscurridos >= 0 && mesesTranscurridos % meses === 0
}

/** Próxima fecha (>= `desde`) en que le toca a este plan. Para mostrar "Next Due". */
export function proximaFecha(fechaInicioStr: string | null | undefined, frecuencia: string, desde: Date = new Date()): Date | null {
  if (!fechaInicioStr) return null
  let cursor = soloFecha(parseFechaLocal(fechaInicioStr))
  const limite = soloFecha(desde)
  let guard = 0
  while (cursor < limite && guard < 3000) {
    if (INTERVALO_DIAS[frecuencia]) {
      cursor = new Date(cursor.getTime() + INTERVALO_DIAS[frecuencia] * 86400000)
    } else {
      const meses = INTERVALO_MESES[frecuencia] || 1
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + meses, cursor.getDate())
    }
    guard++
  }
  return cursor
}

/**
 * Cuenta cuántos de `planesExistentes` también caerían en `fecha`.
 * Esto es lo que alimenta la advertencia de "carga de trabajo" en el
 * formulario de Planeación.
 */
export function contarColisionesEnFecha(
  planesExistentes: { Fecha_inicio: string | null; Frecuencia: string }[],
  fecha: Date
): number {
  return planesExistentes.filter(p => lecTocaEnFecha(p.Fecha_inicio, p.Frecuencia, fecha)).length
}