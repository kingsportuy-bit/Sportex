import { createClient } from '@supabase/supabase-js'

export default async function TestDBPage() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    let status = '⏳ Conectando...'
    let tables: any[] = []
    let error: any = null

    try {
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

        // Intentar leer la tabla de usuarios
        const { data, error: dbError } = await supabase
            .from('sportex_usuarios')
            .select('count')
            .limit(1)

        if (dbError) {
            status = '❌ Error de base de datos'
            error = dbError
        } else {
            status = '✅ Conexión Exitosa'
            tables = data || []
        }
    } catch (e: any) {
        status = '💥 Error Fatal'
        error = e.message
    }

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Diagnóstico de Conexión</h1>

            <div className={`p-4 rounded-lg font-bold ${status.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Estado: {status}
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold">Variables de Entorno:</h2>
                <ul className="list-disc pl-5 font-mono text-sm bg-gray-50 p-4 rounded border">
                    <li>URL: {supabaseUrl ? '✅ Cargada' : '❌ Falta'}</li>
                    <li>ANON_KEY: {supabaseAnonKey ? '✅ Cargada' : '❌ Falta'}</li>
                    <li>SERVICE_KEY: {supabaseServiceKey ? '✅ Cargada' : '❌ Falta'}</li>
                </ul>
            </div>

            {error && (
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-red-600">Detalle del Error:</h2>
                    <pre className="bg-red-50 p-4 rounded border border-red-200 text-sm overflow-auto max-h-60">
                        {JSON.stringify(error, null, 2)}
                    </pre>
                </div>
            )}

            {!error && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded text-blue-800">
                    La base de datos respondió correctamente. La tabla `sportex_usuarios` es accesible.
                </div>
            )}

            <div className="text-sm text-gray-500 italic">
                Esta página es solo para pruebas. Deberías borrarla después de verificar la conexión.
            </div>
        </div>
    )
}
