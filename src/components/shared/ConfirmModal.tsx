'use client'

import { X, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'primary'
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}: ConfirmModalProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted || !isOpen) return null

    const colors = {
        danger: {
            bg: 'rgba(239, 68, 68, 0.1)',
            icon: 'text-red-400',
            button: 'bg-red-500 hover:bg-red-600 shadow-[0_4px_12px_rgba(239,64,64,0.3)]',
        },
        warning: {
            bg: 'rgba(245, 158, 11, 0.1)',
            icon: 'text-amber-400',
            button: 'bg-amber-500 hover:bg-amber-600 shadow-[0_4px_12px_rgba(245,158,11,0.3)]',
        },
        primary: {
            bg: 'rgba(99, 102, 241, 0.1)',
            icon: 'text-primary',
            button: 'bg-primary hover:bg-primary-dark shadow-[0_4px_12px_rgba(99,102,241,0.3)]',
        }
    }

    const currentColors = colors[variant]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <div
                className="modal-content w-full max-w-md animate-scaleIn relative overflow-hidden"
                style={{
                    boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                }}
            >
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                <div className="modal-body p-14 relative z-10">
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-24 h-24 rounded-full ${currentColors.bg} flex items-center justify-center mb-10`}>
                            <AlertTriangle size={44} className={currentColors.icon} />
                        </div>

                        <h2 className="text-3xl font-black text-white tracking-tight mb-5">{title}</h2>
                        <p className="text-sm font-medium leading-relaxed opacity-40 mb-12 max-w-[320px]">
                            {description}
                        </p>

                        <div className="flex gap-4 w-full">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-black uppercase tracking-widest text-[10px] transition-all border border-white/5"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm()
                                    onClose()
                                }}
                                className={`flex-1 py-4.5 rounded-2xl ${currentColors.button} text-white font-black uppercase tracking-widest text-[10px] transition-all`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-slate-500 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    )
}
