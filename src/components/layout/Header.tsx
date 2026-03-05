'use client'

import { Bell, Search, Menu, User } from 'lucide-react'
import { useState } from 'react'
import { MobileNav } from './MobileNav'

interface HeaderProps {
    title?: string
    subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    return (
        <>
            <header className="h-20 flex items-center justify-between px-6 sm:px-8 md:px-12 sticky top-0 z-30 bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 border-b border-dark-700/30 shadow-md">
                {/* Mobile menu button */}
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-3 rounded-xl hide-desktop transition-all duration-300 hover:bg-dark-700/40 border border-dark-700/20 group"
                >
                    <Menu size={22} className="text-dark-300 group-hover:text-dark-100 transition-colors" />
                </button>

                {/* Title - Desktop */}
                <div className="hide-mobile flex-1 ml-8">
                    {title && (
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-dark-100 tracking-tight">{title}</h1>
                            {subtitle && (
                                <p className="text-sm text-dark-200 font-medium">{subtitle}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile logo */}
                <div className="hide-desktop flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                        <span className="text-white font-black text-lg">S</span>
                    </div>
                    <span className="font-black text-xl text-dark-100 tracking-tight">SPORTEX</span>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className={`
                        ${searchOpen ? 'flex' : 'hidden md:flex'}
                        items-center rounded-xl px-4 py-3 gap-3
                        bg-dark-800/40 border border-dark-700/30
                        transition-all duration-300
                    `}>
                        <Search size={18} className="text-dark-200" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            className="bg-transparent border-none outline-none text-base w-48 lg:w-72 text-dark-100 placeholder:text-dark-300"
                        />
                    </div>

                    {/* Search toggle mobile */}
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="p-3 rounded-xl hide-desktop transition-all duration-300 hover:bg-dark-700/40 border border-dark-700/20 group"
                    >
                        <Search size={22} className="text-dark-200 group-hover:text-dark-100 transition-colors" />
                    </button>

                    {/* Notifications */}
                    <button className="p-3 rounded-xl relative transition-all duration-300 hover:bg-dark-700/40 border border-dark-700/20 group">
                        <Bell size={22} className="text-dark-200 group-hover:text-dark-100 transition-colors" />
                        <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500"></span>
                    </button>

                    {/* User avatar */}
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                        <User size={18} />
                    </div>
                </div>
            </header>

            {/* Mobile navigation */}
            <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        </>
    )
}