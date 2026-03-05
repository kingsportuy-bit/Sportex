'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react'
import { ConfirmModal } from './ConfirmModal'

interface Stage {
    id: string
    nombre: string
    color: string
}

interface StageManagerProps {
    isOpen: boolean
    onClose: () => void
    stages: Stage[]
    onAdd: (stage: { nombre: string; color: string }) => Promise<void>
    onUpdate: (id: string, updates: { nombre?: string; color?: string }) => Promise<void>
    onDelete: (id: string) => Promise<void>
    title: string
}

const COLORS = [
    '#6366F1', '#3B82F6', '#F59E0B', '#8B5CF6',
    '#10B981', '#EF4444', '#EC4899', '#14B8A6',
    '#F97316', '#06B6D4',
]

export function StageManager({
    isOpen,
    onClose,
    stages,
    onAdd,
    onUpdate,
    onDelete,
    title
}: StageManagerProps) {
    const [newStageName, setNewStageName] = useState('')
    const [newStageColor, setNewStageColor] = useState(COLORS[0])
    const [editingStageId, setEditingStageId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editColor, setEditColor] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    if (!isOpen) return null

    const handleAdd = async () => {
        if (!newStageName.trim()) return
        setIsSubmitting(true)
        setError(null)
        try {
            await onAdd({ nombre: newStageName, color: newStageColor })
            setNewStageName('')
            setNewStageColor(COLORS[0])
        } catch (err) {
            console.error('Error adding stage:', err)
            setError('Error al crear la etapa.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const startEditing = (stage: Stage) => {
        setEditingStageId(stage.id)
        setEditName(stage.nombre)
        setEditColor(stage.color)
        setError(null)
    }

    const cancelEditing = () => {
        setEditingStageId(null)
        setEditName('')
        setEditColor('')
        setError(null)
    }

    const handleUpdate = async () => {
        if (!editingStageId || !editName.trim()) return
        setIsSubmitting(true)
        setError(null)
        try {
            await onUpdate(editingStageId, { nombre: editName, color: editColor })
            setEditingStageId(null)
        } catch (err) {
            console.error('Error updating stage:', err)
            setError('Error al actualizar la etapa.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteConfirm = async () => {
        if (!confirmDeleteId) return
        setIsSubmitting(true)
        setError(null)
        try {
            await onDelete(confirmDeleteId)
            setConfirmDeleteId(null)
        } catch (err) {
            console.error('Error deleting stage:', err)
            setError('Error al eliminar la etapa.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div
                className="w-full max-w-lg animate-scaleIn relative overflow-hidden"
                style={{
                    background: 'linear-gradient(135deg, #1A1F2E 0%, #151828 100%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-1">Configuración del pipeline</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-full transition-all hover:bg-white/5 text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-10 space-y-10">
                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs font-bold uppercase tracking-widest">
                            {error}
                        </div>
                    )}

                    {/* Stage List */}
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {(stages || []).map((stage) => (
                            <div
                                key={stage.id}
                                className="flex items-center gap-4 p-4 rounded-2xl transition-all group"
                                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                            >
                                {editingStageId === stage.id ? (
                                    <>
                                        <div className="flex-1 space-y-4">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="input"
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                            />
                                            <div className="flex gap-2 flex-wrap">
                                                {COLORS.map((c) => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setEditColor(c)}
                                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${editColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleUpdate}
                                                disabled={isSubmitting}
                                                className="p-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all shadow-lg"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={cancelEditing}
                                                className="p-3 bg-white/5 text-slate-500 hover:bg-white/10 rounded-xl transition-all"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: stage.color, boxShadow: `0 0 15px ${stage.color}60` }}
                                        />
                                        <span className="flex-1 text-white font-black text-sm tracking-tight">{stage.nombre}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditing(stage)}
                                                className="p-2.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDeleteId(stage.id)}
                                                disabled={isSubmitting}
                                                className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add New Section */}
                    <div className="pt-8 border-t border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-6">Nueva Etapa</p>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Nombre de la categoría..."
                                    value={newStageName}
                                    onChange={(e) => setNewStageName(e.target.value)}
                                    className="input flex-1"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                />
                                <button
                                    onClick={handleAdd}
                                    disabled={!newStageName.trim() || isSubmitting}
                                    className="btn btn-primary px-5 shadow-xl"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setNewStageColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 shadow-lg ${newStageColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <ConfirmModal
                    isOpen={!!confirmDeleteId}
                    onClose={() => setConfirmDeleteId(null)}
                    onConfirm={handleDeleteConfirm}
                    title="¿Eliminar etapa?"
                    description="Al eliminar esta etapa podrías afectar a los elementos que dependen de ella. Esta acción no se puede deshacer."
                    confirmText="Eliminar permanentemente"
                    variant="danger"
                />
            </div>
        </div>
    )
}
