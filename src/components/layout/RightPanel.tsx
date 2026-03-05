'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers'
import { logoutAction } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    X,
    User,
    Mail,
    Building2,
    Phone,
    Calendar,
    LogOut,
    Target,
    Package,
    Users,
    DollarSign,
    Settings,
    ChevronRight,
    Zap,
    Shield,
    TableProperties
} from 'lucide-react'

interface UserData {
    id: string
    email: string
    nombre_empresa: string | null
    telefono: string | null
    creado_en: string
}

const quickActions = [
    { href: '/leads', icon: Target, label: 'Nuevo Lead', desc: 'Crear prospecto', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)' },
    { href: '/pedidos', icon: Package, label: 'Nuevo Pedido', desc: 'Registrar orden', color: '#818CF8', bg: 'rgba(129,140,248,0.08)' },
    { href: '/clientes', icon: Users, label: 'Nuevo Cliente', desc: 'Agregar contacto', color: '#34D399', bg: 'rgba(52,211,153,0.08)' },
    { href: '/finanzas', icon: DollarSign, label: 'Registrar Gasto', desc: 'Movimiento financiero', color: '#FB923C', bg: 'rgba(251,146,60,0.08)' },
]

const navLinks = [
    { href: '/pedidos-tabla', icon: TableProperties, label: 'Tabla de Pedidos' },
    { href: '/configuracion', icon: Settings, label: 'Configuración' },
]

export function RightPanel() {
    const { userId } = useAuth()
    const router = useRouter()
    const supabase = useRef(createClient()).current
    const [userData, setUserData] = useState<UserData | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const closeTimeout = useRef<NodeJS.Timeout | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!userId) return
        const fetchUser = async () => {
            const { data } = await supabase
                .from('sportex_usuarios')
                .select('id, email, nombre_empresa, telefono, creado_en')
                .eq('id', userId)
                .single()
            if (data) setUserData(data)
        }
        fetchUser()
    }, [userId, supabase])

    const openTimeout = useRef<NodeJS.Timeout | null>(null)

    const openPanel = useCallback(() => {
        if (closeTimeout.current) {
            clearTimeout(closeTimeout.current)
            closeTimeout.current = null
        }
        // Small delay so it doesn't open accidentally
        openTimeout.current = setTimeout(() => {
            setIsOpen(true)
        }, 250)
    }, [])

    const closePanel = useCallback(() => {
        // Cancel pending open
        if (openTimeout.current) {
            clearTimeout(openTimeout.current)
            openTimeout.current = null
        }
        closeTimeout.current = setTimeout(() => {
            setIsOpen(false)
        }, 300)
    }, [])

    const handlePanelEnter = useCallback(() => {
        if (closeTimeout.current) {
            clearTimeout(closeTimeout.current)
            closeTimeout.current = null
        }
        if (openTimeout.current) {
            clearTimeout(openTimeout.current)
            openTimeout.current = null
        }
    }, [])

    const handlePanelLeave = useCallback(() => {
        closeTimeout.current = setTimeout(() => {
            setIsOpen(false)
        }, 200)
    }, [])

    const handleLogout = async () => {
        await logoutAction()
        router.push('/login')
        router.refresh()
    }

    const initials = userData?.nombre_empresa
        ? userData.nombre_empresa.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : userData?.email?.[0]?.toUpperCase() || 'S'

    const memberSince = userData?.creado_en
        ? new Date(userData.creado_en).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
        : ''

    return (
        <>
            {/* Hover trigger zone — wider so it catches before reaching the edge */}
            <div
                className="fixed top-0 right-0 h-full z-40 hide-mobile"
                style={{ width: '40px' }}
                onMouseEnter={openPanel}
                onMouseLeave={closePanel}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`fixed top-0 right-0 h-full z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: 'min(360px, 90vw)' }}
                onMouseEnter={handlePanelEnter}
                onMouseLeave={handlePanelLeave}
            >
                <div
                    className="h-full flex flex-col overflow-hidden"
                    style={{
                        background: 'linear-gradient(180deg, #141728 0%, #0F1320 40%, #0B0E18 100%)',
                        borderLeft: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '-20px 0 60px rgba(0,0,0,0.4)',
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center gap-3">
                            <Shield size={16} className="text-indigo-400" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Mi Cuenta</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* User profile card */}
                    <div className="px-6 py-8">
                        <div
                            className="p-6 rounded-2xl relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(79,70,229,0.06) 100%)',
                                border: '1px solid rgba(99,102,241,0.15)',
                            }}
                        >
                            {/* Decorative glow */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20"
                                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)' }}
                            />

                            <div className="relative flex items-start gap-4">
                                {/* Avatar */}
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                                        boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
                                    }}
                                >
                                    <span className="text-white font-black text-lg">{initials}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-black text-white tracking-tight truncate">
                                        {userData?.nombre_empresa || 'Mi Empresa'}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Mail size={12} className="text-indigo-400 flex-shrink-0" />
                                        <span className="text-xs text-white/40 truncate">{userData?.email || '...'}</span>
                                    </div>
                                    {userData?.telefono && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Phone size={12} className="text-emerald-400 flex-shrink-0" />
                                            <span className="text-xs text-white/40">{userData.telefono}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Member since */}
                            {memberSince && (
                                <div className="relative flex items-center gap-2 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <Calendar size={12} className="text-white/20" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/20">
                                        Miembro desde {memberSince}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="px-6 flex-1 overflow-y-auto">
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-5">
                                <Zap size={14} className="text-amber-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Acciones Rápidas</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {quickActions.map(item => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className="group p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                        style={{
                                            background: item.bg,
                                            border: `1px solid ${item.color}15`,
                                        }}
                                    >
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                                            style={{ background: `${item.color}18` }}
                                        >
                                            <item.icon size={18} style={{ color: item.color }} strokeWidth={2} />
                                        </div>
                                        <p className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">{item.label}</p>
                                        <p className="text-[10px] text-white/25 mt-0.5">{item.desc}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Navigation links */}
                        <div className="mt-8 mb-6">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4 block">Accesos Directos</span>
                            <div className="space-y-1">
                                {navLinks.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <link.icon size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
                                            <span className="text-sm font-medium text-white/40 group-hover:text-white/70 transition-colors">{link.label}</span>
                                        </div>
                                        <ChevronRight size={14} className="text-white/10 group-hover:text-white/30 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Logout */}
                    <div className="px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl hover:bg-red-500/8 transition-all group"
                        >
                            <LogOut size={18} className="text-white/20 group-hover:text-red-400 transition-colors" />
                            <span className="text-sm font-medium text-white/30 group-hover:text-red-400 transition-colors">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
