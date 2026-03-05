'use client'

import { useTransacciones } from '@/hooks/useTransacciones'
import { useState } from 'react'
import {
    Loader2,
    Plus,
    TrendingUp,
    TrendingDown,
    Wallet,
    Trash2,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TransaccionModal } from '@/components/finances/TransaccionModal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'

export default function FinanzasPage() {
    const { transacciones, stats, loading, crearTransaccion, eliminarTransaccion } = useTransacciones()
    const [modalOpen, setModalOpen] = useState(false)
    const [filter, setFilter] = useState<'all' | 'ingreso' | 'egreso'>('all')
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const filteredTransacciones = filter === 'all'
        ? transacciones
        : transacciones.filter(t => t.tipo === filter)

    const handleSave = async (data: any) => {
        await crearTransaccion(data)
        setModalOpen(false)
    }

    const handleDelete = async (id: string) => {
        await eliminarTransaccion(id)
        setConfirmDeleteId(null)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-indigo-400 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest opacity-20">Analizando balances...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Gestión Financiera</h1>
                    <p className="text-xs mt-1 font-medium uppercase tracking-widest opacity-40">Control de flujo de caja y rentabilidad</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="btn btn-primary group">
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    <span className="hidden md:inline">Nueva Transacción</span>
                </button>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 relative overflow-hidden group border-white/5 shadow-xl"
                    style={{ background: 'rgba(16,185,129,0.02)', borderColor: 'rgba(16,185,129,0.1)' }}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={80} className="text-emerald-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <TrendingUp size={20} className="text-emerald-400" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Ingresos del Mes</p>
                        </div>
                        <p className="text-3xl font-black text-emerald-400 tracking-tighter">{formatCurrency(stats.ingresosMes)}</p>
                    </div>
                </div>

                <div className="card p-6 relative overflow-hidden group border-white/5 shadow-xl"
                    style={{ background: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.1)' }}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingDown size={80} className="text-red-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <TrendingDown size={20} className="text-red-400" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Egresos del Mes</p>
                        </div>
                        <p className="text-3xl font-black text-red-400 tracking-tighter">{formatCurrency(stats.egresosMes)}</p>
                    </div>
                </div>

                <div className="card p-6 relative overflow-hidden group border-white/5 shadow-2xl"
                    style={{
                        background: stats.gananciaMes >= 0
                            ? 'rgba(99,102,241,0.02)'
                            : 'rgba(239,68,68,0.02)',
                        borderColor: stats.gananciaMes >= 0 ? 'rgba(99,102,241,0.1)' : 'rgba(239,68,68,0.1)'
                    }}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wallet size={80} className={stats.gananciaMes >= 0 ? 'text-primary' : 'text-red-400'} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
                                style={{ background: stats.gananciaMes >= 0 ? 'rgba(99,102,241,0.1)' : 'rgba(239,68,68,0.1)' }}>
                                <Wallet size={20} className={stats.gananciaMes >= 0 ? 'text-primary' : 'text-red-400'} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Ganancia Neta Total</p>
                        </div>
                        <p className={`text-3xl font-black tracking-tighter ${stats.gananciaMes >= 0 ? 'text-white' : 'text-red-400'}`}>
                            {formatCurrency(stats.gananciaMes)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Transactions table */}
            <div className="card p-0 border-white/5 shadow-2xl overflow-hidden relative" style={{ background: 'transparent' }}>
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-transparent">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight">Historial de Transacciones</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mt-1">Movimientos recientes</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { key: 'all', label: 'Todos' },
                            { key: 'ingreso', label: 'Ingresos' },
                            { key: 'egreso', label: 'Egresos' },
                        ].map(item => (
                            <button key={item.key}
                                onClick={() => setFilter(item.key as typeof filter)}
                                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all border ${filter === item.key
                                    ? 'bg-primary/20 text-primary border-primary/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr className="bg-white/[0.02]">
                                <th className="py-4 px-6">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Tipo</span>
                                </th>
                                <th className="py-4 px-6">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Categoría</span>
                                </th>
                                <th className="py-4 px-6">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Descripción</span>
                                </th>
                                <th className="py-4 px-6">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Fecha</span>
                                </th>
                                <th className="py-6 px-10 text-right">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Monto</span>
                                </th>
                                <th className="py-4 px-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {filteredTransacciones.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-24">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                            <Wallet size={24} className="opacity-10" />
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Sin movimientos registrados</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransacciones.map(t => (
                                    <tr key={t.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${t.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                                } border border-white/5 shadow-lg`}>
                                                {t.tipo === 'ingreso' ? '↑ Ingreso' : '↓ Egreso'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-white text-sm">{t.categoria || 'Varias'}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-slate-500 truncate max-w-[200px]">{t.descripcion || '-'}</td>
                                        <td className="py-4 px-6 text-xs font-bold text-slate-600 uppercase tracking-widest">{formatDate(t.fecha_transaccion)}</td>
                                        <td className={`py-6 px-10 text-right font-black tracking-tighter text-lg ${t.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(Number(t.monto))}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button onClick={() => setConfirmDeleteId(t.id)}
                                                className="p-2.5 rounded-full bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {modalOpen && (
                <TransaccionModal
                    onClose={() => setModalOpen(false)}
                    onSave={handleSave}
                />
            )}

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                title="¿Eliminar transacción?"
                description="Esta acción eliminará permanentemente la transacción de tus registros financieros y afectará los balances del mes."
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    )
}
