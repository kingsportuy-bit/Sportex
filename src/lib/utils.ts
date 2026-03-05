import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Formatear moneda argentina
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

// Formatear fecha
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy', { locale: es })
}

// Formatear fecha corta
export function formatDateShort(date: string | Date): string {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd MMM', { locale: es })
}

// Calcular días hasta entrega
export function daysUntilDelivery(deliveryDate: string | Date | null): number | null {
    if (!deliveryDate) return null
    const d = typeof deliveryDate === 'string' ? parseISO(deliveryDate) : deliveryDate
    return differenceInDays(d, new Date())
}

// Obtener color según días restantes
export function getDeliveryStatusColor(days: number | null): string {
    if (days === null) return 'text-gray-400'
    if (days < 0) return 'text-red-500' // Atrasado
    if (days <= 3) return 'text-red-500' // Urgente
    if (days <= 7) return 'text-yellow-500' // Próximo
    return 'text-green-500' // Tranquilo
}

// Obtener etiqueta según días restantes
export function getDeliveryStatusLabel(days: number | null): string {
    if (days === null) return 'Sin fecha'
    if (days < 0) return `${Math.abs(days)} días de atraso`
    if (days === 0) return 'Entregar HOY'
    if (days === 1) return 'Entrega mañana'
    return `${days} días`
}

// Generar número de pedido
export function generateOrderNumber(): string {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `PED-${year}${month}-${random}`
}

// Calcular ganancia
export function calculateProfit(price: number, cost: number): number {
    return price - cost
}

// Calcular margen de ganancia
export function calculateMargin(price: number, cost: number): number {
    if (price === 0) return 0
    return ((price - cost) / price) * 100
}
