// Tipos generados para Supabase
// Este archivo describe la estructura de la base de datos

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            sportex_usuarios: {
                Row: {
                    id: string
                    email: string
                    nombre_empresa: string | null
                    telefono: string | null
                    logo_url: string | null
                    configuracion: Json
                    creado_en: string
                    actualizado_en: string
                }
                Insert: {
                    id: string
                    email: string
                    nombre_empresa?: string | null
                    telefono?: string | null
                    logo_url?: string | null
                    configuracion?: Json
                    creado_en?: string
                    actualizado_en?: string
                }
                Update: {
                    id?: string
                    email?: string
                    nombre_empresa?: string | null
                    telefono?: string | null
                    logo_url?: string | null
                    configuracion?: Json
                    creado_en?: string
                    actualizado_en?: string
                }
            }
            sportex_etapas_leads: {
                Row: {
                    id: string
                    usuario_id: string
                    nombre: string
                    color: string
                    orden: number
                    activo: boolean
                    creado_en: string
                }
                Insert: {
                    id?: string
                    usuario_id: string
                    nombre: string
                    color?: string
                    orden?: number
                    activo?: boolean
                    creado_en?: string
                }
                Update: {
                    id?: string
                    usuario_id?: string
                    nombre?: string
                    color?: string
                    orden?: number
                    activo?: boolean
                    creado_en?: string
                }
            }
            sportex_etapas_pedidos: {
                Row: {
                    id: string
                    usuario_id: string
                    nombre: string
                    color: string
                    orden: number
                    activo: boolean
                    creado_en: string
                }
                Insert: {
                    id?: string
                    usuario_id: string
                    nombre: string
                    color?: string
                    orden?: number
                    activo?: boolean
                    creado_en?: string
                }
                Update: {
                    id?: string
                    usuario_id?: string
                    nombre?: string
                    color?: string
                    orden?: number
                    activo?: boolean
                    creado_en?: string
                }
            }
            sportex_clientes: {
                Row: {
                    id: string
                    usuario_id: string
                    nombre: string
                    nombre_club: string | null
                    email: string | null
                    telefono: string | null
                    direccion: string | null
                    notas: string | null
                    creado_en: string
                    actualizado_en: string
                }
                Insert: {
                    id?: string
                    usuario_id: string
                    nombre: string
                    nombre_club?: string | null
                    email?: string | null
                    telefono?: string | null
                    direccion?: string | null
                    notas?: string | null
                    creado_en?: string
                    actualizado_en?: string
                }
                Update: {
                    id?: string
                    usuario_id?: string
                    nombre?: string
                    nombre_club?: string | null
                    email?: string | null
                    telefono?: string | null
                    direccion?: string | null
                    notas?: string | null
                    creado_en?: string
                    actualizado_en?: string
                }
            }
            sportex_leads: {
                Row: {
                    id: string
                    usuario_id: string
                    etapa_id: string | null
                    nombre: string
                    nombre_club: string | null
                    email: string | null
                    telefono: string | null
                    valor_estimado: number
                    notas: string | null
                    orden_en_etapa: number
                    creado_en: string
                    actualizado_en: string
                }
                Insert: {
                    id?: string
                    usuario_id: string
                    etapa_id?: string | null
                    nombre: string
                    nombre_club?: string | null
                    email?: string | null
                    telefono?: string | null
                    valor_estimado?: number
                    notas?: string | null
                    orden_en_etapa?: number
                    creado_en?: string
                    actualizado_en?: string
                }
                Update: {
                    id?: string
                    usuario_id?: string
                    etapa_id?: string | null
                    nombre?: string
                    nombre_club?: string | null
                    email?: string | null
                    telefono?: string | null
                    valor_estimado?: number
                    notas?: string | null
                    orden_en_etapa?: number
                    creado_en?: string
                    actualizado_en?: string
                }
            }
            sportex_leads_historial: {
                Row: {
                    id: string
                    lead_id: string
                    etapa_anterior_id: string | null
                    etapa_nueva_id: string | null
                    cambiado_en: string
                }
                Insert: {
                    id?: string
                    lead_id: string
                    etapa_anterior_id?: string | null
                    etapa_nueva_id?: string | null
                    cambiado_en?: string
                }
                Update: {
                    id?: string
                    lead_id?: string
                    etapa_anterior_id?: string | null
                    etapa_nueva_id?: string | null
                    cambiado_en?: string
                }
            }
            sportex_pedidos: {
                Row: {
                    id: string
                    usuario_id: string
                    cliente_id: string | null
                    etapa_id: string | null
                    numero_pedido: string
                    fecha_pedido: string
                    fecha_entrega: string | null
                    precio_total: number
                    costo_total: number
                    boceto_url: string | null
                    talles: Json
                    notas: string | null
                    orden_en_etapa: number
                    creado_en: string
                    actualizado_en: string
                }
                Insert: {
                    id?: string
                    usuario_id: string
                    cliente_id?: string | null
                    etapa_id?: string | null
                    numero_pedido: string
                    fecha_pedido?: string
                    fecha_entrega?: string | null
                    precio_total?: number
                    costo_total?: number
                    boceto_url?: string | null
                    talles?: Json
                    notas?: string | null
                    orden_en_etapa?: number
                    creado_en?: string
                    actualizado_en?: string
                }
                Update: {
                    id?: string
                    usuario_id?: string
                    cliente_id?: string | null
                    etapa_id?: string | null
                    numero_pedido?: string
                    fecha_pedido?: string
                    fecha_entrega?: string | null
                    precio_total?: number
                    costo_total?: number
                    boceto_url?: string | null
                    talles?: Json
                    notas?: string | null
                    orden_en_etapa?: number
                    creado_en?: string
                    actualizado_en?: string
                }
            }
            sportex_pedidos_items: {
                Row: {
                    id: string
                    pedido_id: string
                    tipo_producto: string
                    descripcion: string | null
                    cantidad: number
                    precio_unitario: number
                    costo_unitario: number
                    talles: Json
                    creado_en: string
                }
                Insert: {
                    id?: string
                    pedido_id: string
                    tipo_producto: string
                    descripcion?: string | null
                    cantidad?: number
                    precio_unitario?: number
                    costo_unitario?: number
                    talles?: Json
                    creado_en?: string
                }
                Update: {
                    id?: string
                    pedido_id?: string
                    tipo_producto?: string
                    descripcion?: string | null
                    cantidad?: number
                    precio_unitario?: number
                    costo_unitario?: number
                    talles?: Json
                    creado_en?: string
                }
            }
            sportex_pedidos_historial: {
                Row: {
                    id: string
                    pedido_id: string
                    etapa_anterior_id: string | null
                    etapa_nueva_id: string | null
                    cambiado_en: string
                }
                Insert: {
                    id?: string
                    pedido_id: string
                    etapa_anterior_id?: string | null
                    etapa_nueva_id?: string | null
                    cambiado_en?: string
                }
                Update: {
                    id?: string
                    pedido_id?: string
                    etapa_anterior_id?: string | null
                    etapa_nueva_id?: string | null
                    cambiado_en?: string
                }
            }
            sportex_transacciones: {
                Row: {
                    id: string
                    usuario_id: string
                    pedido_id: string | null
                    tipo: 'ingreso' | 'egreso'
                    monto: number
                    categoria: string | null
                    descripcion: string | null
                    fecha_transaccion: string
                    creado_en: string
                }
                Insert: {
                    id?: string
                    usuario_id: string
                    pedido_id?: string | null
                    tipo: 'ingreso' | 'egreso'
                    monto: number
                    categoria?: string | null
                    descripcion?: string | null
                    fecha_transaccion?: string
                    creado_en?: string
                }
                Update: {
                    id?: string
                    usuario_id?: string
                    pedido_id?: string | null
                    tipo?: 'ingreso' | 'egreso'
                    monto?: number
                    categoria?: string | null
                    descripcion?: string | null
                    fecha_transaccion?: string
                    creado_en?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}

// Tipos de ayuda para uso más fácil
export type Usuario = Database['public']['Tables']['sportex_usuarios']['Row']
export type EtapaLead = Database['public']['Tables']['sportex_etapas_leads']['Row']
export type EtapaPedido = Database['public']['Tables']['sportex_etapas_pedidos']['Row']
export type Cliente = Database['public']['Tables']['sportex_clientes']['Row']
export type Lead = Database['public']['Tables']['sportex_leads']['Row']
export type LeadHistorial = Database['public']['Tables']['sportex_leads_historial']['Row']
export type Pedido = Database['public']['Tables']['sportex_pedidos']['Row']
export type PedidoItem = Database['public']['Tables']['sportex_pedidos_items']['Row']
export type PedidoHistorial = Database['public']['Tables']['sportex_pedidos_historial']['Row']
export type Transaccion = Database['public']['Tables']['sportex_transacciones']['Row']

// Tipos para insertar
export type NuevoCliente = Database['public']['Tables']['sportex_clientes']['Insert']
export type NuevoLead = Database['public']['Tables']['sportex_leads']['Insert']
export type NuevoPedido = Database['public']['Tables']['sportex_pedidos']['Insert']
export type NuevoItem = Database['public']['Tables']['sportex_pedidos_items']['Insert']
export type NuevaTransaccion = Database['public']['Tables']['sportex_transacciones']['Insert']

// Tipos extendidos con relaciones
export type LeadConEtapa = Lead & {
    etapa?: EtapaLead | null
}

export type PedidoConRelaciones = Pedido & {
    cliente?: Cliente | null
    etapa?: EtapaPedido | null
    items?: PedidoItem[]
}

// Tipo para talles
export interface TalleItem {
    talle: string
    cantidad: number
}
