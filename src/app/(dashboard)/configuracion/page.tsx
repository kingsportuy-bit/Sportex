'use client'

import { useLeads } from '@/hooks/useLeads'
import { usePedidos } from '@/hooks/usePedidos'
import { StageManager } from '@/components/shared/StageManager'
import { useState } from 'react'
import {
    Loader2,
    Settings,
    Target,
    Package
} from 'lucide-react'

export default function ConfiguracionPage() {
    const {
        etapas: etapasLeads,
        loading: loadingLeads,
        crearEtapa: crearEtapaLead,
        actualizarEtapa: actualizarEtapaLead,
        eliminarEtapa: eliminarEtapaLead,
    } = useLeads()
    const {
        etapas: etapasPedidos,
        loading: loadingPedidos,
        crearEtapa: crearEtapaPedido,
        actualizarEtapa: actualizarEtapaPedido,
        eliminarEtapa: eliminarEtapaPedido,
    } = usePedidos()

    const [openManager, setOpenManager] = useState<'leads' | 'pedidos' | null>(null)

    const loading = loadingLeads || loadingPedidos

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-indigo-400 mx-auto mb-4" />
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando configuración...</p>
                </div>
            </div>
        )
    }

    const sections = [
        {
            key: 'leads' as const,
            title: 'Etapas de Prospectos',
            description: 'Configura las etapas del pipeline de prospectos',
            icon: Target,
            color: '#A78BFA',
            etapas: etapasLeads,
        },
        {
            key: 'pedidos' as const,
            title: 'Etapas de Pedidos',
            description: 'Configura las etapas del pipeline de pedidos',
            icon: Package,
            color: '#818CF8',
            etapas: etapasPedidos,
        }
    ]

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Settings size={24} className="text-indigo-400" />
                    Configuración
                </h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Gestiona las etapas de tus tableros. Los cambios se guardan automáticamente.
                </p>
            </div>

            {/* Stage sections */}
            <div className="grid gap-4">
                {sections.map(section => (
                    <div
                        key={section.key}
                        className="card p-6 flex items-center justify-between cursor-pointer hover:border-white/10 transition-all"
                        onClick={() => setOpenManager(section.key)}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ background: `${section.color}15` }}
                            >
                                <section.icon size={22} style={{ color: section.color }} />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold">{section.title}</h3>
                                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {section.description}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Stage preview pills */}
                            <div className="hidden md:flex gap-1.5">
                                {section.etapas.slice(0, 4).map(e => (
                                    <span
                                        key={e.id}
                                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                                        style={{
                                            background: `${e.color}20`,
                                            color: e.color,
                                            border: `1px solid ${e.color}30`
                                        }}
                                    >
                                        {e.nombre}
                                    </span>
                                ))}
                                {section.etapas.length > 4 && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/40">
                                        +{section.etapas.length - 4}
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-medium px-3 py-1.5 rounded-lg bg-white/5 text-white/50">
                                {section.etapas.length} etapas
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Stage Managers — each saves directly to Supabase */}
            <StageManager
                isOpen={openManager === 'leads'}
                onClose={() => setOpenManager(null)}
                stages={etapasLeads}
                onAdd={crearEtapaLead}
                onUpdate={actualizarEtapaLead}
                onDelete={eliminarEtapaLead}
                title="Gestionar Etapas de Prospectos"
            />
            <StageManager
                isOpen={openManager === 'pedidos'}
                onClose={() => setOpenManager(null)}
                stages={etapasPedidos}
                onAdd={crearEtapaPedido}
                onUpdate={actualizarEtapaPedido}
                onDelete={eliminarEtapaPedido}
                title="Gestionar Etapas de Pedidos"
            />
        </div>
    )
}
