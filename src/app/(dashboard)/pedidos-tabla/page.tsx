'use client'

import { usePedidos } from '@/hooks/usePedidos'
import { useState } from 'react'
import {
    Loader2,
    Search,
    Clock,
    ChevronDown,
    ChevronUp,
    Filter,
    Package
} from 'lucide-react'
import {
    formatCurrency,
    formatDate,
    daysUntilDelivery,
    getDeliveryStatusColor,
    getDeliveryStatusLabel,
    calculateProfit
} from '@/lib/utils'
import { OrderModal } from '@/components/orders/OrderModal'
import type { PedidoConRelaciones } from '@/types/database'

type SortField = 'fecha_pedido' | 'fecha_entrega' | 'precio_total' | 'numero_pedido'
type SortDirection = 'asc' | 'desc'

export default function PedidosTablaPage() {
    const { pedidos, etapas, loading, actualizarPedido, eliminarPedido, uploadBoceto, obtenerItems, guardarItems } = usePedidos()
    const [search, setSearch] = useState('')
    const [filterEtapa, setFilterEtapa] = useState<string>('all')
    const [sortField, setSortField] = useState<SortField>('fecha_entrega')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedPedido, setSelectedPedido] = useState<PedidoConRelaciones | null>(null)

    // Filtrar
    let filteredPedidos = pedidos.filter(p => {
        const searchLower = search.toLowerCase()
        const matchSearch =
            p.numero_pedido.toLowerCase().includes(searchLower) ||
            p.cliente?.nombre?.toLowerCase().includes(searchLower) ||
            p.cliente?.nombre_club?.toLowerCase().includes(searchLower)

        const matchEtapa = filterEtapa === 'all' || p.etapa_id === filterEtapa

        return matchSearch && matchEtapa
    })

    // Ordenar
    filteredPedidos = [...filteredPedidos].sort((a, b) => {
        let valueA: string | number = ''
        let valueB: string | number = ''

        switch (sortField) {
            case 'fecha_pedido':
                valueA = a.fecha_pedido || ''
                valueB = b.fecha_pedido || ''
                break
            case 'fecha_entrega':
                valueA = a.fecha_entrega || 'zzz'
                valueB = b.fecha_entrega || 'zzz'
                break
            case 'precio_total':
                valueA = a.precio_total
                valueB = b.precio_total
                break
            case 'numero_pedido':
                valueA = a.numero_pedido
                valueB = b.numero_pedido
                break
        }

        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1
        return 0
    })

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const handleRowClick = (pedido: PedidoConRelaciones) => {
        setSelectedPedido(pedido)
        setModalOpen(true)
    }

    const handleSave = async (data: Partial<PedidoConRelaciones>) => {
        if (selectedPedido) {
            await actualizarPedido(selectedPedido.id, data)
        }
        setModalOpen(false)
    }

    const handleDelete = async () => {
        if (selectedPedido) {
            await eliminarPedido(selectedPedido.id)
            setModalOpen(false)
        }
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null
        return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-indigo-400 mx-auto mb-4" />
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando pedidos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-16 animate-fadeIn mt-[2px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Registro General de Pedidos</h1>
                    <p className="text-xs mt-1 font-medium uppercase tracking-widest opacity-40">Administración y seguimiento de producción</p>
                </div>
                <div className="flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/[0.02]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{filteredPedidos.length} Pedidos Visibles</span>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-none shadow-xl">
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 flex items-center gap-4 px-6 py-3 rounded-2xl"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Search size={18} className="text-primary/40" />
                        <input
                            type="text"
                            placeholder="Buscar por número, cliente o club..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-slate-600"
                            style={{ color: 'var(--color-text)' }}
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 px-6 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
                        <Filter size={16} className="text-slate-500 group-hover:text-primary transition-colors" />
                        <select
                            value={filterEtapa}
                            onChange={(e) => setFilterEtapa(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-bold h-12 min-w-[180px] cursor-pointer"
                        >
                            <option value="all">Todas las etapas</option>
                            {etapas.map(etapa => (
                                <option key={etapa.id} value={etapa.id} className="bg-[#1e2132]">{etapa.nombre}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden border-white/5 shadow-2xl relative" style={{ background: 'transparent' }}>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="cursor-pointer py-6 px-8 transition-colors hover:bg-white/5" onClick={() => handleSort('numero_pedido')}>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                                        Pedido <SortIcon field="numero_pedido" />
                                    </div>
                                </th>
                                <th className="py-6 px-8">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Cliente</span>
                                </th>
                                <th className="cursor-pointer py-6 px-8 transition-colors hover:bg-white/5" onClick={() => handleSort('fecha_pedido')}>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                                        Fecha <SortIcon field="fecha_pedido" />
                                    </div>
                                </th>
                                <th className="cursor-pointer py-6 px-8 transition-colors hover:bg-white/5" onClick={() => handleSort('fecha_entrega')}>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                                        Entrega <SortIcon field="fecha_entrega" />
                                    </div>
                                </th>
                                <th className="py-6 px-8">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Estado</span>
                                </th>
                                <th className="cursor-pointer text-right py-6 px-8 transition-colors hover:bg-white/5" onClick={() => handleSort('precio_total')}>
                                    <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                                        Total <SortIcon field="precio_total" />
                                    </div>
                                </th>
                                <th className="text-right py-6 px-8">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Ganancia</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {filteredPedidos.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-24">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <Package size={24} className="opacity-10" />
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-widest opacity-20">No se encontraron pedidos</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPedidos.map((pedido) => {
                                    const days = daysUntilDelivery(pedido.fecha_entrega)
                                    const statusColor = getDeliveryStatusColor(days)
                                    const statusLabel = getDeliveryStatusLabel(days)
                                    const ganancia = calculateProfit(pedido.precio_total, pedido.costo_total)

                                    return (
                                        <tr
                                            key={pedido.id}
                                            className="cursor-pointer hover:bg-white/[0.02] transition-all group"
                                            onClick={() => handleRowClick(pedido)}
                                        >
                                            <td className="py-6 px-8 font-black text-white tracking-widest text-xs group-hover:text-primary transition-colors">
                                                {pedido.numero_pedido}
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white text-sm">{pedido.cliente?.nombre || 'Final User'}</span>
                                                    {pedido.cliente?.nombre_club && (
                                                        <span className="text-[10px] font-black uppercase tracking-wider opacity-30">{pedido.cliente?.nombre_club}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-xs font-bold text-slate-500">
                                                {formatDate(pedido.fecha_pedido)}
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex flex-col gap-1">
                                                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${statusColor}`}>
                                                        <Clock size={12} strokeWidth={3} />
                                                        <span>{pedido.fecha_entrega ? formatDate(pedido.fecha_entrega) : 'Indefinido'}</span>
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] opacity-50 ${statusColor}`}>{statusLabel}</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div
                                                    className="inline-block px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] rounded-full text-white/90 shadow-lg"
                                                    style={{
                                                        backgroundColor: pedido.etapa?.color || '#6366F1',
                                                        boxShadow: `0 4px 12px ${pedido.etapa?.color}33`
                                                    }}
                                                >
                                                    {pedido.etapa?.nombre || 'Sin estado'}
                                                </div>
                                            </td>
                                            <td className="py-6 px-8 text-right font-black text-white tracking-tight">
                                                {formatCurrency(pedido.precio_total)}
                                            </td>
                                            <td className={`py-6 px-8 text-right font-black tracking-tight ${ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {formatCurrency(ganancia)}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && selectedPedido && (
                <OrderModal
                    pedido={selectedPedido}
                    etapas={etapas}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    uploadBoceto={uploadBoceto}
                    obtenerItems={obtenerItems}
                    guardarItems={guardarItems}
                />
            )}
        </div>
    )
}
