export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string
          nombre: string
          rfc_o_tax_id: string | null
          direccion: string | null
          creado_at: string
        }
        Insert: {
          id?: string
          nombre: string
          rfc_o_tax_id?: string | null
          direccion?: string | null
          creado_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          rfc_o_tax_id?: string | null
          direccion?: string | null
          creado_at?: string
        }
      }
      sucursales: {
        Row: {
          id: string
          empresa_id: string
          nombre: string
          ubicacion: string | null
          creado_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          nombre: string
          ubicacion?: string | null
          creado_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          nombre?: string
          ubicacion?: string | null
          creado_at?: string
        }
      }
      areas: {
        Row: {
          id: string
          sucursal_id: string
          empresa_id: string
          nombre: string
          codigo_area: string | null
          creado_at: string
        }
        Insert: {
          id?: string
          sucursal_id: string
          empresa_id: string
          nombre: string
          codigo_area?: string | null
          creado_at?: string
        }
        Update: {
          id?: string
          sucursal_id?: string
          empresa_id?: string
          nombre?: string
          codigo_area?: string | null
          creado_at?: string
        }
      }
      equipos: {
        Row: {
          id: string
          empresa_id: string
          area_id: string
          nombre: string
          modelo: string | null
          marca: string | null
          numero_serie: string | null
          codigo_control: string | null
          criticidad: 'Alta' | 'Media' | 'Baja'
          estatus: 'Operativo' | 'Falla' | 'Mantenimiento' | 'Baja'
          creado_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          area_id: string
          nombre: string
          modelo?: string | null
          marca?: string | null
          numero_serie?: string | null
          codigo_control?: string | null
          criticidad?: 'Alta' | 'Media' | 'Baja'
          estatus?: 'Operativo' | 'Falla' | 'Mantenimiento' | 'Baja'
          creado_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          area_id?: string
          nombre?: string
          modelo?: string | null
          marca?: string | null
          numero_serie?: string | null
          codigo_control?: string | null
          criticidad?: 'Alta' | 'Media' | 'Baja'
          estatus?: 'Operativo' | 'Falla' | 'Mantenimiento' | 'Baja'
          creado_at?: string
        }
      }
      ordenes_trabajo: {
        Row: {
          id: string
          empresa_id: string
          equipo_id: string
          folio: number
          tipo_mantenimiento: 'Correctivo' | 'Preventivo' | 'Predictivo' | 'Mejora'
          prioridad: 'Crítica' | 'Alta' | 'Media' | 'Baja'
          estatus: 'Abierta' | 'En Progreso' | 'En Espera de Refacción' | 'Validación' | 'Cerrada'
          descripcion_falla: string
          acciones_tomadas: string | null
          fecha_programada: string | null
          fecha_cierre: string | null
          creado_at: string
        }
        Insert: {
          id?: string
          empresa_id: string
          equipo_id: string
          folio?: number
          tipo_mantenimiento: 'Correctivo' | 'Preventivo' | 'Predictivo' | 'Mejora'
          prioridad?: 'Crítica' | 'Alta' | 'Media' | 'Baja'
          estatus?: 'Abierta' | 'En Progreso' | 'En Espera de Refacción' | 'Validación' | 'Cerrada'
          descripcion_falla: string
          acciones_tomadas?: string | null
          fecha_programada?: string | null
          fecha_cierre?: string | null
          creado_at?: string
        }
        Update: {
          id?: string
          empresa_id?: string
          equipo_id?: string
          folio?: number
          tipo_mantenimiento?: 'Correctivo' | 'Preventivo' | 'Predictivo' | 'Mejora'
          prioridad?: 'Crítica' | 'Alta' | 'Media' | 'Baja'
          estatus?: 'Abierta' | 'En Progreso' | 'En Espera de Refacción' | 'Validación' | 'Cerrada'
          descripcion_falla?: string
          acciones_tomadas?: string | null
          fecha_programada?: string | null
          fecha_cierre?: string | null
          creado_at?: string
        }
      }
    }
  }
}