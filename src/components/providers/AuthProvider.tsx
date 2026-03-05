'use client'

import { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
    userId: string | null
}

const AuthContext = createContext<AuthContextType>({ userId: null })

export function AuthProvider({
    userId,
    children
}: {
    userId: string | null,
    children: ReactNode
}) {
    return (
        <AuthContext.Provider value={{ userId }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
