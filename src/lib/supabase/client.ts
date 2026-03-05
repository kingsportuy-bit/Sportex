import { createBrowserClient } from '@supabase/ssr'

// Nota: Los tipos de Database se pueden generar con 'supabase gen types typescript'
// Por ahora usamos el cliente sin tipos estrictos hasta que se creen las tablas
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
