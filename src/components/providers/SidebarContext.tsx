'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
    collapsed: boolean
    toggleCollapsed: () => void
    setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false)

    // Load initial state from localStorage if available
    useEffect(() => {
        const stored = localStorage.getItem('sidebar_collapsed')
        if (stored) {
            setCollapsed(JSON.parse(stored))
        }
    }, [])

    const toggleCollapsed = () => {
        setCollapsed(prev => {
            const newState = !prev
            localStorage.setItem('sidebar_collapsed', JSON.stringify(newState))
            return newState
        })
    }

    const value = {
        collapsed,
        toggleCollapsed,
        setCollapsed
    }

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}
