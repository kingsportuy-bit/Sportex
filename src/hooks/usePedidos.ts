'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@/components/providers'
import type { Pedido, PedidoConRelaciones, EtapaPedido } from '@/types/database'

export function usePedidos() {
    const [pedidos, setPedidos] = useState<PedidoConRelaciones[]>([])
    const [etapas, setEtapas] = useState<EtapaPedido[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { userId } = useAuth()
    const supabase = useRef(createClient()).current
    const initialized = useRef(false)

    const fetchPedidos = useCallback(async () => {
        if (!userId) return
        try {
            const { data: etapasData, error: etapasError } = await supabase
                .from('sportex_etapas_pedidos')
                .select('*')
                .eq('activo', true)
                .eq('usuario_id', userId)
                .order('orden')

            if (etapasError) throw etapasError

            // Auto-initialize default stages if none exist
            if (!etapasData || etapasData.length === 0) {
                const defaultStages = [
                    { usuario_id: userId, nombre: 'Nuevo', color: '#6366F1', orden: 0 },
                    { usuario_id: userId, nombre: 'En Diseño', color: '#3B82F6', orden: 1 },
                    { usuario_id: userId, nombre: 'En Producción', color: '#F59E0B', orden: 2 },
                    { usuario_id: userId, nombre: 'Control de Calidad', color: '#8B5CF6', orden: 3 },
                    { usuario_id: userId, nombre: 'Listo para Entregar', color: '#10B981', orden: 4 },
                    { usuario_id: userId, nombre: 'Entregado', color: '#059669', orden: 5 },
                ]

                const { error: insertError } = await supabase
                    .from('sportex_etapas_pedidos')
                    .insert(defaultStages)

                if (insertError) throw insertError

                const { data: newEtapas } = await supabase
                    .from('sportex_etapas_pedidos')
                    .select('*')
                    .eq('activo', true)
                    .eq('usuario_id', userId)
                    .order('orden')

                // Deduplicate stages by name (keep first occurrence)
                const seen = new Set<string>()
                const uniqueEtapas = (newEtapas || []).filter(e => {
                    if (seen.has(e.nombre)) return false
                    seen.add(e.nombre)
                    return true
                })
                setEtapas(uniqueEtapas)
            } else {
                // Deduplicate stages by name (keep first occurrence)
                const seen = new Set<string>()
                const uniqueEtapas = etapasData.filter(e => {
                    if (seen.has(e.nombre)) return false
                    seen.add(e.nombre)
                    return true
                })
                setEtapas(uniqueEtapas)
            }

            const { data: pedidosData, error: pedidosError } = await supabase
                .from('sportex_pedidos')
                .select(`
                    *,
                    cliente:sportex_clientes(id, nombre, nombre_club),
                    etapa:sportex_etapas_pedidos(id, nombre, color)
                `)
                .eq('usuario_id', userId)
                .order('fecha_entrega', { ascending: true })

            if (pedidosError) throw pedidosError
            setPedidos(pedidosData || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setLoading(false)
        }
    }, [supabase, userId])

    // ---- Optimistic CRUD ----

    const crearPedido = async (pedido: Partial<Pedido>) => {
        if (!userId) throw new Error('No hay sesión')
        const { data, error } = await supabase
            .from('sportex_pedidos')
            .insert({ ...pedido, usuario_id: userId })
            .select(`*, cliente:sportex_clientes(id, nombre, nombre_club), etapa:sportex_etapas_pedidos(id, nombre, color)`)
            .single()

        if (error) throw error
        if (data) setPedidos(prev => [...prev, data])
        return data
    }

    const actualizarPedido = async (id: string, updates: Partial<Pedido>) => {
        // Optimistic update
        setPedidos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))

        const { error } = await supabase
            .from('sportex_pedidos')
            .update(updates)
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchPedidos()
            throw error
        }
    }

    const moverPedido = async (pedidoId: string, nuevaEtapaId: string, nuevoOrden: number) => {
        if (!userId) return
        const pedidoActual = pedidos.find(p => p.id === pedidoId)

        // Optimistic: update etapa_id locally
        const targetEtapa = etapas.find(e => e.id === nuevaEtapaId)
        setPedidos(prev => prev.map(p =>
            p.id === pedidoId
                ? {
                    ...p,
                    etapa_id: nuevaEtapaId,
                    orden_en_etapa: nuevoOrden,
                    etapa: targetEtapa || p.etapa,
                }
                : p
        ) as PedidoConRelaciones[])

        const { error } = await supabase
            .from('sportex_pedidos')
            .update({ etapa_id: nuevaEtapaId, orden_en_etapa: nuevoOrden })
            .eq('id', pedidoId)
            .eq('usuario_id', userId)

        if (error) {
            await fetchPedidos()
            throw error
        }

        // Record history if stage changed
        if (pedidoActual && pedidoActual.etapa_id !== nuevaEtapaId) {
            await supabase
                .from('sportex_pedidos_historial')
                .insert({
                    pedido_id: pedidoId,
                    etapa_anterior_id: pedidoActual.etapa_id,
                    etapa_nueva_id: nuevaEtapaId,
                })
        }
    }

    const eliminarPedido = async (id: string) => {
        // Optimistic: remove immediately
        setPedidos(prev => prev.filter(p => p.id !== id))

        const { error } = await supabase
            .from('sportex_pedidos')
            .delete()
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchPedidos()
            throw error
        }
    }

    // ---- Stage CRUD (optimistic) ----

    const crearEtapa = async (etapa: Partial<EtapaPedido>) => {
        if (!userId) throw new Error('No hay sesión')
        const { data, error } = await supabase
            .from('sportex_etapas_pedidos')
            .insert({ ...etapa, usuario_id: userId, orden: etapas.length })
            .select()
            .single()

        if (error) throw error
        if (data) setEtapas(prev => [...prev, data])
    }

    const actualizarEtapa = async (id: string, updates: Partial<EtapaPedido>) => {
        setEtapas(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))

        const { error } = await supabase
            .from('sportex_etapas_pedidos')
            .update(updates)
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchPedidos()
            throw error
        }
    }

    const eliminarEtapa = async (id: string) => {
        setEtapas(prev => prev.filter(e => e.id !== id))

        const { error } = await supabase
            .from('sportex_etapas_pedidos')
            .delete()
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchPedidos()
            throw error
        }
    }

    const uploadBoceto = async (pedidoId: string, file: File) => {
        if (!userId) throw new Error('No hay sesión')
        const ext = file.name.split('.').pop()
        const filePath = `${userId}/${pedidoId}/boceto_${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
            .from('bocetos')
            .upload(filePath, file, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('bocetos')
            .getPublicUrl(filePath)

        await actualizarPedido(pedidoId, { boceto_url: publicUrl } as any)
        return publicUrl
    }

    const obtenerItems = async (pedidoId: string) => {
        const { data, error } = await supabase
            .from('sportex_pedidos_items')
            .select('*')
            .eq('pedido_id', pedidoId)
            .order('creado_en')

        if (error) throw error
        return data || []
    }

    const guardarItems = async (pedidoId: string, items: Array<{
        id?: string
        tipo_producto: string
        descripcion?: string
        cantidad: number
        precio_unitario?: number
        costo_unitario?: number
        talles?: any
    }>) => {
        // Delete existing items for this pedido
        await supabase
            .from('sportex_pedidos_items')
            .delete()
            .eq('pedido_id', pedidoId)

        if (items.length === 0) return []

        const rows = items.map(item => ({
            pedido_id: pedidoId,
            tipo_producto: item.tipo_producto,
            descripcion: item.descripcion || null,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario || 0,
            costo_unitario: item.costo_unitario || 0,
            talles: item.talles || [],
        }))

        const { data, error } = await supabase
            .from('sportex_pedidos_items')
            .insert(rows)
            .select()

        if (error) throw error
        return data || []
    }

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
            fetchPedidos()
        }
    }, [fetchPedidos])

    return {
        pedidos,
        etapas,
        loading,
        error,
        crearPedido,
        actualizarPedido,
        moverPedido,
        eliminarPedido,
        uploadBoceto,
        obtenerItems,
        guardarItems,
        crearEtapa,
        actualizarEtapa,
        eliminarEtapa,
        refetch: fetchPedidos,
    }
}
