'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/components/providers'
import type { Transaccion } from '@/types/database'

interface TransaccionesStats {
    ingresosMes: number
    egresosMes: number
    gananciaMes: number
}

function calcStats(data: Transaccion[]): TransaccionesStats {
    const ingresos = data
        .filter(t => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + Number(t.monto), 0)
    const egresos = data
        .filter(t => t.tipo === 'egreso')
        .reduce((sum, t) => sum + Number(t.monto), 0)
    return {
        ingresosMes: ingresos,
        egresosMes: egresos,
        gananciaMes: ingresos - egresos,
    }
}

export function useTransacciones() {
    const [transacciones, setTransacciones] = useState<Transaccion[]>([])
    const [stats, setStats] = useState<TransaccionesStats>({
        ingresosMes: 0,
        egresosMes: 0,
        gananciaMes: 0,
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { userId } = useAuth()
    const supabase = useRef(createClient()).current
    const initialized = useRef(false)

    const fetchTransacciones = useCallback(async () => {
        if (!userId) return
        try {
            const now = new Date()
            const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

            const { data, error: fetchError } = await supabase
                .from('sportex_transacciones')
                .select('*')
                .eq('usuario_id', userId)
                .gte('fecha_transaccion', inicioMes.split('T')[0])
                .lte('fecha_transaccion', finMes.split('T')[0])
                .order('fecha_transaccion', { ascending: false })

            if (fetchError) throw fetchError

            const items = data || []
            setTransacciones(items)
            setStats(calcStats(items))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setLoading(false)
        }
    }, [supabase, userId])

    const crearTransaccion = async (transaccion: Partial<Transaccion>) => {
        if (!userId) throw new Error('No hay sesión')
        const { data, error } = await supabase
            .from('sportex_transacciones')
            .insert({ ...transaccion, usuario_id: userId })
            .select()
            .single()

        if (error) throw error
        if (data) {
            setTransacciones(prev => {
                const updated = [data, ...prev]
                setStats(calcStats(updated))
                return updated
            })
        }
        return data
    }

    const actualizarTransaccion = async (id: string, updates: Partial<Transaccion>) => {
        // Optimistic update
        setTransacciones(prev => {
            const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t)
            setStats(calcStats(updated))
            return updated
        })

        const { error } = await supabase
            .from('sportex_transacciones')
            .update(updates)
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchTransacciones()
            throw error
        }
    }

    const eliminarTransaccion = async (id: string) => {
        // Optimistic delete
        setTransacciones(prev => {
            const updated = prev.filter(t => t.id !== id)
            setStats(calcStats(updated))
            return updated
        })

        const { error } = await supabase
            .from('sportex_transacciones')
            .delete()
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchTransacciones()
            throw error
        }
    }

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
            fetchTransacciones()
        }
    }, [fetchTransacciones])

    return {
        transacciones,
        stats,
        loading,
        error,
        crearTransaccion,
        actualizarTransaccion,
        eliminarTransaccion,
        refetch: fetchTransacciones,
    }
}
