'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { loginAction } from '@/app/actions/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Lock, Mail, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña requerida'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginForm) => {
        setLoading(true)
        setError(null)
        try {
            const result = await loginAction(data.email, data.password)
            if (result.success) {
                router.push('/')
                router.refresh()
            } else {
                setError(result.error || 'Error desconocido')
            }
        } catch (err: any) {
            setError('Error de conexión con el servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0B0D1A 0%, #13152A 50%, #0D0F1A 100%)' }}
        >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
                <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                        style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 8px 30px rgba(99,102,241,0.35)' }}>
                        <span className="text-white font-black text-2xl">S</span>
                    </div>
                    <h1 className="text-4xl font-black mb-2 gradient-text">SPORTEX</h1>
                    <p className="text-sm font-medium tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        El éxito se diseña
                    </p>
                </div>

                <div className="card p-8" style={{ background: 'rgba(30,33,50,0.8)', backdropFilter: 'blur(20px)' }}>
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Bienvenido de nuevo</h2>

                    {error && (
                        <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                            <p className="text-sm font-medium text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="label">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    type="email"
                                    className={`input input-icon ${errors.email ? 'border-red-500' : ''}`}
                                    placeholder="ejemplo@correo.com"
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="label">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    type="password"
                                    className={`input input-icon ${errors.password ? 'border-red-500' : ''}`}
                                    placeholder="••••••••"
                                    {...register('password')}
                                />
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3 h-auto text-base font-bold"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        ¿No tenés una cuenta?{' '}
                        <Link href="/register" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                            Registrate gratis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
