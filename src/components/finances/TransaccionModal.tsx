'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { Transaccion } from '@/types/database'

const transaccionSchema = z.object({
    tipo: z.enum(['ingreso', 'egreso']),
    monto: z.number().positive('El monto debe ser positivo'),
    categoria: z.string().optional(),
    descripcion: z.string().optional(),
    fecha_transaccion: z.string(),
})

type TransaccionForm = z.infer<typeof transaccionSchema>

const categorias = {
    ingreso: ['Venta', 'Seña', 'Cobro pendiente', 'Otro'],
    egreso: ['Materiales', 'Producción', 'Envío', 'Servicios', 'Impuestos', 'Otro'],
}

interface TransaccionModalProps {
    onClose: () => void
    onSave: (data: Partial<Transaccion>) => Promise<void>
}

export function TransaccionModal({ onClose, onSave }: TransaccionModalProps) {
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, watch, formState: { errors } } = useForm<TransaccionForm>({
        resolver: zodResolver(transaccionSchema),
        defaultValues: {
            tipo: 'ingreso',
            monto: 0,
            categoria: '',
            descripcion: '',
            fecha_transaccion: new Date().toISOString().split('T')[0],
        },
    })

    const tipoActual = watch('tipo')

    const onSubmit = async (data: TransaccionForm) => {
        setLoading(true)
        try { await onSave(data) } finally { setLoading(false) }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Nueva Transacción</h2>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
                    <div className="modal-body space-y-5">
                        {/* Tipo */}
                        <div>
                            <label className="label">Tipo de Movimiento</label>
                            <div className="grid grid-cols-2 gap-3 mt-1">
                                <label className={`flex items-center justify-center py-3 rounded-xl cursor-pointer border transition-all font-bold text-sm ${tipoActual === 'ingreso'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                        : 'bg-white/[0.02] border-white/[0.06] text-white/30 hover:border-white/10'
                                    }`}>
                                    <input type="radio" value="ingreso" className="hidden" {...register('tipo')} />
                                    INGRESO
                                </label>
                                <label className={`flex items-center justify-center py-3 rounded-xl cursor-pointer border transition-all font-bold text-sm ${tipoActual === 'egreso'
                                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                        : 'bg-white/[0.02] border-white/[0.06] text-white/30 hover:border-white/10'
                                    }`}>
                                    <input type="radio" value="egreso" className="hidden" {...register('tipo')} />
                                    EGRESO
                                </label>
                            </div>
                        </div>

                        {/* Monto + Categoría */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Monto</label>
                                <div className="flex items-center">
                                    <span className="mr-2 text-white/30 font-bold">$</span>
                                    <input type="number" step="0.01" className={`input flex-1 ${errors.monto ? 'border-red-500/50' : ''}`} placeholder="0.00" {...register('monto', { valueAsNumber: true })} />
                                </div>
                                {errors.monto && <p className="text-red-400 text-xs mt-1">{errors.monto.message}</p>}
                            </div>
                            <div>
                                <label className="label">Categoría</label>
                                <select className="input" {...register('categoria')}>
                                    <option value="">Seleccionar...</option>
                                    {categorias[tipoActual].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Fecha */}
                        <div>
                            <label className="label">Fecha</label>
                            <input type="date" className="input" {...register('fecha_transaccion')} />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="label">Descripción</label>
                            <textarea className="input min-h-[80px] resize-none" placeholder="Notas del movimiento..." {...register('descripcion')} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <div className="flex justify-end w-full gap-3">
                            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                            <button type="submit" disabled={loading} className="btn btn-primary px-8">
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                Registrar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
