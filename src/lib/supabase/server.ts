import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Nota: Los tipos de Database se pueden generar con 'supabase gen types typescript'
// Por ahora usamos el cliente sin tipos estrictos hasta que se creen las tablas
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Esto puede fallar en Server Components, 
                        // pero está bien porque las cookies aún se actualizan en middleware
                    }
                },
            },
        }
    )
}
