import { createClient } from '@supabase/supabase-js'

async function testInsert() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('🔗 Conectando a:', supabaseUrl)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const testData = {
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        nombre_empresa: 'Empresa Test'
    }

    console.log('📝 Intentando insertar:', testData)

    const { data, error } = await supabase
        .from('sportex_usuarios')
        .insert(testData)
        .select()

    if (error) {
        console.error('❌ ERROR DETECTADO:')
        console.error('Mensaje:', error.message)
        console.error('Código:', error.code)
        console.error('Detalles:', error.details)
        console.error('Hint:', error.hint)
        console.error('Todo el objeto:', error)
    } else {
        console.log('✅ ÉXITO:', data)
    }
}

testInsert()
