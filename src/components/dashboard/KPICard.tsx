import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Package,
    Clock,
    CheckCircle,
    AlertTriangle
} from 'lucide-react'

interface KPICardProps {
    title: string
    value: string
    subtitle?: string
    trend?: {
        value: number
        isPositive: boolean
    }
    icon: 'income' | 'expense' | 'profit' | 'orders' | 'pending' | 'completed' | 'warning'
    color: 'blue' | 'green' | 'red' | 'orange' | 'purple'
}

const iconMap = {
    income: DollarSign,
    expense: TrendingDown,
    profit: TrendingUp,
    orders: Package,
    pending: Clock,
    completed: CheckCircle,
    warning: AlertTriangle,
}

const colorMap = {
    blue: {
        bg: 'var(--color-dark-700)',
        border: 'var(--color-dark-600)',
        text: 'var(--color-dark-100)',
        icon: '#60A5FA',
    },
    green: {
        bg: 'var(--color-dark-700)',
        border: 'var(--color-dark-600)',
        text: 'var(--color-dark-100)',
        icon: '#34D399',
    },
    red: {
        bg: 'var(--color-dark-700)',
        border: 'var(--color-dark-600)',
        text: 'var(--color-dark-100)',
        icon: '#F87171',
    },
    orange: {
        bg: 'var(--color-dark-700)',
        border: 'var(--color-dark-600)',
        text: 'var(--color-dark-100)',
        icon: '#FBBF24',
    },
    purple: {
        bg: 'var(--color-dark-700)',
        border: 'var(--color-dark-600)',
        text: 'var(--color-dark-100)',
        icon: '#A78BFA',
    },
}

export function KPICard({ title, value, subtitle, trend, icon, color }: KPICardProps) {
    const Icon = iconMap[icon]
    const colors = colorMap[color]

    return (
        <div className="card card-hover">
            <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                    <p className="text-sm font-semibold text-dark-200 uppercase tracking-wide mb-2">
                        {title}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-dark-300 mb-3">
                            {subtitle}
                        </p>
                    )}
                    <p className="text-3xl font-bold text-dark-100 mb-3">
                        {value}
                    </p>
                    {trend && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>
                <div className="p-3 rounded-xl" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                    <Icon size={24} style={{ color: colors.icon }} strokeWidth={2} />
                </div>
            </div>
        </div>
    )
}