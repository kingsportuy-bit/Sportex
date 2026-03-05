'use server'

import { createClient } from '@supabase/supabase-js'
import { createSession, deleteSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

// Server-side admin client to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

const SALT_ROUNDS = 10

export async function loginAction(email: string, password: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('sportex_usuarios')
            .select('id, email, password')
            .eq('email', email)
            .maybeSingle()

        if (error) throw error
        if (!data) throw new Error('Email o contraseña incorrectos')

        // Compare hashed password
        const isValid = data.password
            ? (data.password.startsWith('$2')
                ? await bcrypt.compare(password, data.password)
                : data.password === password) // Fallback for legacy plaintext passwords
            : false

        if (!isValid) throw new Error('Email o contraseña incorrectos')

        await createSession(data.id)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function registerAction(email: string, password: string, nombreEmpresa: string) {
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor')
        }

        // Check if user already exists
        const { data: existing, error: checkError } = await supabaseAdmin
            .from('sportex_usuarios')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        if (checkError) throw new Error(`Error de verificación: ${checkError.message}`)
        if (existing) return { success: false, error: 'Este email ya está en uso' }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

        // Create user
        const { data, error } = await supabaseAdmin
            .from('sportex_usuarios')
            .insert({
                email,
                password: hashedPassword,
                nombre_empresa: nombreEmpresa,
            })
            .select()
            .single()

        if (error) {
            return {
                success: false,
                error: `Error de BD: ${error.message || 'Sin mensaje'}. Código: ${error.code || 'n/a'}.`
            }
        }

        // Create session
        await createSession(data.id)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || 'Error interno del servidor' }
    }
}

export async function logoutAction() {
    await deleteSession()
    return { success: true }
}
