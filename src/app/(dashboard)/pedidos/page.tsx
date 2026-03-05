'use client'

import { usePedidos } from '@/hooks/usePedidos'
import { useClientes } from '@/hooks/useClientes'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { KanbanCard } from '@/components/kanban/KanbanCard'
import { StageManager } from '@/components/shared/StageManager'
import { OrderModal } from '@/components/orders/OrderModal'
import { useState } from 'react'
import {
    Loader2,
    Plus,
    Clock,
    DollarSign,
    Settings2,
    User,
} from 'lucide-react'
import {
    formatCurrency,
    formatDateShort,
    daysUntilDelivery,
    getDeliveryStatusColor,
    getDeliveryStatusLabel,
} from '@/lib/utils'
import type { PedidoConRelaciones } from '@/types/database'

export default function PedidosPage() {
    const { pedidos, etapas, loading, crearPedido, actualizarPedido, moverPedido, eliminarPedido, uploadBoceto, obtenerItems, guardarItems, crearEtapa, actualizarEtapa, eliminarEtapa } = usePedidos()
    const { clientes } = useClientes()
    const [modalOpen, setModalOpen] = useState(false)
    const [stageManagerOpen, setStageManagerOpen] = useState(false)
    const [selectedPedido, setSelectedPedido] = useState<PedidoConRelaciones | null>(null)

    const handleDragEnd = async (itemId: string, sourceColumn: string, targetColumn: string, newIndex: number) => {
        if (sourceColumn === targetColumn) return
        await moverPedido(itemId, targetColumn, newIndex)
    }

    const handleSave = async (data: Partial<PedidoConRelaciones>) => {
        let result
        if (selectedPedido) {
            await actualizarPedido(selectedPedido.id, data)
            result = { ...selectedPedido, ...data }
        } else {
            result = await crearPedido(data)
        }
        setModalOpen(false)
        setSelectedPedido(null)
        return result
    }

    const handleDelete = async () => {
        if (selectedPedido) {
            await eliminarPedido(selectedPedido.id)
            setModalOpen(false)
            setSelectedPedido(null)
        }
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

    const totalRevenue = pedidos.reduce((sum, p) => sum + (p.precio_total || 0), 0)

    return (
        <div className="space-y-8 animate-fadeIn mt-[2px]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Pipeline de Pedidos</h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} en total
                        </p>
                        {totalRevenue > 0 && (
                            <p className="text-sm text-emerald-400 flex items-center gap-1">
                                <DollarSign size={13} />
                                {formatCurrency(totalRevenue)} facturación
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setStageManagerOpen(true)}
                        className="btn btn-secondary"
                        title="Gestionar Etapas"
                    >
                        <Settings2 size={18} />
                    </button>
                    <button
                        onClick={() => { setSelectedPedido(null); setModalOpen(true) }}
                        className="btn btn-primary"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Nuevo Pedido</span>
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <KanbanBoard
                onDragEnd={handleDragEnd}
                renderDragOverlay={(activeId) => {
                    const pedido = pedidos.find(p => p.id === activeId)
                    if (!pedido) return null
                    return (
                        <div className="space-y-1">
                            <p className="font-semibold text-white text-sm">{pedido.numero_pedido}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                {pedido.cliente?.nombre || 'Sin cliente'}
                            </p>
                        </div>
                    )
                }}
            >
                {etapas.map((etapa) => {
                    const etapaPedidos = pedidos.filter(p => p.etapa_id === etapa.id)
                    const etapaRevenue = etapaPedidos.reduce((sum, p) => sum + (p.precio_total || 0), 0)

                    return (
                        <KanbanColumn
                            key={etapa.id}
                            id={etapa.id}
                            title={etapa.nombre}
                            color={etapa.color}
                            count={etapaPedidos.length}
                            itemIds={etapaPedidos.map(p => p.id)}
                            subtitle={etapaRevenue > 0 ? `${formatCurrency(etapaRevenue)}` : undefined}
                        >
                            {etapaPedidos.map((pedido) => {
                                const days = daysUntilDelivery(pedido.fecha_entrega)
                                const statusColor = getDeliveryStatusColor(days)
                                const statusLabel = getDeliveryStatusLabel(days)
                                const clienteName = pedido.cliente?.nombre || pedido.cliente?.nombre_club || 'Sin cliente'

                                return (
                                    <KanbanCard
                                        key={pedido.id}
                                        id={pedido.id}
                                        color={etapa.color}
                                        onClick={() => { setSelectedPedido(pedido); setModalOpen(true) }}
                                    >
                                        <div className="space-y-2.5">
                                            {/* Order number + Price */}
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-bold text-white text-sm">{pedido.numero_pedido}</p>
                                                <span
                                                    className="text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                                                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
                                                >
                                                    {formatCurrency(pedido.precio_total)}
                                                </span>
                                            </div>

                                            {/* Client */}
                                            <div className="flex items-center gap-1.5">
                                                <User size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    {clienteName}
                                                </p>
                                            </div>

                                            {/* Delivery status */}
                                            {pedido.fecha_entrega && (
                                                <div className={`flex items-center gap-1.5 text-xs ${statusColor}`}>
                                                    <Clock size={12} />
                                                    <span>{formatDateShort(pedido.fecha_entrega)}</span>
                                                    <span className="opacity-70">· {statusLabel}</span>
                                                </div>
                                            )}
                                        </div>
                                    </KanbanCard>
                                )
                            })}
                        </KanbanColumn>
                    )
                })}
            </KanbanBoard>

            {/* Modal */}
            {modalOpen && (
                <OrderModal
                    pedido={selectedPedido}
                    etapas={etapas}
                    onClose={() => { setModalOpen(false); setSelectedPedido(null) }}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    uploadBoceto={uploadBoceto}
                    obtenerItems={obtenerItems}
                    guardarItems={guardarItems}
                />
            )}

            {/* Stage Manager */}
            <StageManager
                isOpen={stageManagerOpen}
                onClose={() => setStageManagerOpen(false)}
                stages={etapas}
                onAdd={crearEtapa}
                onUpdate={actualizarEtapa}
                onDelete={eliminarEtapa}
                title="Gestionar Etapas de Pedidos"
            />
        </div>
    )
}
