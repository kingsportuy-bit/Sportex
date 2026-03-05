import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno manualmente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Error: Faltan variables de entorno en .env.local')
    process.exit(1)
}

// Cliente con Service Role (Bypassa RLS y confirmaciones de email)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function createAdminUser() {
    const email = process.argv[2] || 'admin@sportex.com'
    const password = process.argv[3] || 'admin123'

    console.log(`🚀 Intentando crear usuario: ${email}...`)

    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Esto confirma el email automáticamente
        user_metadata: {
            nombre_empresa: 'SPORTEX Demo'
        }
    })

    if (error) {
        console.error('❌ Error al crear usuario:', error.message)
        process.exit(1)
    }

    console.log('✅ Usuario creado y confirmado exitosamente!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Contraseña: ${password}`)
    console.log('\nYa podés iniciar sesión en http://localhost:3001/login')
}

createAdminUser()
