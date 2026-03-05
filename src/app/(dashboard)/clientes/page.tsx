'use client'

import { useClientes } from '@/hooks/useClientes'
import { useState } from 'react'
import {
    Loader2,
    Plus,
    Search,
    Mail,
    Phone,
    MapPin,
    Pencil,
    Trash2,
    Users
} from 'lucide-react'
import type { Cliente } from '@/types/database'
import { ClienteModal } from '@/components/clients/ClienteModal'
import { ConfirmModal } from '@/components/shared/ConfirmModal'

export default function ClientesPage() {
    const { clientes, loading, crearCliente, actualizarCliente, eliminarCliente } = useClientes()
    const [search, setSearch] = useState('')
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const filteredClientes = clientes.filter(c =>
        c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        c.nombre_club?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    )

    const openModal = (cliente?: Cliente) => {
        setSelectedCliente(cliente || null)
        setModalOpen(true)
    }

    const handleSave = async (data: Partial<Cliente>) => {
        if (selectedCliente) {
            await actualizarCliente(selectedCliente.id, data)
        } else {
            await crearCliente(data)
        }
        setModalOpen(false)
        setSelectedCliente(null)
    }

    const handleDelete = async (id: string) => {
        setConfirmDeleteId(id)
    }

    const handleDeleteConfirm = async () => {
        if (confirmDeleteId) {
            await eliminarCliente(confirmDeleteId)
            setConfirmDeleteId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-indigo-400 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest opacity-20">Sincronizando clientes...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Clientes</h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>{clientes.length} clientes registrados</p>
                </div>
                <button onClick={() => openModal()} className="btn btn-primary">
                    <Plus size={18} />
                    <span className="hidden md:inline">Nuevo Cliente</span>
                </button>
            </div>

            {/* Search */}
            <div className="card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl"
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Search size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, club o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white"
                        style={{ color: 'var(--color-text)' }}
                    />
                </div>
            </div>

            {/* Clients grid */}
            {filteredClientes.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8">
                        <Users size={48} className="opacity-10" />
                    </div>
                    <p className="text-xl font-black text-white mb-2 tracking-tight">Sin resultados</p>
                    <p className="text-sm font-medium uppercase tracking-[0.1em] opacity-60">No se encontraron clientes con esa búsqueda</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClientes.map(cliente => (
                        <div key={cliente.id} className="card card-hover hover:-translate-y-2 transition-all p-6 group" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-primary transition-colors">{cliente.nombre}</h3>
                                    {cliente.nombre_club && (
                                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mt-1">{cliente.nombre_club}</p>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openModal(cliente)}
                                        className="p-2.5 rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary text-slate-400 transition-all"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cliente.id)}
                                        className="p-2.5 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {cliente.email && (
                                    <a href={`mailto:${cliente.email}`} className="flex items-center gap-4 text-sm font-medium text-slate-500 hover:text-primary transition-all">
                                        <div className="p-2 bg-white/5 rounded-lg">
                                            <Mail size={16} />
                                        </div>
                                        {cliente.email}
                                    </a>
                                )}
                                {cliente.telefono && (
                                    <a href={`tel:${cliente.telefono}`} className="flex items-center gap-4 text-sm font-medium text-slate-500 hover:text-emerald-400 transition-all">
                                        <div className="p-2 bg-white/5 rounded-lg">
                                            <Phone size={16} />
                                        </div>
                                        {cliente.telefono}
                                    </a>
                                )}
                                {cliente.direccion && (
                                    <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                                        <div className="p-2 bg-white/5 rounded-lg">
                                            <MapPin size={16} />
                                        </div>
                                        {cliente.direccion}
                                    </div>
                                )}
                            </div>

                            {cliente.notas && (
                                <div className="mt-5 pt-5 border-t border-white/5">
                                    <p className="text-xs font-medium text-slate-500 italic line-clamp-2">
                                        "{cliente.notas}"
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <ClienteModal
                    cliente={selectedCliente}
                    onClose={() => { setModalOpen(false); setSelectedCliente(null) }}
                    onSave={handleSave}
                    onDelete={async () => { if (selectedCliente) setConfirmDeleteId(selectedCliente.id) }}
                />
            )}
            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title="¿Eliminar cliente?"
                description="Esta acción eliminará permanentemente al cliente y todos sus datos asociados. No se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    )
}
