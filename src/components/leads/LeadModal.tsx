'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Trash2, Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import type { LeadConEtapa, EtapaLead } from '@/types/database'

const leadSchema = z.object({
    nombre: z.string().min(1, 'Nombre requerido'),
    nombre_club: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefono: z.string().optional(),
    valor_estimado: z.number().min(0),
    etapa_id: z.string().optional(),
    notas: z.string().optional(),
})

type LeadForm = z.infer<typeof leadSchema>

interface LeadModalProps {
    lead: LeadConEtapa | null
    etapas: EtapaLead[]
    onClose: () => void
    onSave: (data: Partial<LeadConEtapa>) => Promise<void>
    onDelete?: () => Promise<void>
    onConvert?: () => Promise<void>
}

export function LeadModal({ lead, etapas, onClose, onSave, onDelete, onConvert }: LeadModalProps) {
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [converting, setConverting] = useState(false)
    const [confirmAction, setConfirmAction] = useState<'delete' | 'convert' | null>(null)

    const isEdit = !!lead

    const { register, handleSubmit, formState: { errors } } = useForm<LeadForm>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            nombre: lead?.nombre || '',
            nombre_club: lead?.nombre_club || '',
            email: lead?.email || '',
            telefono: lead?.telefono || '',
            valor_estimado: lead?.valor_estimado || 0,
            etapa_id: lead?.etapa_id || etapas[0]?.id || '',
            notas: lead?.notas || '',
        },
    })

    const onSubmit = async (data: LeadForm) => {
        setLoading(true)
        try {
            await onSave({ ...data, email: data.email || null })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!onDelete) return
        setDeleting(true)
        try { await onDelete() } finally { setDeleting(false) }
    }

    const handleConvert = async () => {
        if (!onConvert) return
        setConverting(true)
        try { await onConvert() } finally { setConverting(false) }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">{isEdit ? 'Editar Lead' : 'Nuevo Lead'}</h2>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
                    <div className="modal-body space-y-5">
                        {/* Nombre */}
                        <div>
                            <label className="label">Nombre del Contacto *</label>
                            <input type="text" className={`input ${errors.nombre ? 'border-red-500/50' : ''}`} placeholder="Ej: Juan Pérez" {...register('nombre')} />
                            {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre.message}</p>}
                        </div>

                        {/* Club */}
                        <div>
                            <label className="label">Club / Institución</label>
                            <input type="text" className="input" placeholder="Club Deportivo..." {...register('nombre_club')} />
                        </div>

                        {/* Contacto - 2 cols */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Teléfono</label>
                                <input type="tel" className="input" placeholder="+54 9..." {...register('telefono')} />
                            </div>
                            <div>
                                <label className="label">Email</label>
                                <input type="email" className={`input ${errors.email ? 'border-red-500/50' : ''}`} placeholder="email@ejemplo.com" {...register('email')} />
                            </div>
                        </div>

                        {/* Valor y Etapa - 2 cols */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Valor Estimado</label>
                                <div className="flex items-center">
                                    <span className="mr-2 text-white/30 font-bold">$</span>
                                    <input type="number" step="0.01" className="input flex-1" {...register('valor_estimado', { valueAsNumber: true })} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Etapa</label>
                                <select className="input" {...register('etapa_id')}>
                                    {etapas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Notas */}
                        <div>
                            <label className="label">Notas</label>
                            <textarea className="input min-h-[80px] resize-none" placeholder="Notas sobre el lead..." {...register('notas')} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <div className="flex items-center justify-between w-full gap-3">
                            <div className="flex gap-2">
                                {onDelete && (
                                    <button type="button" onClick={() => setConfirmAction('delete')} disabled={deleting} className="btn btn-danger">
                                        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        <span className="hidden sm:inline">Eliminar</span>
                                    </button>
                                )}
                                {onConvert && (
                                    <button type="button" onClick={() => setConfirmAction('convert')} disabled={converting}
                                        className="btn text-white" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                                        {converting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                                        <span className="hidden sm:inline">Convertir</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" disabled={loading} className="btn btn-primary px-8">
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    {isEdit ? 'Guardar' : 'Crear Lead'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <ConfirmModal isOpen={confirmAction === 'delete'} onClose={() => setConfirmAction(null)} onConfirm={handleDelete}
                title="¿Eliminar lead?" description="Esta acción eliminará permanentemente el lead. No se puede deshacer."
                confirmText="Eliminar" variant="danger" />
            <ConfirmModal isOpen={confirmAction === 'convert'} onClose={() => setConfirmAction(null)} onConfirm={handleConvert}
                title="¿Convertir en cliente?" description="El lead será eliminado y se creará un nuevo cliente con sus datos."
                confirmText="Convertir" variant="primary" />
        </div>
    )
}
