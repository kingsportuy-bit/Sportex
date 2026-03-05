'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    Target,
    Package,
    ClipboardList,
    DollarSign,
    Settings,
    LogOut,
    X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth'

const menuItems = [
    { href: '/', icon: LayoutDashboard, label: 'Inicio' },
    { href: '/leads', icon: Target, label: 'Leads' },
    { href: '/pedidos', icon: Package, label: 'Pedidos' },
    { href: '/clientes', icon: Users, label: 'Clientes' },
    { href: '/pedidos-tabla', icon: ClipboardList, label: 'Tabla Pedidos' },
    { href: '/finanzas', icon: DollarSign, label: 'Finanzas' },
    { href: '/configuracion', icon: Settings, label: 'Configuración' },
]

interface MobileNavProps {
    isOpen: boolean
    onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await logoutAction()
        router.push('/login')
        router.refresh()
        onClose()
    }

    if (!isOpen) return null

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-50 hide-desktop animate-fadeIn"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* Menu */}
            <div
                className="fixed left-0 top-0 bottom-0 w-[280px] z-50 hide-desktop animate-slideIn"
                style={{
                    background: 'linear-gradient(180deg, #13152A 0%, #0D0F1A 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <Link href="/" className="flex items-center gap-2" onClick={onClose}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
                            <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <span className="font-bold text-xl text-white">SPORTEX</span>
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Menu items */}
                <nav className="p-3 pt-4">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                                        style={isActive ? {
                                            background: 'rgba(99, 102, 241, 0.12)',
                                            color: '#818CF8',
                                        } : {
                                            color: 'rgba(255,255,255,0.45)',
                                        }}
                                    >
                                        <Icon size={26} strokeWidth={isActive ? 2.5 : 1.5} />
                                        <span className={`${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>

                    {/* Divider */}
                    <div className="my-4" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#F87171' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
                    >
                        <LogOut size={22} />
                        <span className="font-medium">Cerrar sesión</span>
                    </button>
                </nav>
            </div>
        </>
    )
}
