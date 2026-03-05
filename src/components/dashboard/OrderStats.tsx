import { Clock, AlertTriangle, CheckCircle, Package } from 'lucide-react'

interface OrderStatsProps {
    total: number
    pending: number
    delivered: number
    urgent: number
}

const stats = [
    { key: 'total', icon: Package, label: 'Total', color: '#818CF8', bg: 'rgba(99,102,241,0.1)' },
    { key: 'pending', icon: Clock, label: 'Pendientes', color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
    { key: 'delivered', icon: CheckCircle, label: 'Entregados', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
    { key: 'urgent', icon: AlertTriangle, label: 'Urgentes', color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
] as const

export function OrderStats({ total, pending, delivered, urgent }: OrderStatsProps) {
    const values = { total, pending, delivered, urgent }

    return (
        <div className="card mt-2">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-dark-700">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-dark-100">Resumen de Operaciones</h3>
                    <p className="text-xs font-medium uppercase tracking-widest text-dark-300">Estado actual de órdenes</p>
                </div>
                <div className="p-3 bg-dark-700 rounded-xl border border-dark-600">
                    <Package size={20} className="text-dark-200" strokeWidth={2} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ key, icon: Icon, label, color, bg }) => (
                    <div key={key} className="p-5 rounded-2xl transition-all duration-300 hover:scale-105 border border-dark-700 bg-dark-800"
                        style={{ background: 'var(--color-dark-800)' }}>
                        
                        <div className="flex flex-col items-center sm:items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
                                 style={{ background: bg }}>
                                <Icon size={20} style={{ color }} strokeWidth={2.5} />
                            </div>
                            <div className="text-center sm:text-left space-y-1">
                                <p className="text-2xl font-bold text-dark-100">{values[key]}</p>
                                <p className="text-xs font-semibold uppercase tracking-widest text-dark-300">{label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
