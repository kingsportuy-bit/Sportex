'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Trash2, Loader2, Upload, Plus, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { useClientes } from '@/hooks/useClientes'
import { formatCurrency, daysUntilDelivery, getDeliveryStatusColor, getDeliveryStatusLabel, generateOrderNumber, calculateProfit } from '@/lib/utils'
import type { PedidoConRelaciones, EtapaPedido, PedidoItem } from '@/types/database'

// --- Schema ---
const pedidoSchema = z.object({
    numero_pedido: z.string().min(1, 'Número requerido'),
    cliente_id: z.string().optional(),
    etapa_id: z.string().optional(),
    fecha_pedido: z.string(),
    fecha_entrega: z.string().optional(),
    precio_total: z.number().min(0),
    costo_total: z.number().min(0),
    notas: z.string().optional(),
})

type PedidoForm = z.infer<typeof pedidoSchema>

// --- Item type for ficha ---
interface FichaItem {
    _key: string
    tipo_producto: string
    descripcion: string
    cantidad: number
    talles: TalleLinea[]
}

interface TalleLinea {
    talle: string
    cantidad: number
    numero: string
    nombre: string
    golero: boolean
}

// --- Props ---
interface OrderModalProps {
    pedido: PedidoConRelaciones | null
    etapas: EtapaPedido[]
    onClose: () => void
    onSave: (data: Partial<PedidoConRelaciones>) => Promise<any>
    onDelete?: () => Promise<void>
    uploadBoceto?: (pedidoId: string, file: File) => Promise<string>
    obtenerItems?: (pedidoId: string) => Promise<PedidoItem[]>
    guardarItems?: (pedidoId: string, items: any[]) => Promise<any>
}

const nuevaLinea = (): TalleLinea => ({ talle: '', cantidad: 1, numero: '', nombre: '', golero: false })
const nuevoItem = (): FichaItem => ({ _key: crypto.randomUUID(), tipo_producto: '', descripcion: '', cantidad: 1, talles: [nuevaLinea()] })

export function OrderModal({ pedido, etapas, onClose, onSave, onDelete, uploadBoceto, obtenerItems, guardarItems }: OrderModalProps) {
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [bocetoPreview, setBocetoPreview] = useState<string | null>(pedido?.boceto_url || null)
    const [items, setItems] = useState<FichaItem[]>([])
    const [expandedItem, setExpandedItem] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { clientes } = useClientes()

    const isEdit = !!pedido

    const { register, handleSubmit, watch, formState: { errors } } = useForm<PedidoForm>({
        resolver: zodResolver(pedidoSchema),
        defaultValues: {
            numero_pedido: pedido?.numero_pedido || generateOrderNumber(),
            cliente_id: pedido?.cliente_id || '',
            etapa_id: pedido?.etapa_id || etapas[0]?.id || '',
            fecha_pedido: pedido?.fecha_pedido || new Date().toISOString().split('T')[0],
            fecha_entrega: pedido?.fecha_entrega || '',
            precio_total: pedido?.precio_total || 0,
            costo_total: pedido?.costo_total || 0,
            notas: pedido?.notas || '',
        },
    })

    const precioTotal = watch('precio_total')
    const costoTotal = watch('costo_total')
    const fechaEntrega = watch('fecha_entrega')
    const ganancia = calculateProfit(precioTotal || 0, costoTotal || 0)
    const days = daysUntilDelivery(fechaEntrega || null)
    const statusColor = getDeliveryStatusColor(days)
    const statusLabel = getDeliveryStatusLabel(days)

    // Load items on edit
    useEffect(() => {
        if (isEdit && pedido?.id && obtenerItems) {
            obtenerItems(pedido.id).then(dbItems => {
                if (dbItems.length > 0) {
                    setItems(dbItems.map(i => ({
                        _key: i.id,
                        tipo_producto: i.tipo_producto,
                        descripcion: i.descripcion || '',
                        cantidad: i.cantidad,
                        talles: Array.isArray(i.talles) ? (i.talles as unknown as TalleLinea[]) : [],
                    })))
                }
            }).catch(() => { })
        }
    }, [])

    // --- Handlers ---
    const onSubmit = async (data: PedidoForm) => {
        setLoading(true)
        try {
            const result = await onSave({
                ...data,
                cliente_id: data.cliente_id || null,
                fecha_entrega: data.fecha_entrega || null,
            })

            // Save items if we have a pedido ID
            const pedidoId = result?.id || pedido?.id
            if (pedidoId && guardarItems && items.length > 0) {
                await guardarItems(pedidoId, items.map(i => ({
                    tipo_producto: i.tipo_producto,
                    descripcion: i.descripcion,
                    cantidad: i.cantidad,
                    talles: i.talles,
                })))
            }
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!onDelete) return
        setDeleting(true)
        try { await onDelete() } finally { setDeleting(false) }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !uploadBoceto || !pedido?.id) return
        setUploading(true)
        try {
            const url = await uploadBoceto(pedido.id, file)
            setBocetoPreview(url)
        } catch (err) {
            console.error('Error uploading boceto:', err)
        } finally {
            setUploading(false)
        }
    }

    // --- Item CRUD ---
    const addItem = () => {
        const item = nuevoItem()
        setItems(prev => [...prev, item])
        setExpandedItem(item._key)
    }

    const removeItem = (key: string) => {
        setItems(prev => prev.filter(i => i._key !== key))
    }

    const updateItem = (key: string, field: keyof FichaItem, value: any) => {
        setItems(prev => prev.map(i => i._key === key ? { ...i, [field]: value } : i))
    }

    const addTalleLine = (itemKey: string) => {
        setItems(prev => prev.map(i =>
            i._key === itemKey ? { ...i, talles: [...i.talles, nuevaLinea()] } : i
        ))
    }

    const removeTalleLine = (itemKey: string, idx: number) => {
        setItems(prev => prev.map(i =>
            i._key === itemKey ? { ...i, talles: i.talles.filter((_, j) => j !== idx) } : i
        ))
    }

    const updateTalleLine = (itemKey: string, idx: number, field: keyof TalleLinea, value: any) => {
        setItems(prev => prev.map(i =>
            i._key === itemKey ? {
                ...i,
                talles: i.talles.map((t, j) => j === idx ? { ...t, [field]: value } : t)
            } : i
        ))
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">{isEdit ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
                            {isEdit && <p className="text-xs text-indigo-400 font-mono mt-1">{pedido.numero_pedido}</p>}
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
                    <div className="modal-body space-y-5">
                        {/* Estado + Número (read-only) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Estado</label>
                                <select className="input" {...register('etapa_id')}>
                                    {etapas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Nº Pedido</label>
                                <input
                                    type="text"
                                    className="input font-mono bg-dark-900/50 cursor-not-allowed opacity-70"
                                    readOnly
                                    {...register('numero_pedido')}
                                />
                            </div>
                        </div>

                        {/* Cliente */}
                        <div>
                            <label className="label">Cliente</label>
                            <select className="input" {...register('cliente_id')}>
                                <option value="">Sin cliente asignado</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.nombre_club ? `- ${c.nombre_club}` : ''}</option>)}
                            </select>
                        </div>

                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Fecha del Pedido</label>
                                <input type="date" className="input" {...register('fecha_pedido')} />
                            </div>
                            <div>
                                <label className="label">Fecha de Entrega</label>
                                <input type="date" className="input" {...register('fecha_entrega')} />
                                {fechaEntrega && (
                                    <span className={`text-[10px] mt-1 font-bold inline-block ${statusColor}`}>{statusLabel}</span>
                                )}
                            </div>
                        </div>

                        {/* Precio / Costo / Ganancia */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="label">Precio Total</label>
                                <div className="flex items-center">
                                    <span className="mr-2 text-white/30 font-bold">$</span>
                                    <input type="number" step="0.01" className="input flex-1" {...register('precio_total', { valueAsNumber: true })} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Costo</label>
                                <div className="flex items-center">
                                    <span className="mr-2 text-white/30 font-bold">$</span>
                                    <input type="number" step="0.01" className="input flex-1" {...register('costo_total', { valueAsNumber: true })} />
                                </div>
                            </div>
                            <div>
                                <label className="label">Ganancia</label>
                                <div className={`text-lg font-bold mt-2 ${ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(ganancia)}
                                </div>
                            </div>
                        </div>

                        {/* Boceto - Upload */}
                        <div>
                            <label className="label">Boceto</label>
                            {bocetoPreview ? (
                                <div className="relative group">
                                    <img
                                        src={bocetoPreview}
                                        alt="Boceto"
                                        className="w-full h-40 object-cover rounded-lg border border-dark-600"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
                                        {isEdit && uploadBoceto && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="btn btn-secondary text-xs"
                                            >
                                                <Upload size={14} /> Cambiar
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setBocetoPreview(null)}
                                            className="btn btn-danger text-xs"
                                        >
                                            <Trash2 size={14} /> Quitar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="border-2 border-dashed border-dark-500 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-dark-800/50 transition-all"
                                    onClick={() => isEdit && uploadBoceto ? fileInputRef.current?.click() : null}
                                >
                                    {uploading ? (
                                        <div className="flex items-center justify-center gap-2 text-white/40">
                                            <Loader2 size={20} className="animate-spin" />
                                            <span className="text-sm">Subiendo...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-white/30">
                                            <ImageIcon size={28} />
                                            <span className="text-sm">
                                                {isEdit && uploadBoceto
                                                    ? 'Clic para subir imagen'
                                                    : 'Guardá el pedido primero para subir bocetos'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {/* Ficha del Pedido */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="label mb-0">Ficha del Pedido</label>
                                <button type="button" onClick={addItem} className="btn btn-secondary text-xs py-1.5 px-3">
                                    <Plus size={14} /> Producto
                                </button>
                            </div>

                            {items.length === 0 ? (
                                <div className="text-center py-6 text-white/20 text-sm border border-dashed border-dark-500 rounded-lg">
                                    Sin productos. Agregá uno para armar la ficha.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map((item) => {
                                        const isExpanded = expandedItem === item._key
                                        return (
                                            <div key={item._key} className="border border-dark-600 rounded-lg overflow-hidden">
                                                {/* Item header */}
                                                <div
                                                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-dark-700/50 transition-colors"
                                                    onClick={() => setExpandedItem(isExpanded ? null : item._key)}
                                                >
                                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                                        <input
                                                            className="input text-sm py-1.5"
                                                            placeholder="Producto"
                                                            value={item.tipo_producto}
                                                            onChange={e => updateItem(item._key, 'tipo_producto', e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                        <input
                                                            className="input text-sm py-1.5"
                                                            placeholder="Descripción"
                                                            value={item.descripcion}
                                                            onChange={e => updateItem(item._key, 'descripcion', e.target.value)}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                className="input text-sm py-1.5 w-20"
                                                                placeholder="Cant"
                                                                value={item.cantidad}
                                                                onChange={e => updateItem(item._key, 'cantidad', parseInt(e.target.value) || 0)}
                                                                onClick={e => e.stopPropagation()}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); removeItem(item._key) }}
                                                                className="text-red-400/50 hover:text-red-400 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                            {isExpanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded: talles/nombres/números */}
                                                {isExpanded && (
                                                    <div className="border-t border-dark-600 p-3 bg-dark-900/30">
                                                        <div className="grid grid-cols-[1fr_60px_60px_1fr_50px_32px] gap-2 text-[11px] text-white/30 uppercase mb-2 px-1">
                                                            <span>Talle</span>
                                                            <span>Cant</span>
                                                            <span>Nº</span>
                                                            <span>Nombre</span>
                                                            <span>Golero</span>
                                                            <span></span>
                                                        </div>
                                                        {item.talles.map((linea, idx) => (
                                                            <div key={idx} className="grid grid-cols-[1fr_60px_60px_1fr_50px_32px] gap-2 mb-2">
                                                                <input
                                                                    className="input text-sm py-1.5"
                                                                    placeholder="S, M, L..."
                                                                    value={linea.talle}
                                                                    onChange={e => updateTalleLine(item._key, idx, 'talle', e.target.value)}
                                                                />
                                                                <input
                                                                    type="number"
                                                                    className="input text-sm py-1.5"
                                                                    value={linea.cantidad}
                                                                    onChange={e => updateTalleLine(item._key, idx, 'cantidad', parseInt(e.target.value) || 0)}
                                                                />
                                                                <input
                                                                    className="input text-sm py-1.5"
                                                                    placeholder="#"
                                                                    value={linea.numero}
                                                                    onChange={e => updateTalleLine(item._key, idx, 'numero', e.target.value)}
                                                                />
                                                                <input
                                                                    className="input text-sm py-1.5"
                                                                    placeholder="Nombre"
                                                                    value={linea.nombre}
                                                                    onChange={e => updateTalleLine(item._key, idx, 'nombre', e.target.value)}
                                                                />
                                                                <div className="flex items-center justify-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={linea.golero}
                                                                        onChange={e => updateTalleLine(item._key, idx, 'golero', e.target.checked)}
                                                                        className="w-4 h-4 accent-emerald-500"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeTalleLine(item._key, idx)}
                                                                    className="text-red-400/30 hover:text-red-400 transition-colors flex items-center justify-center"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => addTalleLine(item._key)}
                                                            className="text-xs text-primary/60 hover:text-primary transition-colors mt-1"
                                                        >
                                                            + Agregar línea
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Notas */}
                        <div>
                            <label className="label">Notas</label>
                            <textarea className="input min-h-[80px] resize-none" placeholder="Detalles de producción..." {...register('notas')} />
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
                                    {isEdit ? 'Actualizar' : 'Crear Pedido'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <ConfirmModal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
                title="¿Eliminar pedido?" description="Esta acción eliminará permanentemente el pedido. No se puede deshacer."
                confirmText="Eliminar" variant="danger" />
        </div>
    )
}
