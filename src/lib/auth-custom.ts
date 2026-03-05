import { createClient } from '@/lib/supabase/client'

export async function loginCustom(email: string, password: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('sportex_usuarios')
        .select('id, email, password')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle() // Usamos maybeSingle para manejar el "no encontrado" sin error de Postgres

    if (error) {
        console.error('Error de login:', error)
        throw new Error('Error técnico al intentar iniciar sesión')
    }

    if (!data) {
        throw new Error('Email o contraseña incorrectos')
    }

    return data
}

export async function registerCustom(email: string, password: string, nombreEmpresa: string) {
    const supabase = createClient()

    // 1. Verificar si existe - Usamos .maybeSingle() para evitar error si no existe
    const { data: existing, error: checkError } = await supabase
        .from('sportex_usuarios')
        .select('id')
        .eq('email', email)
        .maybeSingle()

    if (existing) {
        throw new Error('El email ya está registrado')
    }

    // 2. Crear usuario
    const { data, error } = await supabase
        .from('sportex_usuarios')
        .insert({
            email,
            password,
            nombre_empresa: nombreEmpresa,
        })
        .select()
        .single()

    if (error) {
        console.error('Error detallado de Supabase:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        throw new Error(`Error de base de datos: ${error.message} (${error.code})`)
    }
    return data
}
