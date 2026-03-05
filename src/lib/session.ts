'use server'

import { cookies } from 'next/headers'

const SESSION_COOKIE = 'sportex_user_id'

export async function createSession(userId: string) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 semana
    })
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
}

export async function getSession() {
    const cookieStore = await cookies()
    return cookieStore.get(SESSION_COOKIE)?.value
}
