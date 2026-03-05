'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/components/providers'
import type { Cliente } from '@/types/database'

export function useClientes() {
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { userId } = useAuth()
    const supabase = useRef(createClient()).current
    const initialized = useRef(false)

    const fetchClientes = useCallback(async () => {
        if (!userId) return
        try {
            const { data, error: fetchError } = await supabase
                .from('sportex_clientes')
                .select('*')
                .eq('usuario_id', userId)
                .order('nombre')

            if (fetchError) throw fetchError
            setClientes((data || []) as Cliente[])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setLoading(false)
        }
    }, [supabase, userId])

    const crearCliente = async (cliente: Partial<Cliente>) => {
        if (!userId) throw new Error('No hay sesión')
        const { data, error } = await supabase
            .from('sportex_clientes')
            .insert({ ...cliente, usuario_id: userId })
            .select('*')
            .single()

        if (error) throw error
        if (data) setClientes(prev => [...prev, data as Cliente].sort((a, b) => a.nombre.localeCompare(b.nombre)))
        return data
    }

    const actualizarCliente = async (id: string, updates: Partial<Cliente>) => {
        setClientes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))

        const { error } = await supabase
            .from('sportex_clientes')
            .update(updates)
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchClientes()
            throw error
        }
    }

    const eliminarCliente = async (id: string) => {
        setClientes(prev => prev.filter(c => c.id !== id))

        const { error } = await supabase
            .from('sportex_clientes')
            .delete()
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchClientes()
            throw error
        }
    }

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
            fetchClientes()
        }
    }, [fetchClientes])

    return {
        clientes,
        loading,
        error,
        crearCliente,
        actualizarCliente,
        eliminarCliente,
        refetch: fetchClientes,
    }
}
