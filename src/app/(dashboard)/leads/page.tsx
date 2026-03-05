'use client'

import { useLeads } from '@/hooks/useLeads'
import { useClientes } from '@/hooks/useClientes'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { KanbanCard } from '@/components/kanban/KanbanCard'
import { StageManager } from '@/components/shared/StageManager'
import { LeadModal } from '@/components/leads/LeadModal'
import { useState } from 'react'
import { Loader2, Plus, Mail, Phone, DollarSign, Settings2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { LeadConEtapa } from '@/types/database'

export default function LeadsPage() {
    const { leads, etapas, loading, crearLead, actualizarLead, moverLead, eliminarLead, convertirACliente, crearEtapa, actualizarEtapa, eliminarEtapa } = useLeads()
    const { crearCliente } = useClientes()
    const [modalOpen, setModalOpen] = useState(false)
    const [stageManagerOpen, setStageManagerOpen] = useState(false)
    const [selectedLead, setSelectedLead] = useState<LeadConEtapa | null>(null)

    const handleDragEnd = async (itemId: string, sourceColumn: string, targetColumn: string, newIndex: number) => {
        if (sourceColumn === targetColumn) return
        await moverLead(itemId, targetColumn, newIndex)
    }

    const handleSave = async (data: Partial<LeadConEtapa>) => {
        if (selectedLead) {
            await actualizarLead(selectedLead.id, data)
        } else {
            await crearLead(data)
        }
        setModalOpen(false)
        setSelectedLead(null)
    }

    const handleDelete = async () => {
        if (selectedLead) {
            await eliminarLead(selectedLead.id)
            setModalOpen(false)
            setSelectedLead(null)
        }
    }

    const handleConvert = async () => {
        if (selectedLead) {
            await convertirACliente(selectedLead.id)
            setModalOpen(false)
            setSelectedLead(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-indigo-400 mx-auto mb-4" />
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando leads...</p>
                </div>
            </div>
        )
    }

    // Calculate total estimated value
    const totalValue = leads.reduce((sum, l) => sum + (l.valor_estimado || 0), 0)

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Pipeline de Leads</h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {leads.length} lead{leads.length !== 1 ? 's' : ''} en total
                        </p>
                        {totalValue > 0 && (
                            <p className="text-sm text-emerald-400 flex items-center gap-1">
                                <DollarSign size={13} />
                                {formatCurrency(totalValue)} valor estimado
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
                        onClick={() => { setSelectedLead(null); setModalOpen(true) }}
                        className="btn btn-primary"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Nuevo Lead</span>
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <KanbanBoard
                onDragEnd={handleDragEnd}
                renderDragOverlay={(activeId) => {
                    const lead = leads.find(l => l.id === activeId)
                    if (!lead) return null
                    return (
                        <div className="space-y-1">
                            <p className="font-semibold text-white text-sm">{lead.nombre}</p>
                            {lead.nombre_club && (
                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{lead.nombre_club}</p>
                            )}
                        </div>
                    )
                }}
            >
                {etapas.map((etapa) => {
                    const etapaLeads = leads.filter(l => l.etapa_id === etapa.id)
                    const etapaValue = etapaLeads.reduce((sum, l) => sum + (l.valor_estimado || 0), 0)

                    return (
                        <KanbanColumn
                            key={etapa.id}
                            id={etapa.id}
                            title={etapa.nombre}
                            color={etapa.color}
                            count={etapaLeads.length}
                            itemIds={etapaLeads.map(l => l.id)}
                            subtitle={etapaValue > 0 ? `${formatCurrency(etapaValue)}` : undefined}
                        >
                            {etapaLeads.map((lead) => (
                                <KanbanCard
                                    key={lead.id}
                                    id={lead.id}
                                    color={etapa.color}
                                    onClick={() => { setSelectedLead(lead); setModalOpen(true) }}
                                >
                                    <div className="space-y-4">
                                        {/* Name + Value */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                    style={{ background: `${etapa.color}20`, color: etapa.color }}
                                                >
                                                    {lead.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="font-semibold text-white text-sm truncate">{lead.nombre}</p>
                                            </div>
                                            {lead.valor_estimado > 0 && (
                                                <span
                                                    className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0"
                                                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
                                                >
                                                    {formatCurrency(lead.valor_estimado)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Club and Contact */}
                                        <div className="space-y-2.5">
                                            {lead.nombre_club && (
                                                <p className="text-xs pl-11" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                                    {lead.nombre_club}
                                                </p>
                                            )}

                                            {/* Contact indicators */}
                                            <div className="flex items-center gap-4 pl-11">
                                                {lead.email && (
                                                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                                        <Mail size={12} />
                                                    </span>
                                                )}
                                                {lead.telefono && (
                                                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                                        <Phone size={12} />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </KanbanCard>
                            ))}
                        </KanbanColumn>
                    )
                })}
            </KanbanBoard>

            {/* Modal */}
            {modalOpen && (
                <LeadModal
                    lead={selectedLead}
                    etapas={etapas}
                    onClose={() => { setModalOpen(false); setSelectedLead(null) }}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onConvert={handleConvert}
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
                title="Gestionar Etapas del Pipeline"
            />
        </div>
    )
}
