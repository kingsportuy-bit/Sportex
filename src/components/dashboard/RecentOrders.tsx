import { daysUntilDelivery, getDeliveryStatusColor, getDeliveryStatusLabel, formatCurrency } from '@/lib/utils'
import { Package, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Order {
    id: string
    numero_pedido: string
    cliente_nombre?: string | null
    precio_total: number
    fecha_entrega: string | null
    etapa_nombre?: string
    etapa_color?: string
}

interface RecentOrdersProps {
    orders: Order[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-dark-100">Actividad de Pedidos</h3>
                    <p className="text-sm text-dark-300">Últimas actualizaciones</p>
                </div>
                <Link href="/pedidos" className="text-sm font-medium text-primary hover:text-primary-light flex items-center gap-1 transition-colors">
                    Explorar todos
                    <ArrowRight size={14} />
                </Link>
            </div>

            <div>
                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                            style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <Package size={24} className="text-dark-400" />
                        </div>
                        <p className="text-dark-300 font-medium">No hay pedidos recientes</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {orders.map((order) => {
                            const days = daysUntilDelivery(order.fecha_entrega)
                            const statusColor = getDeliveryStatusColor(days)
                            const statusLabel = getDeliveryStatusLabel(days)

                            return (
                                <Link
                                    key={order.id}
                                    href={`/pedidos`}
                                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <Package size={18} className="text-dark-200" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-dark-100 group-hover:text-primary transition-colors">
                                                {order.numero_pedido}
                                            </p>
                                            {order.etapa_nombre && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md"
                                                    style={{
                                                        background: order.etapa_color ? `${order.etapa_color}15` : 'rgba(255,255,255,0.05)',
                                                        color: order.etapa_color || 'rgba(255,255,255,0.5)',
                                                        border: `1px solid ${order.etapa_color ? `${order.etapa_color}30` : 'rgba(255,255,255,0.08)'}`
                                                    }}>
                                                    {order.etapa_nombre}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-dark-300 truncate">
                                            {order.cliente_nombre || 'Cliente Final'}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-semibold text-dark-100 mb-1">
                                            {formatCurrency(order.precio_total)}
                                        </p>
                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColor}`}
                                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                                            <Clock size={10} />
                                            <span>{statusLabel}</span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}