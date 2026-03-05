'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Home,
    Target,
    Package,
    Users,
    Wallet,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Database
} from 'lucide-react'
import { useSidebar } from '@/components/providers/SidebarContext'
import { logoutAction } from '@/app/actions/auth'

const menuItems = [
    { href: '/', icon: Home, label: 'Inicio', color: 'from-blue-500 to-cyan-500' },
    { href: '/leads', icon: Target, label: 'Prospectos', color: 'from-purple-500 to-pink-500' },
    { href: '/pedidos', icon: Package, label: 'Pedidos', color: 'from-indigo-500 to-blue-500' },
    { href: '/clientes', icon: Users, label: 'Clientes', color: 'from-emerald-500 to-teal-500' },
    { href: '/finanzas', icon: Wallet, label: 'Finanzas', color: 'from-amber-500 to-orange-500' },
    { href: '/configuracion', icon: Settings, label: 'Configuración', color: 'from-slate-500 to-gray-500' },
]

export function Sidebar() {
    const pathname = usePathname()
    const { collapsed, toggleCollapsed } = useSidebar()
    const router = useRouter()

    const handleLogout = async () => {
        await logoutAction()
        router.push('/login')
        router.refresh()
    }

    return (
        <aside className={`
            h-screen sticky top-0 z-50 hide-mobile transition-all duration-500 ease-out
            flex flex-col
            bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900
            border-r border-dark-700/30
            shadow-xl
            ${collapsed ? 'w-20' : 'w-72'}
        `}>

            {/* Brand Header */}
            <div className="px-6 py-5 border-b border-dark-700/20 bg-gradient-to-r from-dark-800/20 to-transparent">
                <div className="flex items-center justify-between">

                    {/* Logo & Brand */}
                    <div className={`flex items-center gap-4 transition-all duration-500 ${collapsed ? 'opacity-0 scale-0 w-0' : 'opacity-100 scale-100'}`}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md">
                            <span className="text-white font-black text-lg">S</span>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-xl font-bold text-dark-100">SPORTEX</h1>
                            <p className="text-xs font-semibold uppercase tracking-wider text-dark-300">Panel de Control</p>
                        </div>
                    </div>

                    {/* Collapsed Logo */}
                    {collapsed && (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto">
                            <span className="text-white font-black text-lg">S</span>
                        </div>
                    )}

                    {/* Collapse Toggle */}
                    <button
                        onClick={toggleCollapsed}
                        className="p-1.5 rounded-lg hover:bg-dark-700/40 transition-all duration-300 group border border-dark-700/20"
                    >
                        <div className="p-1 rounded-md group-hover:bg-dark-600/40 transition-all duration-300">
                            {collapsed ?
                                <ChevronRight size={16} className="text-dark-300 group-hover:text-blue-400" /> :
                                <ChevronLeft size={16} className="text-dark-300 group-hover:text-blue-400" />
                            }
                        </div>
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-transparent">
                <div className="space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative
                                    ${collapsed ? 'justify-center' : ''}
                                    ${isActive
                                        ? 'bg-dark-700/50'
                                        : 'hover:bg-dark-700/30'}
                                `}
                            >
                                {/* Icon */}
                                <Icon
                                    size={20}
                                    className={`transition-all duration-300 ${isActive ? 'text-white' : 'text-dark-200 group-hover:text-white'}`}
                                    strokeWidth={2}
                                />

                                {/* Label */}
                                {!collapsed && (
                                    <span className={`text-base font-medium transition-all duration-300 ${isActive ? 'text-white' : 'text-dark-200 group-hover:text-white'}`}>
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* User Section */}
            <div className="px-4 py-5 border-t border-dark-700/20 bg-gradient-to-r from-dark-800/10 to-transparent">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 w-full px-4 py-4 rounded-xl transition-all duration-300 hover:bg-red-500/10 group"
                    title={collapsed ? 'Cerrar sesión' : undefined}
                >
                    <LogOut
                        size={20}
                        className="text-dark-200 group-hover:text-red-400 transition-colors"
                        strokeWidth={2}
                    />

                    {!collapsed && (
                        <div className="text-left">
                            <p className="text-base font-medium text-dark-200 group-hover:text-red-400">Cerrar Sesión</p>
                        </div>
                    )}
                </button>
            </div>
        </aside>
    )
}