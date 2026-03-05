'use client'

import { useTransacciones } from '@/hooks/useTransacciones'
import { usePedidos } from '@/hooks/usePedidos'
import { OrderStats } from '@/components/dashboard/OrderStats'
import { RecentOrders } from '@/components/dashboard/RecentOrders'
import {
    Loader2,
    TrendingUp,
    TrendingDown,
    Wallet,
    AlertTriangle,
    ArrowRight
} from 'lucide-react'
import { formatCurrency, daysUntilDelivery } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
    const { stats, loading: loadingStats } = useTransacciones()
    const { pedidos, loading: loadingPedidos } = usePedidos()

    const loading = loadingStats || loadingPedidos

    // Calculate order metrics
    const totalPedidos = pedidos.length
    const pedidosPendientes = pedidos.filter(p => {
        const etapaNombre = p.etapa?.nombre?.toLowerCase() || ''
        return etapaNombre !== 'entregado'
    }).length
    const pedidosEntregados = pedidos.filter(p => {
        const etapaNombre = p.etapa?.nombre?.toLowerCase() || ''
        return etapaNombre === 'entregado'
    }).length
    const pedidosUrgentes = pedidos.filter(p => {
        const days = daysUntilDelivery(p.fecha_entrega)
        return days !== null && days <= 3 && days >= 0
    }).length

    // Recent orders
    const recentOrders = pedidos
        .slice(0, 5)
        .map(p => ({
            id: p.id,
            numero_pedido: p.numero_pedido,
            cliente_nombre: p.cliente?.nombre || p.cliente?.nombre_club,
            precio_total: p.precio_total,
            fecha_entrega: p.fecha_entrega,
            etapa_nombre: p.etapa?.nombre,
            etapa_color: p.etapa?.color,
        }))

    // Urgent orders alert
    const urgentOrders = pedidos.filter(p => {
        const days = daysUntilDelivery(p.fecha_entrega)
        return days !== null && days <= 3
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-indigo-400 mx-auto mb-4" />
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header with inline KPIs */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Panel de Control</h1>
                    <p className="text-sm text-dark-200">Resumen de tu negocio este mes</p>
                </div>

                {/* Inline KPI strip */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <TrendingUp size={14} className="text-emerald-400" />
                        <span className="text-xs font-medium text-dark-200">Ingresos</span>
                        <span className="text-sm font-bold text-emerald-400">{formatCurrency(stats.ingresosMes)}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5">
                        <TrendingDown size={14} className="text-red-400" />
                        <span className="text-xs font-medium text-dark-200">Egresos</span>
                        <span className="text-sm font-bold text-red-400">{formatCurrency(stats.egresosMes)}</span>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${stats.gananciaMes >= 0 ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                        <Wallet size={14} className={stats.gananciaMes >= 0 ? 'text-indigo-400' : 'text-red-400'} />
                        <span className="text-xs font-medium text-dark-200">Neto</span>
                        <span className={`text-sm font-bold ${stats.gananciaMes >= 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                            {formatCurrency(stats.gananciaMes)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Urgent alert */}
            {urgentOrders.length > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                    <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-400">
                            {urgentOrders.length} pedido{urgentOrders.length > 1 ? 's' : ''} con entrega urgente
                        </p>
                        <p className="text-xs text-dark-200">Plazo máximo 3 días</p>
                    </div>
                    <Link href="/pedidos" className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all flex-shrink-0">
                        Ver <ArrowRight size={12} className="inline ml-1" />
                    </Link>
                </div>
            )}

            {/* Order Statistics */}
            <OrderStats
                total={totalPedidos}
                pending={pedidosPendientes}
                delivered={pedidosEntregados}
                urgent={pedidosUrgentes}
            />

            {/* Recent Orders */}
            <div>
                <RecentOrders orders={recentOrders} />
            </div>
        </div>
    )
}
