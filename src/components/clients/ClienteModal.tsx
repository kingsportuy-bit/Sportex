'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import type { Cliente } from '@/types/database'

const clienteSchema = z.object({
    nombre: z.string().min(1, 'Nombre requerido'),
    nombre_club: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefono: z.string().optional(),
    direccion: z.string().optional(),
    notas: z.string().optional(),
})

type ClienteForm = z.infer<typeof clienteSchema>

interface ClienteModalProps {
    cliente: Cliente | null
    onClose: () => void
    onSave: (data: Partial<Cliente>) => Promise<void>
    onDelete?: () => Promise<void>
}

export function ClienteModal({ cliente, onClose, onSave, onDelete }: ClienteModalProps) {
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const isEdit = !!cliente

    const { register, handleSubmit, formState: { errors } } = useForm<ClienteForm>({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            nombre: cliente?.nombre || '',
            nombre_club: cliente?.nombre_club || '',
            email: cliente?.email || '',
            telefono: cliente?.telefono || '',
            direccion: cliente?.direccion || '',
            notas: cliente?.notas || '',
        },
    })

    const onSubmit = async (data: ClienteForm) => {
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

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
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
                            <label className="label">Nombre *</label>
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

                        {/* Dirección */}
                        <div>
                            <label className="label">Dirección</label>
                            <input type="text" className="input" placeholder="Calle 123, Ciudad" {...register('direccion')} />
                        </div>

                        {/* Notas */}
                        <div>
                            <label className="label">Notas</label>
                            <textarea className="input min-h-[80px] resize-none" placeholder="Notas sobre el cliente..." {...register('notas')} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <div className="flex items-center justify-between w-full gap-3">
                            <div>
                                {onDelete && (
                                    <button type="button" onClick={() => setConfirmDelete(true)} disabled={deleting} className="btn btn-danger">
                                        {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                        <span className="hidden sm:inline">Eliminar</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                                <button type="submit" disabled={loading} className="btn btn-primary px-8">
                                    {loading && <Loader2 size={16} className="animate-spin" />}
                                    {isEdit ? 'Guardar' : 'Crear Cliente'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <ConfirmModal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
                title="¿Eliminar cliente?" description="Esta acción eliminará permanentemente al cliente. No se puede deshacer."
                confirmText="Eliminar" variant="danger" />
        </div>
    )
}
