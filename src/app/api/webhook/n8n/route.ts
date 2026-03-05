import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Endpoint para n8n - Crear/Actualizar datos desde WhatsApp
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action, data } = body

        const supabase = await createClient()

        // Verificar autenticación via API key (opcional, configurar en n8n)
        const apiKey = request.headers.get('x-api-key')
        // TODO: Validar apiKey si se requiere

        switch (action) {
            case 'create_lead': {
                const { error } = await supabase.from('sportex_leads').insert({
                    nombre: data.nombre,
                    nombre_club: data.nombre_club,
                    telefono: data.telefono,
                    email: data.email,
                    notas: data.notas,
                    valor_estimado: data.valor_estimado || 0,
                    usuario_id: data.usuario_id, // ID del usuario dueño
                } as any)

                if (error) throw error
                return NextResponse.json({ success: true, message: 'Lead creado' })
            }

            case 'update_order': {
                const { error } = await supabase
                    .from('sportex_pedidos')
                    .update({
                        notas: data.notas,
                        // Otros campos que se puedan actualizar
                    } as any)
                    .eq('numero_pedido', data.numero_pedido)

                if (error) throw error
                return NextResponse.json({ success: true, message: 'Pedido actualizado' })
            }

            case 'add_transaction': {
                const { error } = await supabase.from('sportex_transacciones').insert({
                    tipo: data.tipo,
                    monto: data.monto,
                    categoria: data.categoria,
                    descripcion: data.descripcion,
                    usuario_id: data.usuario_id,
                } as any)

                if (error) throw error
                return NextResponse.json({ success: true, message: 'Transacción creada' })
            }

            default:
                return NextResponse.json(
                    { success: false, error: 'Acción no válida' },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('Error en webhook n8n:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// Endpoint para consultar datos
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const action = searchParams.get('action')
        const usuario_id = searchParams.get('usuario_id')

        if (!usuario_id) {
            return NextResponse.json(
                { success: false, error: 'usuario_id requerido' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        switch (action) {
            case 'pending_orders': {
                const { data, error } = await supabase
                    .from('sportex_pedidos')
                    .select('numero_pedido, fecha_entrega, notas')
                    .eq('usuario_id', usuario_id)
                    .not('etapa_id', 'is', null)

                if (error) throw error
                return NextResponse.json({ success: true, data })
            }

            case 'leads': {
                const { data, error } = await supabase
                    .from('sportex_leads')
                    .select('nombre, telefono, etapa:sportex_etapas_leads(nombre)')
                    .eq('usuario_id', usuario_id)

                if (error) throw error
                return NextResponse.json({ success: true, data })
            }

            default:
                return NextResponse.json(
                    { success: false, error: 'Acción no válida' },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('Error en GET n8n:', error)
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
