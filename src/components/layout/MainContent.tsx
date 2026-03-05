'use client'

import { useSidebar } from '@/components/providers/SidebarContext'

export function MainContent({ children }: { children: React.ReactNode }) {
    const { collapsed } = useSidebar()

    return (
        <div
            className="transition-all duration-300 ease-in-out min-h-screen w-full"
            style={{
                marginLeft: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
            }}
        >
            {children}
        </div>
    )
}