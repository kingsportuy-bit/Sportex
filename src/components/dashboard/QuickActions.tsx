'use client'

import { useState } from 'react'
import { Plus, Target, Package, Users, DollarSign, X } from 'lucide-react'
import Link from 'next/link'

const actions = [
    { href: '/leads', icon: Target, label: 'Nuevo Lead', color: '#A78BFA' },
    { href: '/pedidos', icon: Package, label: 'Nuevo Pedido', color: '#818CF8' },
    { href: '/clientes', icon: Users, label: 'Nuevo Cliente', color: '#34D399' },
    { href: '/finanzas', icon: DollarSign, label: 'Registrar Gasto', color: '#FB923C' },
]

export function QuickActions() {
    const [open, setOpen] = useState(false)

    return (
        <div
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            {/* Expanded panel */}
            <div
                className={`
                    transition-all duration-300 ease-out overflow-hidden
                    ${open ? 'w-48 opacity-100 mr-0' : 'w-0 opacity-0 mr-0'}
                `}
            >
                <div
                    className="py-3 px-2 rounded-l-2xl border border-r-0 border-white/10 space-y-1"
                    style={{ background: 'rgba(15, 19, 30, 0.95)', backdropFilter: 'blur(20px)' }}
                >
                    {actions.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
                        >
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: `${item.color}15` }}
                            >
                                <item.icon size={16} style={{ color: item.color }} strokeWidth={2.5} />
                            </div>
                            <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors whitespace-nowrap">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Trigger tab */}
            <div
                className={`
                    flex items-center justify-center w-10 h-10 rounded-l-xl cursor-pointer
                    border border-r-0 border-white/10
                    transition-all duration-300
                    ${open ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-dark-800/90 hover:bg-dark-700/90'}
                `}
                style={{ backdropFilter: 'blur(12px)' }}
            >
                {open ? (
                    <X size={16} className="text-indigo-400" />
                ) : (
                    <Plus size={16} className="text-white/60" />
                )}
            </div>
        </div>
    )
}
