'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@/components/providers'
import type { Lead, LeadConEtapa, EtapaLead } from '@/types/database'

export function useLeads() {
    const [leads, setLeads] = useState<LeadConEtapa[]>([])
    const [etapas, setEtapas] = useState<EtapaLead[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { userId } = useAuth()
    const supabase = useRef(createClient()).current
    const initialized = useRef(false)

    const fetchLeads = useCallback(async () => {
        if (!userId) return
        try {
            const { data: etapasData, error: etapasError } = await supabase
                .from('sportex_etapas_leads')
                .select('*')
                .eq('activo', true)
                .eq('usuario_id', userId)
                .order('orden')

            if (etapasError) throw etapasError

            // Auto-initialize default stages if none exist
            if (!etapasData || etapasData.length === 0) {
                const defaultStages = [
                    { usuario_id: userId, nombre: 'Nuevo Lead', color: '#6366F1', orden: 0 },
                    { usuario_id: userId, nombre: 'Contactado', color: '#3B82F6', orden: 1 },
                    { usuario_id: userId, nombre: 'Propuesta Enviada', color: '#F59E0B', orden: 2 },
                    { usuario_id: userId, nombre: 'Negociación', color: '#8B5CF6', orden: 3 },
                    { usuario_id: userId, nombre: 'Cerrado Ganado', color: '#10B981', orden: 4 },
                    { usuario_id: userId, nombre: 'Cerrado Perdido', color: '#EF4444', orden: 5 },
                ]

                const { error: insertError } = await supabase
                    .from('sportex_etapas_leads')
                    .insert(defaultStages)

                if (insertError) throw insertError

                const { data: newEtapas } = await supabase
                    .from('sportex_etapas_leads')
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

            const { data: leadsData, error: leadsError } = await supabase
                .from('sportex_leads')
                .select(`
                    *,
                    etapa:sportex_etapas_leads(id, nombre, color)
                `)
                .eq('usuario_id', userId)
                .order('orden_en_etapa')

            if (leadsError) throw leadsError
            setLeads(leadsData || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setLoading(false)
        }
    }, [supabase, userId])

    // ---- Optimistic CRUD ----

    const crearLead = async (lead: Partial<Lead>) => {
        if (!userId) throw new Error('No hay sesión')
        const { data, error } = await supabase
            .from('sportex_leads')
            .insert({ ...lead, usuario_id: userId })
            .select(`*, etapa:sportex_etapas_leads(id, nombre, color)`)
            .single()

        if (error) throw error
        // Optimistic: just append
        if (data) setLeads(prev => [...prev, data])
        return data
    }

    const actualizarLead = async (id: string, updates: Partial<Lead>) => {
        // Optimistic update
        setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))

        const { error } = await supabase
            .from('sportex_leads')
            .update(updates)
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            // Revert on failure
            await fetchLeads()
            throw error
        }
    }

    const moverLead = async (leadId: string, nuevaEtapaId: string, nuevoOrden: number) => {
        if (!userId) return
        const leadActual = leads.find(l => l.id === leadId)

        // Optimistic: update etapa_id locally
        const targetEtapa = etapas.find(e => e.id === nuevaEtapaId)
        setLeads(prev => prev.map(l =>
            l.id === leadId
                ? {
                    ...l,
                    etapa_id: nuevaEtapaId,
                    orden_en_etapa: nuevoOrden,
                    etapa: targetEtapa || l.etapa,
                }
                : l
        ) as LeadConEtapa[])

        const { error } = await supabase
            .from('sportex_leads')
            .update({ etapa_id: nuevaEtapaId, orden_en_etapa: nuevoOrden })
            .eq('id', leadId)
            .eq('usuario_id', userId)

        if (error) {
            await fetchLeads()
            throw error
        }

        // Record history if stage changed
        if (leadActual && leadActual.etapa_id !== nuevaEtapaId) {
            await supabase
                .from('sportex_leads_historial')
                .insert({
                    lead_id: leadId,
                    etapa_anterior_id: leadActual.etapa_id,
                    etapa_nueva_id: nuevaEtapaId,
                })
        }
    }

    const eliminarLead = async (id: string) => {
        // Optimistic: remove immediately
        setLeads(prev => prev.filter(l => l.id !== id))

        const { error } = await supabase
            .from('sportex_leads')
            .delete()
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchLeads()
            throw error
        }
    }

    const convertirACliente = async (leadId: string) => {
        if (!userId) return
        const lead = leads.find(l => l.id === leadId)
        if (!lead) throw new Error('Lead no encontrado')

        const { error: clienteError } = await supabase
            .from('sportex_clientes')
            .insert({
                usuario_id: userId,
                nombre: lead.nombre,
                nombre_club: lead.nombre_club,
                email: lead.email,
                telefono: lead.telefono,
                notas: lead.notas,
            })

        if (clienteError) throw clienteError

        await eliminarLead(leadId)
    }

    // ---- Stage CRUD (optimistic) ----

    const crearEtapa = async (etapa: Partial<EtapaLead>) => {
        if (!userId) throw new Error('No hay sesión')
        const { data, error } = await supabase
            .from('sportex_etapas_leads')
            .insert({ ...etapa, usuario_id: userId, orden: etapas.length })
            .select()
            .single()

        if (error) throw error
        if (data) setEtapas(prev => [...prev, data])
    }

    const actualizarEtapa = async (id: string, updates: Partial<EtapaLead>) => {
        setEtapas(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))

        const { error } = await supabase
            .from('sportex_etapas_leads')
            .update(updates)
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchLeads()
            throw error
        }
    }

    const eliminarEtapa = async (id: string) => {
        setEtapas(prev => prev.filter(e => e.id !== id))

        const { error } = await supabase
            .from('sportex_etapas_leads')
            .delete()
            .eq('id', id)
            .eq('usuario_id', userId)

        if (error) {
            await fetchLeads()
            throw error
        }
    }

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true
            fetchLeads()
        }
    }, [fetchLeads])

    return {
        leads,
        etapas,
        loading,
        error,
        crearLead,
        actualizarLead,
        moverLead,
        eliminarLead,
        convertirACliente,
        crearEtapa,
        actualizarEtapa,
        eliminarEtapa,
        refetch: fetchLeads,
    }
}
