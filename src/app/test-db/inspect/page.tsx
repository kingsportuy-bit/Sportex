import { createClient } from '@supabase/supabase-js'

export default async function InspectPage() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    let result = {
        success: false,
        message: 'No iniciado',
        details: null as any,
        columns: [] as string[]
    }

    try {
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

        // Intentar un select limitado para ver si las columnas existen y son accesibles
        const { data, error } = await supabase
            .from('sportex_usuarios')
            .select('id, email, password, nombre_empresa')
            .limit(1)

        if (error) {
            result.success = false
            result.message = '❌ Error al acceder a las columnas'
            result.details = error
        } else {
            result.success = true
            result.message = '✅ Columnas accesibles correctamente'
            result.columns = ['id', 'email', 'password', 'nombre_empresa']
            result.details = data
        }
    } catch (e: any) {
        result.message = '💥 Fallo crítico de conexión'
        result.details = e.message
    }

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-6 font-sans">
            <h1 className="text-3xl font-bold">Inspección de sportex_usuarios</h1>

            <div className={`p-4 rounded-lg font-bold ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Resultado: {result.message}
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h2 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-widest">Detalles Técnicos</h2>
                <pre className="text-xs overflow-auto bg-black text-green-400 p-4 rounded-lg shadow-inner max-h-80">
                    {JSON.stringify(result.details, null, 2)}
                </pre>
            </div>

            {result.success && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                    <p className="font-bold">✨ ¡Todo parece perfecto!</p>
                    <p>La tabla tiene las columnas necesarias y la Service Key funciona.</p>
                </div>
            )}
        </div>
    )
}
